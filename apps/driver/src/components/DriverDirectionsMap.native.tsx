import { env } from '@/config/env';
import type { MapDirections, RideCoordinates } from '@datxe/shared';
import { MotionPressable as Pressable, Typography as Text, borderRadius, spacing, typography, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';
import {
  CURRENT_LOCATION_BLUE,
  CURRENT_LOCATION_RING,
  TRIP_ROUTE_CASING,
  TRIP_ROUTE_COLOR,
  type MapViewportInsets,
} from '@datxe/ui/goong-map';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  destination: RideCoordinates;
  targetLabel?: string;
  directions?: MapDirections | null;
  viewport?: MapViewportInsets;
  onRefresh?: () => void;
};

function distanceMeters(a: RideCoordinates, b: RideCoordinates): number {
  const radius = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

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
  const camera = useRef<CameraRef>(null);
  const [current, setCurrent] = useState<RideCoordinates | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);
  const announced = useRef<Set<number>>(new Set());
  const announcedAhead = useRef<Set<string>>(new Set());
  // Route mới (re-route) phải đọc lại từ đầu.
  useEffect(() => { announced.current.clear(); announcedAhead.current.clear(); }, [directions]);
  const voiceMutedRef = useRef(false);
  const overviewShown = useRef(false);
  const mapStyle = env.goongStyleUrl;

  useEffect(() => { voiceMutedRef.current = voiceMuted; }, [voiceMuted]);
  useEffect(() => () => { void Speech.stop(); }, []);

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
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        position => { if (active) setCurrent({ lat: position.coords.latitude, lng: position.coords.longitude }); },
      );
    })().catch(() => undefined);
    return () => { active = false; subscription?.remove(); };
  }, []);

  const coordinates = useMemo(() => directions?.coordinates ?? [], [directions?.coordinates]);
  const steps = useMemo(() => directions?.steps ?? [], [directions?.steps]);

  const routeCumulative = useMemo(() => {
    const cumulative = [0];
    for (let index = 1; index < coordinates.length; index += 1) {
      cumulative.push(cumulative[index - 1] + distanceMeters(coordinates[index - 1], coordinates[index]));
    }
    return cumulative;
  }, [coordinates]);

  const { progress, nearestIndex } = useMemo(() => {
    if (!current || coordinates.length === 0) return { progress: 0, nearestIndex: 0 };
    let best = 0;
    let bestDistance = Infinity;
    for (let index = 0; index < coordinates.length; index += 1) {
      const value = distanceMeters(coordinates[index], current);
      if (value < bestDistance) { bestDistance = value; best = index; }
    }
    return { progress: routeCumulative[best] ?? 0, nearestIndex: best };
  }, [current, coordinates, routeCumulative]);

  // Khoảng cách dọc polyline (haversine) nhỏ hơn khoảng cách thực do provider trả.
  // Quy đổi tiến độ theo tổng khoảng cách thực để chọn đúng bước.
  const scaledProgress = useMemo(() => {
    const routeTotal = routeCumulative[routeCumulative.length - 1] ?? 0;
    const actualTotal = directions?.distance ?? routeTotal;
    return routeTotal > 0 && actualTotal > 0 ? (progress / routeTotal) * actualTotal : progress;
  }, [progress, routeCumulative, directions?.distance]);

  const stepIndex = useMemo(() => {
    if (steps.length === 0) return 0;
    let cumulative = 0;
    for (let cursor = 0; cursor < steps.length; cursor += 1) {
      cumulative += steps[cursor].distanceMeters;
      if (scaledProgress <= cumulative) return cursor;
    }
    return steps.length - 1;
  }, [scaledProgress, steps]);

  useEffect(() => {
    if (steps.length === 0) return;
    if (!announced.current.has(stepIndex)) {
      announced.current.add(stepIndex);
      const text = localizeInstruction(steps[stepIndex]?.instruction ?? '').trim();
      if (text && !voiceMutedRef.current) {
        void Speech.stop();
        Speech.speak(text, { language: 'vi-VN', voice: voiceId, rate: 0.95, pitch: 1 });
      }
    }
  }, [stepIndex, steps, voiceId]);

  // Báo trước chặng kế ("Sau 300/100/30 m, ...") giống app dẫn đường.
  useEffect(() => {
    if (steps.length === 0 || voiceMutedRef.current) return;
    const next = steps[stepIndex + 1];
    if (!next) return;
    const stepEnd = steps.slice(0, stepIndex + 1).reduce((sum, value) => sum + value.distanceMeters, 0);
    const remaining = Math.max(0, stepEnd - scaledProgress);
    const threshold = [300, 100, 30].find(value => remaining <= value && !announcedAhead.current.has(`${stepIndex}:${value}`));
    if (threshold === undefined) return;
    announcedAhead.current.add(`${stepIndex}:${threshold}`);
    const text = `Sau ${formatDistance(remaining)}, ${localizeInstruction(next.instruction).trim()}`;
    void Speech.stop();
    Speech.speak(text, { language: 'vi-VN', voice: voiceId, rate: 0.95, pitch: 1 });
  }, [scaledProgress, stepIndex, steps, voiceId]);

  // Nhắc "Bây giờ, ..." khi tới sát chỗ rẽ (< 20 m).
  useEffect(() => {
    if (steps.length === 0 || voiceMutedRef.current) return;
    const next = steps[stepIndex + 1];
    if (!next) return;
    const stepEnd = steps.slice(0, stepIndex + 1).reduce((sum, value) => sum + value.distanceMeters, 0);
    const remaining = Math.max(0, stepEnd - scaledProgress);
    if (remaining > 20 || announcedAhead.current.has(`${stepIndex}:now`)) return;
    announcedAhead.current.add(`${stepIndex}:now`);
    const text = `Bây giờ, ${localizeInstruction(next.instruction).trim()}`;
    void Speech.stop();
    Speech.speak(text, { language: 'vi-VN', voice: voiceId, rate: 0.95, pitch: 1 });
  }, [scaledProgress, stepIndex, steps, voiceId]);

  useEffect(() => {
    if (!current) return;
    if (!overviewShown.current && coordinates.length > 1) {
      overviewShown.current = true;
      const lngs = coordinates.map(point => point.lng);
      const lats = coordinates.map(point => point.lat);
      camera.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: 120, bottom: 180, left: 40, right: 40 }, duration: 500 },
      );
      return;
    }
    camera.current?.jumpTo({ center: [current.lng, current.lat], zoom: 17 });
  }, [current, coordinates]);

  // Tự cập nhật tuyến đường: lệch route > 40m, hoặc đã đi > 25m sau mỗi 20 giây.
  const lastRefresh = useRef<{ at: number; position: RideCoordinates } | null>(null);
  useEffect(() => {
    if (!current || !onRefresh || coordinates.length === 0) return;
    const now = Date.now();
    const previous = lastRefresh.current;
    if (!previous) { lastRefresh.current = { at: now, position: current }; return; }
    let nearest = Infinity;
    for (const point of coordinates) nearest = Math.min(nearest, distanceMeters(point, current));
    const elapsed = now - previous.at;
    const moved = distanceMeters(previous.position, current);
    if ((nearest > 40 && elapsed > 5000) || (elapsed > 20000 && moved > 25)) {
      lastRefresh.current = { at: now, position: current };
      onRefresh();
    }
  }, [current, coordinates, onRefresh]);

  // Chỉ vẽ phần đường còn lại (từ vị trí tài xế tới đích), cập nhật mỗi lần GPS đổi.
  const routeLine = useMemo(() => {
    const remaining = coordinates.slice(nearestIndex);
    return remaining.length > 1
      ? { type: 'LineString' as const, coordinates: remaining.map(point => [point.lng, point.lat] as [number, number]) }
      : null;
  }, [coordinates, nearestIndex]);

  const step = steps[stepIndex];
  const stepEnd = steps.slice(0, stepIndex + 1).reduce((sum, value) => sum + value.distanceMeters, 0);
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
        {routeLine ? (
          <GeoJSONSource id="driver-route" data={routeLine}>
            <Layer id="driver-route-casing" type="line"
              paint={{ 'line-color': TRIP_ROUTE_CASING, 'line-width': 8 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            <Layer id="driver-route-line" type="line"
              paint={{ 'line-color': TRIP_ROUTE_COLOR, 'line-width': 5 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
          </GeoJSONSource>
        ) : null}
        {current ? (
          <GeoJSONSource id="driver-position" data={{
            type: 'Feature', geometry: { type: 'Point', coordinates: [current.lng, current.lat] }, properties: {},
          }}>
            <Layer id="driver-position-dot" type="circle" paint={{
              'circle-radius': 8, 'circle-color': CURRENT_LOCATION_BLUE, 'circle-stroke-width': 3, 'circle-stroke-color': CURRENT_LOCATION_RING,
            }} />
          </GeoJSONSource>
        ) : null}
        <GeoJSONSource id="driver-destination" data={{
          type: 'Feature', geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] }, properties: {},
        }}>
          <Layer id="driver-destination-dot" type="circle" paint={{
            'circle-radius': 9, 'circle-color': colors.success, 'circle-stroke-width': 3, 'circle-stroke-color': CURRENT_LOCATION_RING,
          }} />
        </GeoJSONSource>
      </Map>
      <View style={[styles.maneuver, { top: (viewport?.top ?? 0) + spacing.spaceSm }]}>
        <View style={styles.maneuverRow}>
          <Text style={styles.maneuverArrow}>{arrowFor(displayInstruction)}</Text>
          <View style={styles.roadBadge}>
            <Text style={styles.roadBadgeText} numberOfLines={1}>{road}</Text>
          </View>
        </View>
        <Text style={styles.maneuverInstruction} numberOfLines={2}>{displayInstruction}</Text>
        <Text style={styles.maneuverDistance}>{step ? formatDistance(stepRemaining) : ''}</Text>
        {nextRoad ? (
          <>
            <View style={styles.maneuverDivider} />
            <Text style={styles.thenText} numberOfLines={1}>Sau đó {nextRoad}</Text>
          </>
        ) : null}
      </View>
      <View style={[styles.mapControls, { top: (viewport?.top ?? 0) + 144 }]}>
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
              { padding: { top: (viewport?.top ?? 80) + 80, bottom: (viewport?.bottom ?? 140) + 40, left: 40, right: 40 }, duration: 400 },
            );
          }}
        >
          <MaterialIcons name="alt-route" size={22} color={colors.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}

