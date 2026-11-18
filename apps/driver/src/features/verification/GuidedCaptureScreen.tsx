import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, typography, Typography as Text, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';
import { cacheFileSize, removeCacheFile } from './captureFiles';
import {
  assessCapture, mimeFromUri, summarizeChecks, type CaptureKind, type CheckState, type QualityCheck,
} from './captureQuality';

/** ISO/IEC 7810 ID-1 card (CCCD, GPLX): 85.6 x 54 mm (~1.585:1). */
export const ID1_RATIO = 85.6 / 54;
const PREVIEW_RATIO = 4 / 3;
const CAPTURE_TIMEOUT_MS = 15_000;

export type ServerInspectionResult = {
  warnings: { code: string; message: string; severe?: boolean }[];
  verified?: boolean;
  note?: string;
};

export type CapturedPhoto = {
  uri: string; width: number; height: number; fileSize: number | null; mimeType: string; checks: QualityCheck[];
};

export type GuidedCaptureProps = {
  visible: boolean;
  kind: CaptureKind;
  /** Full label, e.g. "CCCD trước". */
  label: string;
  /** "Mặt trước" / "Mặt sau" for documents. */
  side?: 'front' | 'back';
  instruction: string;
  /** Gallery fallback for documents. Omit or keep undefined for selfie to prioritize live capture. */
  onPickFromGallery?: () => void;
  /** Optional post-capture backend/Modal quality check triggered on user request inside preview. */
  onInspectServer?: (photo: CapturedPhoto, signal: AbortSignal) => Promise<ServerInspectionResult>;
  onCapture: (photo: CapturedPhoto) => void;
  onClose: () => void;
};

const checkIcon: Record<CheckState, keyof typeof MaterialIcons.glyphMap> = {
  pass: 'check-circle', warn: 'warning-amber', fail: 'error-outline', unchecked: 'help-outline',
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

export function GuidedCaptureScreen(props: GuidedCaptureProps) {
  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose} statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}>
      {props.visible ? <CaptureSession {...props} /> : null}
    </Modal>
  );
}

