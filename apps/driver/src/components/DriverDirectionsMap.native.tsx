import { env } from '@/config/env';
import { formatRemainingMeters, normalizeStepDistances, providerScale } from '@/lib/navigationMetrics';
import type { MapDirections, RideCoordinates } from '@datxe/shared';
import { MotionPressable as Pressable, Typography as Text, borderRadius, spacing, typography, useReducedMotion, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';
import {
  distanceMeters,
  projectOnRoute,
  routeCumulativeMeters,
  type MapViewportInsets,
} from '@datxe/ui/goong-map';
import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { DriverRouteLayers } from './DriverRouteLayers';

type Props = {
  destination: RideCoordinates;
  targetLabel?: string;
  directions?: MapDirections | null;
  viewport?: MapViewportInsets;
  onRefresh?: () => void;
};

// Cùng một nhịp cho GPS, nội suy chấm và chuyển camera: chấm không bị giật giữa 2 fix.
const GPS_TIME_INTERVAL_MS = 1000;
const GPS_DISTANCE_INTERVAL_M = 3;
const SMOOTHING_MS = GPS_TIME_INTERVAL_MS;
const REROUTE_OFFSET_METERS = 40;

function arrowFor(instruction: string): string {
  const value = instruction.toLowerCase();
  // Chỉ bắt cụm hành động (rẽ phải/rẽ trái/quay đầu), tránh nhầm khi tên đường có "trái"/"phải".
  const maneuver = value.match(/(?:rẽ|turn)\s+(?:phải|right)|(?:rẽ|turn)\s+(?:trái|left)|quay đầu|u-turn/)?.[0] ?? '';
  if (maneuver.includes('quay') || maneuver.includes('u-turn')) return '↺';
  if (maneuver.includes('trái') || maneuver.includes('left')) return '←';
  if (maneuver.includes('phải') || maneuver.includes('right')) return '→';
  return '↑';
}

// Chỉ dẫn phải luôn đọc bằng tiếng Việt. Nếu provider trả tiếng Anh, dịch nhanh
// các mẫu phổ biến; tiếng Việt giữ nguyên.
function localizeInstruction(value: string): string {
  return value
    .replace(/^In\s+([\d.,]+)\s*m(?:eters?)?\b/i, 'Sau $1 mét')
    .replace(/^In\s+([\d.,]+)\s*kilometers?\b/i, 'Sau $1 km')
    .replace(/^In\s+([\d.,]+)\s*feet\b/i, 'Sau $1 feet')
    .replace(/^Then\s+/i, 'Sau đó ')
    .replace(/^Turn right onto\s+/i, 'Rẽ phải vào ')
    .replace(/^Turn left onto\s+/i, 'Rẽ trái vào ')
    .replace(/^Turn right on\s+/i, 'Rẽ phải vào ')
    .replace(/^Turn left on\s+/i, 'Rẽ trái vào ')
    .replace(/^Continue straight onto\s+/i, 'Đi thẳng vào ')
    .replace(/^Continue straight on\s+/i, 'Đi thẳng vào ')
    .replace(/^Continue straight\s*$/i, 'Đi thẳng')
    .replace(/^Make a U-turn onto\s+/i, 'Quay đầu vào ')
    .replace(/^Head\s+/i, 'Đi ')
    .replace(/\bonto\b/gi, 'vào')
    .replace(/\bon the right\b/gi, 'bên phải')
    .replace(/\bon the left\b/gi, 'bên trái')
    .replace(/\bDestination\b/gi, 'Điểm đến');
}

// Tách tên đường khỏi câu chỉ dẫn để hiển thị badge.
function roadName(instruction: string): string {
  const match = instruction.match(/(?:từ|vào|đến|trên|theo)\s+(.+)$/i);
  return (match ? match[1] : instruction).trim();
}

export function DriverDirectionsMap({ destination, targetLabel = 'điểm đón', directions, viewport, onRefresh }: Props) {
  const colors = useThemeColors();
  const styles = useThemedStyles(themedStyles);
  const reducedMotion = useReducedMotion();
  const camera = useRef<CameraRef>(null);
  const [current, setCurrent] = useState<RideCoordinates | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);
  const announced = useRef<Set<number>>(new Set());
  const announcedAhead = useRef<Set<string>>(new Set());
  const lastSpokenStepAt = useRef(0);
  const overviewShown = useRef(false);
  const mapStyle = env.goongStyleUrl;

  useEffect(() => {
    if (voiceMuted) void Speech.stop();
  }, [voiceMuted]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const nextActive = nextState === 'active';
      setIsAppActive(nextActive);
      if (!nextActive) void Speech.stop();
    });
    return () => {
      subscription.remove();
      void Speech.stop();
    };
  }, []);

  // Chọn giọng đọc tiếng Việt có sẵn trên thiết bị.
  useEffect(() => {
    void Speech.getAvailableVoicesAsync()
      .then(voices => {
        const vietnamese = voices.find(voice => voice.language?.toLowerCase().startsWith('vi'));
        if (vietnamese) setVoiceId(vietnamese.identifier);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setCurrent({ lat: initial.coords.latitude, lng: initial.coords.longitude });
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: GPS_DISTANCE_INTERVAL_M, timeInterval: GPS_TIME_INTERVAL_MS },
        position => { if (active) setCurrent({ lat: position.coords.latitude, lng: position.coords.longitude }); },
      );
    })().catch(() => undefined);
    return () => { active = false; subscription?.remove(); };
  }, []);

  const coordinates = useMemo(() => directions?.coordinates ?? [], [directions?.coordinates]);
  const steps = useMemo(() => directions?.steps ?? [], [directions?.steps]);
  const routeSignature = useMemo(
    () => `${destination.lat},${destination.lng}:${steps.map(step => `${step.instruction}:${Math.round(step.distanceMeters)}`).join('|')}`,
    [destination.lat, destination.lng, steps],
  );
  // Route mới (re-route hoặc đổi đích đón/trả) đọc lại từ đầu; refetch cùng tuyến giữ nguyên trạng thái đã đọc.
  useEffect(() => {
    announced.current.clear();
    announcedAhead.current.clear();
    lastSpokenStepAt.current = 0;
  }, [routeSignature]);

  const routeCumulative = useMemo(() => routeCumulativeMeters(coordinates), [coordinates]);

  // Chiếu vị trí lên đoạn thẳng của polyline thay vì lấy đỉnh gần nhất: tiến độ chạy
  // liên tục ngay cả khi tài xế còn nửa đoạn tới đỉnh kế tiếp.
  const projection = useMemo(
    () => (current && coordinates.length > 0 ? projectOnRoute(coordinates, routeCumulative, current) : null),
    [current, coordinates, routeCumulative],
  );
  const progress = projection?.alongMeters ?? 0;

  // Khoảng cách dọc polyline (haversine) nhỏ hơn khoảng cách thực do provider trả.
  // Quy đổi tiến độ theo tổng khoảng cách thực để chọn đúng bước.
  const scaledProgress = useMemo(() => {
    const routeTotal = routeCumulative[routeCumulative.length - 1] ?? 0;
    return progress * providerScale(routeTotal, directions?.distance);
  }, [progress, routeCumulative, directions?.distance]);

  // Tổng các bước được kéo về đúng tổng mét của provider để màn hình và giọng nói về 0 cùng lúc.
  const stepDistances = useMemo(
    () => normalizeStepDistances(steps, directions?.distance),
    [steps, directions?.distance],
  );

  const stepIndex = useMemo(() => {
    if (stepDistances.length === 0) return 0;
    let cumulative = 0;
    for (let cursor = 0; cursor < stepDistances.length; cursor += 1) {
      cumulative += stepDistances[cursor];
      if (scaledProgress <= cumulative) return cursor;
    }
    return stepDistances.length - 1;
  }, [scaledProgress, stepDistances]);

  // Điều phối một lượt phát giọng nói duy nhất mỗi bước/ngưỡng, tránh tự hủy lời nhắc cùng render.
  useEffect(() => {
    if (!isAppActive || !current || steps.length === 0 || voiceMuted) return;
    const stepEnd = stepDistances.slice(0, stepIndex + 1).reduce((sum, value) => sum + value, 0);
    const remaining = Math.max(0, stepEnd - scaledProgress);
    const next = steps[stepIndex + 1];

    if (next && remaining <= 20 && !announcedAhead.current.has(`${stepIndex}:now`)) {
      announcedAhead.current.add(`${stepIndex}:now`);
      announced.current.add(stepIndex);
      const text = `Bây giờ, ${localizeInstruction(next.instruction).trim()}`;
      if (text.trim()) {
        void Speech.stop();
        Speech.speak(text, { language: 'vi-VN', voice: voiceId, rate: 0.95, pitch: 1 });
      }
      return;
    }

    if (!announced.current.has(stepIndex)) {
      const text = localizeInstruction(steps[stepIndex]?.instruction ?? '').trim();
      if (text) {
        announced.current.add(stepIndex);
        lastSpokenStepAt.current = Date.now();
        void Speech.stop();
        Speech.speak(text, { language: 'vi-VN', voice: voiceId, rate: 0.95, pitch: 1 });
      }
      return;
    }

    if (!next || Date.now() - lastSpokenStepAt.current < 3500) return;
    const threshold = [300, 100, 30].find(value => remaining <= value && !announcedAhead.current.has(`${stepIndex}:${value}`));
    if (threshold === undefined) return;
    for (const candidate of [300, 100, 30]) {
      if (candidate >= threshold) announcedAhead.current.add(`${stepIndex}:${candidate}`);
    }
    const text = `Sau ${formatRemainingMeters(remaining)}, ${localizeInstruction(next.instruction).trim()}`;
    void Speech.stop();
    Speech.speak(text, { language: 'vi-VN', voice: voiceId, rate: 0.95, pitch: 1 });
  }, [current, isAppActive, scaledProgress, stepDistances, stepIndex, steps, voiceId, voiceMuted]);

  useEffect(() => {
    if (!current) return;
    if (!overviewShown.current && coordinates.length > 1) {
      overviewShown.current = true;
      const lngs = coordinates.map(point => point.lng);
      const lats = coordinates.map(point => point.lat);
      camera.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: (viewport?.top ?? 80) + 120, bottom: (viewport?.bottom ?? 140) + 40, left: 40, right: 40 }, duration: 500 },
      );
      return;
    }
    camera.current?.easeTo({
      center: [current.lng, current.lat],
      zoom: 17,
      duration: reducedMotion ? 0 : SMOOTHING_MS,
      easing: 'linear',
    });
  }, [current, coordinates, reducedMotion, viewport?.top, viewport?.bottom]);

  // Tự cập nhật tuyến đường: lệch tim tuyến > 40 m, hoặc đã đi > 25 m sau mỗi 20 giây.
  const lastRefresh = useRef<{ at: number; position: RideCoordinates } | null>(null);
  useEffect(() => {
    if (!current || !onRefresh || coordinates.length === 0) return;
    const now = Date.now();
    const previous = lastRefresh.current;
    if (!previous) { lastRefresh.current = { at: now, position: current }; return; }
    const elapsed = now - previous.at;
    const moved = distanceMeters(previous.position, current);
    const offRoute = (projection?.offsetMeters ?? 0) > REROUTE_OFFSET_METERS;
    if ((offRoute && elapsed > 5000) || (elapsed > 20000 && moved > 25)) {
      lastRefresh.current = { at: now, position: current };
      onRefresh();
    }
  }, [current, coordinates, onRefresh, projection]);

  const step = steps[stepIndex];
  const stepEnd = stepDistances.slice(0, stepIndex + 1).reduce((sum, value) => sum + value, 0);
  const stepRemaining = Math.max(0, stepEnd - scaledProgress);
  const displayInstruction = localizeInstruction(step?.instruction ?? '') || `Đang đi tới ${targetLabel}`;
  const road = roadName(displayInstruction) || `Đi tới ${targetLabel}`;
  const nextRoad = steps[stepIndex + 1] ? roadName(localizeInstruction(steps[stepIndex + 1].instruction)) : '';

  if (!mapStyle) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Thiếu EXPO_PUBLIC_GOONG_MAP_KEY để hiển thị bản đồ.</Text></View>;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        androidView="texture"
        logo={false}
        attributionPosition={{ bottom: 8, left: 8 }}
      >
        <Camera ref={camera} maxZoom={19}
          initialViewState={{ center: [current?.lng ?? destination.lng, current?.lat ?? destination.lat], zoom: 17 }} />
        <DriverRouteLayers
          coordinates={coordinates}
          target={current}
          destination={destination}
          destinationColor={colors.success}
          smoothingMs={SMOOTHING_MS}
          animate={!reducedMotion}
        />
      </Map>
      <View pointerEvents="box-none" style={[styles.topOverlay, { top: (viewport?.top ?? 0) + spacing.spaceSm }]}>
        <View style={styles.maneuver}>
          <View style={styles.maneuverRow}>
            <Text style={styles.maneuverArrow}>{arrowFor(displayInstruction)}</Text>
            <View style={styles.roadBadge}>
              <Text style={styles.roadBadgeText} numberOfLines={1}>{road}</Text>
            </View>
          </View>
          <Text style={styles.maneuverInstruction} numberOfLines={2}>{displayInstruction}</Text>
          <Text style={styles.maneuverDistance}>{step ? formatRemainingMeters(stepRemaining) : ''}</Text>
          {nextRoad ? (
            <>
              <View style={styles.maneuverDivider} />
              <Text style={styles.thenText} numberOfLines={1}>Sau đó {nextRoad}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.mapControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voiceMuted ? 'Bật giọng chỉ đường' : 'Tắt giọng chỉ đường'}
            style={styles.mapControl}
            onPress={() => { const next = !voiceMuted; setVoiceMuted(next); if (next) void Speech.stop(); }}
          >
            <MaterialIcons name={voiceMuted ? 'volume-off' : 'volume-up'} size={22} color={colors.onSurface} />
          </Pressable>
          {onRefresh ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Cập nhật tuyến đường" style={styles.mapControl}
              onPress={() => { overviewShown.current = false; onRefresh(); }}>
              <MaterialIcons name="refresh" size={22} color={colors.onSurface} />
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Xem toàn bộ lộ trình" style={styles.mapControl}
            onPress={() => {
              if (coordinates.length < 2) return;
              const lngs = coordinates.map(point => point.lng);
              const lats = coordinates.map(point => point.lat);
              camera.current?.fitBounds(
                [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
                { padding: { top: (viewport?.top ?? 80) + 120, bottom: (viewport?.bottom ?? 140) + 40, left: 40, right: 40 }, duration: 400 },
              );
            }}
          >
            <MaterialIcons name="alt-route" size={22} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const themedStyles = (c: ThemeColors) => StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, gap: spacing.px3, padding: spacing.spaceLg },
  emptyText: { ...typography.bodySecondary, color: c.onSurfaceVariant, textAlign: 'center' },
  topOverlay: { position: 'absolute', left: spacing.margin, right: spacing.margin, gap: spacing.spaceSm },
  maneuver: { paddingHorizontal: spacing.spaceMd, paddingVertical: spacing.px3, borderRadius: borderRadius.default, backgroundColor: c.primary, gap: spacing.xxs },
  maneuverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  maneuverArrow: { ...typography.sectionTitle, color: c.onPrimary },
  roadBadge: { flexShrink: 1, backgroundColor: c.surfaceContainerLowest, borderRadius: borderRadius.sm, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.xxs },
  roadBadgeText: { ...typography.label, color: c.onSurface },
  maneuverInstruction: { ...typography.body, color: c.onPrimary, marginTop: spacing.xxs },
  maneuverDistance: { ...typography.label, color: c.onPrimary, marginLeft: spacing.spaceLg, fontVariant: ['tabular-nums'] },
  maneuverDivider: { height: StyleSheet.hairlineWidth, backgroundColor: c.outlineVariant, marginTop: spacing.xxs },
  thenText: { ...typography.bodySecondary, color: c.onPrimary, marginTop: spacing.xxs },
  mapControls: { alignSelf: 'flex-end', gap: spacing.spaceSm },
  mapControl: { width: 48, height: 48, borderRadius: borderRadius.full, backgroundColor: c.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
});