const themedStyles = (c: ThemeColors) => StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, gap: spacing.px3, padding: spacing.spaceLg },
  emptyText: { ...typography.bodySecondary, color: c.onSurfaceVariant, textAlign: 'center' },
  maneuver: { position: 'absolute', left: spacing.margin, right: spacing.margin, paddingHorizontal: spacing.spaceMd, paddingVertical: spacing.px3, borderRadius: borderRadius.default, backgroundColor: c.primary, gap: spacing.xxs },
  maneuverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  maneuverArrow: { ...typography.sectionTitle, color: c.onPrimary },
  roadBadge: { flexShrink: 1, backgroundColor: c.surfaceContainerLowest, borderRadius: borderRadius.sm, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.xxs },
  roadBadgeText: { ...typography.label, color: c.onSurface },
  maneuverInstruction: { ...typography.body, color: c.onPrimary, marginTop: spacing.xxs },
  maneuverDistance: { ...typography.label, color: c.onPrimary, marginLeft: spacing.spaceLg, fontVariant: ['tabular-nums'] },
  maneuverDivider: { height: StyleSheet.hairlineWidth, backgroundColor: c.outlineVariant, marginTop: spacing.xxs },
  thenText: { ...typography.bodySecondary, color: c.onPrimary, marginTop: spacing.xxs },
  mapControls: { position: 'absolute', right: spacing.margin, gap: spacing.spaceSm },
  mapControl: { width: 48, height: 48, borderRadius: borderRadius.full, backgroundColor: c.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
});