function CaptureSession({
  kind, label, side, instruction, onPickFromGallery, onInspectServer, onCapture, onClose,
}: GuidedCaptureProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const capturing = useRef(false);
  const mounted = useRef(true);
  const handedOff = useRef(false);
  const capturedUri = useRef<string | null>(null);
  const inspectController = useRef<AbortController | null>(null);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [serverResult, setServerResult] = useState<ServerInspectionResult | null>(null);
  const [error, setError] = useState('');
  const [mountError, setMountError] = useState(false);
  const [captured, setCaptured] = useState<CapturedPhoto | null>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const selfie = kind === 'selfie';
  const baseLabel = label.replace(/\s+(?:trước|sau)$/i, '');
  const title = selfie ? label : baseLabel + (side ? ' · ' + (side === 'front' ? 'Mặt trước' : 'Mặt sau') : '');

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      const active = state === 'active';
      setAppActive(active);
      if (!active) {
        setReady(false);
        setTorch(false);
        capturing.current = false;
        setBusy(false);
      } else {
        void getPermission().catch(() => {});
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      inspectController.current?.abort();
      // Never leave an unused document photo behind in the cache.
      if (capturedUri.current && !handedOff.current) removeCacheFile(capturedUri.current);
    };
  }, [getPermission]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && permission.status === 'undetermined') {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const takePicture = useCallback(async () => {
    const camera = cameraRef.current;
    if (capturing.current || !ready || !camera) return;
    capturing.current = true;
    setBusy(true);
    setError('');
    setServerResult(null);
    try {
      const picture = await withTimeout(camera.takePictureAsync({
        quality: 0.9, exif: true, skipProcessing: false, shutterSound: true,
      }), CAPTURE_TIMEOUT_MS);
      if (!mounted.current) { removeCacheFile(picture.uri); return; }
      const bytes = cacheFileSize(picture.uri);
      const mimeType = mimeFromUri(picture.uri) || 'image/jpeg';
      const photo: CapturedPhoto = {
        uri: picture.uri, width: picture.width, height: picture.height, fileSize: bytes, mimeType,
        checks: assessCapture({ width: picture.width, height: picture.height, bytes, mimeType, exif: picture.exif }, kind),
      };
      capturedUri.current = picture.uri;
      setCaptured(photo);
      setTorch(false);
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error && cause.message === 'TIMEOUT'
          ? 'Camera phản hồi quá lâu. Hãy thử chụp lại.'
          : 'Không chụp được ảnh. Hãy thử lại.');
      }
    } finally {
      capturing.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [kind, ready]);

  const runServerCheck = useCallback(async () => {
    if (!captured || !onInspectServer || inspecting) return;
    inspectController.current?.abort();
    const controller = new AbortController();
    inspectController.current = controller;
    setInspecting(true);
    setError('');
    try {
      const result = await onInspectServer(captured, controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      setServerResult(result);
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted) {
        setServerResult({
          warnings: [],
          verified: false,
          note: cause instanceof Error ? cause.message : 'Chưa kiểm tra được qua máy chủ. Bạn vẫn có thể dùng ảnh hoặc chụp lại.',
        });
      }
    } finally {
      if (inspectController.current === controller) {
        inspectController.current = null;
        if (mounted.current) setInspecting(false);
      }
    }
  }, [captured, inspecting, onInspectServer]);

  const retake = () => {
    inspectController.current?.abort();
    inspectController.current = null;
    setInspecting(false);
    setServerResult(null);
    if (capturedUri.current) removeCacheFile(capturedUri.current);
    capturedUri.current = null;
    setCaptured(null);
    setReady(false);
    setError('');
  };

  const close = () => {
    inspectController.current?.abort();
    inspectController.current = null;
    if (capturedUri.current && !handedOff.current) removeCacheFile(capturedUri.current);
    capturedUri.current = null;
    onClose();
  };

  const usePhoto = () => {
    if (!captured || summarizeChecks(captured.checks).blocking) return;
    inspectController.current?.abort();
    inspectController.current = null;
    handedOff.current = true;
    onCapture(captured);
  };

  // Preserve the camera's 4:3 sensor aspect ratio in both portrait and landscape so the overlay aligns cleanly.
  const landscape = area.width > area.height && area.height > 0;
  const preview = useMemo(() => {
    if (area.width <= 0 || area.height <= 0) return { width: 0, height: 0 };
    if (landscape) {
      const height = Math.min(area.height, area.width / PREVIEW_RATIO);
      return { width: height * PREVIEW_RATIO, height };
    }
    const width = Math.min(area.width, area.height / PREVIEW_RATIO);
    return { width, height: width * PREVIEW_RATIO };
  }, [area, landscape]);

  const frame = useMemo(() => {
    if (selfie) {
      const maxW = preview.width * 0.7;
      const maxH = preview.height * 0.72;
      const width = Math.min(maxW, maxH / 1.3);
      return { width, height: width * 1.3 };
    }
    // Unified vertical ID-1 frame (54 x 85.6 mm) matching the 3:4 portrait sensor for maximum card area.
    const maxW = preview.width * 0.9;
    const maxH = preview.height * 0.9;
    const height = Math.min(maxH, maxW * ID1_RATIO);
    return { width: height / ID1_RATIO, height };
  }, [preview, selfie]);

  const granted = permission?.granted === true;
  const showCamera = granted && !captured && appActive && !mountError;
  const effectiveChecks = useMemo(() => {
    if (!captured) return [];
    if (!serverResult || !serverResult.verified) return captured.checks;
    const serverHasImageWarn = serverResult.warnings.length > 0;
    return captured.checks.map(check => {
      if (check.id === 'sharpness' || check.id === 'content') {
        return serverHasImageWarn
          ? { ...check, state: 'warn' as CheckState, detail: 'Máy chủ có cảnh báo cần xem lại ở dưới.' }
          : { ...check, state: 'pass' as CheckState, detail: 'Máy chủ kiểm tra không phát hiện lỗi cắt góc/mờ/lóa.' };
      }
      return check;
    });
  }, [captured, serverResult]);

  const summary = captured ? summarizeChecks(effectiveChecks) : null;
  const galleryAllowed = Boolean(onPickFromGallery) && (!selfie || !granted || mountError);

  const renderPermission = () => (
    <View style={styles.centerBox}>
      <MaterialIcons name="photo-camera" size={40} color={colors.onScrim} importantForAccessibility="no" />
      {permission === null ? <ActivityIndicator color={colors.onScrim} /> : (
        <>
          <Text style={styles.onDarkTitle}>Cần quyền dùng camera</Text>
          <Text style={styles.onDarkText}>
            {permission.canAskAgain
              ? 'Cho phép camera để chụp ' + label.toLowerCase() + ' ngay trong ứng dụng.'
              : 'Quyền camera đã bị tắt. Hãy bật lại trong Cài đặt.'}
          </Text>
          {permission.canAskAgain
            ? <Button label="Cho phép camera" onPress={() => void requestPermission()} />
            : <Button label="Mở cài đặt" onPress={() => void Linking.openSettings().catch(() => setError('Không mở được cài đặt.'))} />}
          {galleryAllowed ? (
            <Button variant="ghost" label="Chọn ảnh từ thư viện" onPress={onPickFromGallery!} />
          ) : null}
        </>
      )}
    </View>
  );

  const renderCameraError = () => (
    <View style={styles.centerBox}>
      <MaterialIcons name="error-outline" size={40} color={colors.onScrim} importantForAccessibility="no" />
      <Text style={styles.onDarkTitle}>Không mở được camera</Text>
      <Text style={styles.onDarkText}>Camera có thể đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.</Text>
      <Button label="Thử lại camera" onPress={() => { setMountError(false); setReady(false); }} />
      {galleryAllowed ? (
        <Button variant="ghost" label="Chọn ảnh từ thư viện" onPress={onPickFromGallery!} />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng camera" onPress={close} hitSlop={12} style={styles.iconButton}>
          <MaterialIcons name="close" size={26} color={colors.onScrim} />
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle} accessibilityRole="header">{title}</Text>
          <Text style={styles.topSubtitle}>{captured ? 'Xem lại ảnh vừa chụp' : (selfie ? 'Camera trước' : 'Camera sau')}</Text>
        </View>
        {showCamera && !selfie ? (
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: torch }}
            accessibilityLabel={torch ? 'Tắt đèn' : 'Bật đèn'} onPress={() => setTorch(v => !v)} hitSlop={12} style={styles.iconButton}>
            <MaterialIcons name={torch ? 'flash-on' : 'flash-off'} size={26} color={colors.onScrim} />
          </Pressable>
        ) : <View style={styles.iconButton} />}
      </View>

      <View style={styles.area} onLayout={event => setArea(event.nativeEvent.layout)}>
        {!granted ? renderPermission() : mountError ? renderCameraError() : (
          <View style={[styles.previewBox, { width: preview.width, height: preview.height }]}>
            {showCamera ? (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={selfie ? 'front' : 'back'}
                ratio="4:3"
                enableTorch={torch && !selfie}
                animateShutter
                mirror={false}
                onCameraReady={() => setReady(true)}
                onMountError={() => { setMountError(true); setReady(false); }}
              />
            ) : null}
            {captured ? (
              <Image accessibilityLabel={'Ảnh vừa chụp · ' + title} source={{ uri: captured.uri }}
                contentFit="contain" cachePolicy="none" style={StyleSheet.absoluteFill} />
            ) : (
              <>
                {selfie
                  ? <OvalOverlay width={preview.width} height={preview.height} frameW={frame.width} frameH={frame.height} />
                  : <RectOverlay width={preview.width} height={preview.height} frameW={frame.width} frameH={frame.height} />}
                {!ready && showCamera ? <View style={styles.loading}><ActivityIndicator color={colors.onScrim} /></View> : null}
              </>
            )}
          </View>
        )}
      </View>

      {captured && summary ? (
        <View style={styles.previewFooter}>
          {summary.blocking ? (
            <View style={[styles.verdictBanner, { backgroundColor: colors.errorContainer }]}>
              <Text style={[styles.verdictText, { color: colors.onErrorContainer }]}>Ảnh chưa dùng được. Hãy chụp lại.</Text>
            </View>
          ) : summary.hasWarning || (serverResult?.warnings.length ?? 0) > 0 ? (
            <View style={[styles.verdictBanner, { backgroundColor: colors.warningContainer }]}>
              <Text style={[styles.verdictText, { color: colors.onWarningContainer }]}>Có cảnh báo chất lượng. Bạn nên chụp lại.</Text>
            </View>
          ) : serverResult?.verified ? (
            <View style={[styles.verdictBanner, { backgroundColor: colors.successContainer }]}>
              <Text style={[styles.verdictText, { color: colors.onSuccessContainer }]}>Ảnh đã qua kiểm tra máy và máy chủ</Text>
            </View>
          ) : (
            <Text style={styles.verdictNeutral}>Kết quả kiểm tra trên máy (chưa phải kết luận cuối cùng)</Text>
          )}
          <ScrollView style={styles.previewPanelScroll} contentContainerStyle={styles.checkList}>
            {effectiveChecks.map(check => (
              <View key={check.id} style={styles.checkRow}>
                <MaterialIcons name={checkIcon[check.state]} size={20} importantForAccessibility="no"
                  color={colors.onScrim} />
                <Text style={styles.checkText}>
                  <Text style={styles.checkLabel}>{check.label}: </Text>
                  {check.detail ?? ''}
                </Text>
              </View>
            ))}
            {serverResult?.note ? <Text style={styles.disclaimer}>{serverResult.note}</Text> : null}
            {serverResult?.warnings.map(warning => (
              <View key={warning.code} style={[styles.verdictBanner, { backgroundColor: colors.warningContainer }]}>
                <Text style={[styles.verdictText, { color: colors.onWarningContainer }]}>{warning.message}</Text>
              </View>
            ))}
            {onInspectServer && !summary.blocking ? (
              <Button variant="secondary" label={inspecting ? 'Đang kiểm tra qua máy chủ…' : 'Kiểm tra chất lượng qua máy chủ'}
                disabled={inspecting} onPress={() => void runServerCheck()} />
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Button label="Dùng ảnh này" disabled={summary.blocking || inspecting} onPress={usePhoto} />
            <Button variant="secondary" label="Chụp lại" onPress={retake} />
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.instruction}>{instruction}</Text>
          <View style={styles.tips}>
            {(selfie ? ['Nhìn thẳng', 'Đủ sáng', 'Không che mặt'] : ['Xoay dọc thẻ', 'Đủ 4 góc', 'Không mờ, lóa']).map(tip => (
              <View key={tip} style={styles.tip}><Text style={styles.tipText}>{tip}</Text></View>
            ))}
          </View>
          <Text style={styles.disclaimer}>
            {selfie ? 'Khung chỉ để căn chỉnh. Ứng dụng chưa tự kiểm tra khuôn mặt hay người thật.'
              : 'Khung chỉ để căn chỉnh. Ứng dụng chưa tự nhận diện bốn góc thẻ.'}
          </Text>
          {error ? <Text style={[styles.disclaimer, styles.errorBanner]} accessibilityLiveRegion="polite">{error}</Text> : null}
          <View style={styles.shutterRow}>
            <View style={styles.sideSlot}>
              {galleryAllowed ? (
                <Button variant="ghost" label="Thư viện" onPress={onPickFromGallery!} />
              ) : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Chụp ảnh"
              accessibilityState={{ disabled: !showCamera || !ready || busy, busy }}
              disabled={!showCamera || !ready || busy} onPress={() => void takePicture()}
              style={[styles.shutterOuter, (!ready || busy) && styles.shutterDisabled]}>
              {busy ? <ActivityIndicator color={colors.primary} /> : <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />}
            </Pressable>
            <View style={styles.sideSlot} />
          </View>
        </View>
      )}
    </View>
  );
}

function RectOverlay({ width, height, frameW, frameH }: { width: number; height: number; frameW: number; frameH: number }) {
  const styles = useThemedStyles(makeStyles);
  const left = (width - frameW) / 2;
  const top = (height - frameH) / 2;
  const arm = Math.min(frameW, frameH) * 0.16;
  const thickness = 4;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.mask, { left: 0, top: 0, width, height: top }]} />
      <View style={[styles.mask, { left: 0, top: top + frameH, width, height: Math.max(0, height - top - frameH) }]} />
      <View style={[styles.mask, { left: 0, top, width: left, height: frameH }]} />
      <View style={[styles.mask, { left: left + frameW, top, width: Math.max(0, width - left - frameW), height: frameH }]} />
      <View style={{ position: 'absolute', left, top, width: frameW, height: frameH }}>
        <View style={[styles.cornerBar, { left: 0, top: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, { left: 0, top: 0, width: thickness, height: arm }]} />
        <View style={[styles.cornerBar, { right: 0, top: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, { right: 0, top: 0, width: thickness, height: arm }]} />
        <View style={[styles.cornerBar, { left: 0, bottom: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, { left: 0, bottom: 0, width: thickness, height: arm }]} />
        <View style={[styles.cornerBar, { right: 0, bottom: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, { right: 0, bottom: 0, width: thickness, height: arm }]} />
      </View>
    </View>
  );
}

function ovalMaskStyle(width: number, height: number, frameW: number, frameH: number, borderColor: string) {
  const band = Math.max(width, height, 1);
  const outerW = frameW + band * 2;
  const outerH = frameH + band * 2;
  const guide = {
    ovalMask: {
      position: 'absolute' as const,
      left: (width - outerW) / 2,
      top: (height - outerH) / 2,
      width: outerW,
      height: outerH,
      borderWidth: band,
      borderColor,
      borderRadius: Math.max(outerW, outerH) / 2,
    },
  };
  return guide.ovalMask;
}

function OvalOverlay({ width, height, frameW, frameH }: { width: number; height: number; frameW: number; frameH: number }) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={ovalMaskStyle(width, height, frameW, frameH, colors.scrim70)} />
      <View style={[styles.ovalRing, {
        left: (width - frameW) / 2,
        top: (height - frameH) / 2,
        width: frameW,
        height: frameH,
        borderColor: colors.onScrim,
        borderRadius: Math.max(frameW, frameH) / 2,
      }]} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mediaViewerBackground },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topTitleWrap: { flex: 1, alignItems: 'center' },
  topTitle: { ...typography.sectionTitle, color: colors.onScrim, textAlign: 'center' },
  topSubtitle: { ...typography.caption, color: colors.onScrim, textAlign: 'center' },
  area: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewBox: { overflow: 'hidden', backgroundColor: colors.mediaViewerBackground },
  mask: { position: 'absolute', backgroundColor: colors.scrim70 },
  cornerBar: { position: 'absolute', backgroundColor: colors.onScrim, borderRadius: 2 },
  ovalRing: { position: 'absolute', borderWidth: 3 },
  loading: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerBox: { flex: 1, padding: 24, gap: 14, alignItems: 'center', justifyContent: 'center' },
  onDarkTitle: { ...typography.sectionTitle, color: colors.onScrim, textAlign: 'center' },
  onDarkText: { ...typography.body, color: colors.onScrim, textAlign: 'center' },
  previewPanelScroll: { maxHeight: 200 },
  previewFooter: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 8 },
  checkList: { gap: 8, paddingBottom: 4 },
  verdictBanner: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  verdictText: { ...typography.label },
  verdictNeutral: { ...typography.label, color: colors.onScrim },
  panel: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 8 },
  instruction: { ...typography.cardTitle, color: colors.onScrim, textAlign: 'center' },
  tips: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  tip: { backgroundColor: colors.scrim60, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tipText: { ...typography.label, color: colors.onScrim },
  disclaimer: { ...typography.caption, color: colors.onScrim, textAlign: 'center' },
  errorBanner: { color: colors.onErrorContainer, backgroundColor: colors.errorContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  sideSlot: { minWidth: 112, alignItems: 'center' },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.onScrim, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29 },
  shutterDisabled: { opacity: 0.4 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkText: { ...typography.bodySecondary, flex: 1, color: colors.onScrim },
  checkLabel: { ...typography.label },
  actions: { gap: 8, paddingTop: 2 },
});
