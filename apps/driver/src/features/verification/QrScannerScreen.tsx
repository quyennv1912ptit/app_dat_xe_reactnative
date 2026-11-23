import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Typography as Text, borderRadius, spacing, type ThemeColors, typography, useReducedMotion, useThemeColors, useThemedStyles } from '@datxe/ui';
import {
  DEFAULT_QR_ZOOM_CCCD,
  DEFAULT_QR_ZOOM_GPLX,
  QR_ZOOM_MAX,
  QR_ZOOM_MIN,
  QR_ZOOM_STEP,
  formatQrZoomPercent,
  stepQrZoom,
} from './reliabilityHelpers';
import type { QrCardVariant, QrDocumentSide, QrDocumentType, QrExtractionResult } from './workflow';

const PREVIEW_RATIO = 4 / 3;

export type QrScanSubmissionResult =
  | { ok: true; qr: QrExtractionResult }
  | { ok: false; message: string; status?: string };

export interface QrScannerScreenProps {
  visible: boolean;
  documentType?: QrDocumentType;
  defaultSide: QrDocumentSide;
  expectedVariant?: QrCardVariant | null;
  onScanPayload: (
    rawPayload: string,
    side: QrDocumentSide,
    signal: AbortSignal,
  ) => Promise<QrScanSubmissionResult>;
  onSkip: () => void;
  onClose: () => void;
  onDone: () => void;
}

type ScanPhase = 'scanning' | 'submitting' | 'success' | 'error';

export default function QrScannerScreen(props: QrScannerScreenProps) {
  const reduced = useReducedMotion();
  return (
    <Modal
      visible={props.visible}
      animationType={reduced ? 'none' : 'slide'}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={props.onClose}
    >
      {props.visible ? <QrScannerSession {...props} /> : null}
    </Modal>
  );
}

function QrScannerSession({
  documentType = 'CCCD',
  defaultSide,
  expectedVariant,
  onScanPayload,
  onSkip,
  onClose,
  onDone,
}: QrScannerScreenProps) {
  const isGplx = documentType === 'GPLX';
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const mounted = useRef(true);
  const scanLock = useRef(false);
  const scanController = useRef<AbortController | null>(null);

  const initialSide: 'FRONT' | 'BACK' =
    isGplx
      ? (defaultSide === 'FRONT' ? 'FRONT' : 'BACK')
      : (defaultSide === 'BACK' || expectedVariant === 'CAN_CUOC_2024' ? 'BACK' : 'FRONT');

  const [selectedSide, setSelectedSide] = useState<'FRONT' | 'BACK'>(initialSide);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState<number>(isGplx ? DEFAULT_QR_ZOOM_GPLX : DEFAULT_QR_ZOOM_CCCD);
  const [mountError, setMountError] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [statusMessage, setStatusMessage] = useState('');
  const [scanResult, setScanResult] = useState<QrExtractionResult | null>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      const active = state === 'active';
      setAppActive(active);
      if (!active) {
        setReady(false);
        setTorch(false);
        scanController.current?.abort();
        scanController.current = null;
      } else {
        void getPermission().catch(() => {});
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      scanController.current?.abort();
      scanController.current = null;
    };
  }, [getPermission]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && permission.status === 'undetermined') {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const resetScanner = useCallback(() => {
    scanController.current?.abort();
    scanController.current = null;
    scanLock.current = false;
    setScanResult(null);
    setStatusMessage('');
    setMountError(false);
    setPhase('scanning');
  }, []);

  const handleCloseSkip = useCallback(() => {
    scanController.current?.abort();
    scanController.current = null;
    scanLock.current = false;
    setTorch(false);
    onSkip();
  }, [onSkip]);

  const handleBarcodeScanned = useCallback(
    (event: BarcodeScanningResult) => {
      if (!mounted.current || scanLock.current || phase !== 'scanning') return;
      const rawPayload = (event.raw ?? event.data ?? '').trim();
      if (!rawPayload) return;

      // Single-shot lock prevents duplicate frame callbacks and continuous streaming.
      scanLock.current = true;
      setTorch(false);
      setPhase('submitting');
      setStatusMessage('Đang kiểm tra thông tin QR…');
      setScanResult(null);

      scanController.current?.abort();
      const controller = new AbortController();
      scanController.current = controller;

      void onScanPayload(rawPayload, selectedSide, controller.signal)
        .then(result => {
          if (!mounted.current || controller.signal.aborted) return;
          if (result.ok) {
            setScanResult(result.qr);
            setPhase('success');
            setStatusMessage(
              result.qr.status === 'CONFLICT'
                ? 'Đã đọc được mã QR và ghi nhận điểm cần đối chiếu với OCR/hồ sơ.'
                : 'Đã đọc được mã QR. Kết quả sẽ được đối chiếu ở bước xác nhận.',
            );
          } else {
            setPhase('error');
            setStatusMessage(result.message);
          }
        })
        .catch(error => {
          if (!mounted.current || controller.signal.aborted) return;
          setPhase('error');
          setStatusMessage(
            error instanceof Error
              ? error.message
              : 'Chưa gửi được mã QR. Hãy bấm Quét lại hoặc Bỏ qua.',
          );
        })
        .finally(() => {
          if (scanController.current === controller) {
            scanController.current = null;
          }
        });
    },
    [onScanPayload, phase, selectedSide],
  );

  const preview = useMemo(() => {
    if (area.width <= 0 || area.height <= 0) return { width: 0, height: 0 };
    const landscape = area.width > area.height;
    if (landscape) {
      const height = Math.min(area.height, area.width / PREVIEW_RATIO);
      return { width: height * PREVIEW_RATIO, height };
    }
    const width = Math.min(area.width, area.height / PREVIEW_RATIO);
    return { width, height: width * PREVIEW_RATIO };
  }, [area]);

  const squareSize = useMemo(() => {
    const minDim = Math.min(preview.width, preview.height);
    return Math.max(0, minDim * 0.72);
  }, [preview]);

  const granted = permission?.granted === true;
  const showCamera = granted && appActive && !mountError && phase === 'scanning';

  const templateGuide = isGplx
    ? (selectedSide === 'BACK'
        ? 'GPLX thẻ PET (từ 06/2020): đưa mã QR ở góc trái mặt sau vào giữa khung vuông.'
        : 'Đang kiểm tra mặt trước GPLX; phần lớn GPLX PET đặt mã QR ở mặt sau.')
    : (selectedSide === 'FRONT'
        ? 'CCCD gắn chip mẫu 2021: đưa góc trên bên phải mặt trước vào giữa khung vuông.'
        : 'Căn cước mẫu 2024: đưa mã QR ở mặt sau vào giữa khung vuông.');

  const renderPermissionState = () => (
    <View style={styles.centerBox}>
      <MaterialIcons name="qr-code-scanner" size={44} color={colors.onScrim} importantForAccessibility="no" />
      {permission === null ? (
        <ActivityIndicator color={colors.onScrim} />
      ) : (
        <>
          <Text style={styles.onDarkTitle}>Cần quyền camera để quét mã QR</Text>
          <Text style={styles.onDarkText}>
            {permission.canAskAgain
              ? (isGplx
                  ? 'Cho phép mở camera sau để quét trực tiếp mã QR trên thẻ GPLX.'
                  : 'Cho phép mở camera sau để quét trực tiếp mã QR trên thẻ CCCD/Căn cước.')
              : 'Quyền camera đang tắt. Bạn có thể mở Cài đặt để bật hoặc bấm Bỏ qua để nhập thông tin thủ công.'}
          </Text>
          <View style={styles.permissionActions}>
            {permission.canAskAgain ? (
              <Button label="Cho phép camera" onPress={() => void requestPermission()} />
            ) : (
              <Button
                label="Mở cài đặt"
                onPress={() =>
                  void Linking.openSettings().catch(() =>
                    setStatusMessage('Không mở được cài đặt ứng dụng.'),
                  )
                }
              />
            )}
            <Button variant="secondary" label="Bỏ qua · Tự nhập thông tin" onPress={handleCloseSkip} />
          </View>
        </>
      )}
    </View>
  );

  const renderCameraErrorState = () => (
    <View style={styles.centerBox}>
      <MaterialIcons name="error-outline" size={44} color={colors.onScrim} importantForAccessibility="no" />
      <Text style={styles.onDarkTitle}>Không khởi tạo được camera</Text>
      <Text style={styles.onDarkText}>
        Hãy kiểm tra ứng dụng khác đang dùng camera hoặc bỏ qua để tự nhập thông tin bằng tay.
      </Text>
      <View style={styles.permissionActions}>
        <Button
          label="Thử lại camera"
          onPress={() => {
            setMountError(false);
            setReady(false);
          }}
        />
        <Button variant="secondary" label="Bỏ qua · Tiếp tục không cần QR" onPress={handleCloseSkip} />
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng máy quét"
          onPress={onClose}
          hitSlop={12}
          style={styles.iconButton}
        >
          <MaterialIcons name="close" size={26} color={colors.onScrim} />
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle} accessibilityRole="header">
            {isGplx ? 'Quét mã QR GPLX' : 'Quét mã QR CCCD'}
          </Text>
          <Text style={styles.topSubtitle}>Đưa mã QR trên giấy tờ vào giữa khung</Text>
        </View>
        {showCamera ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: torch }}
            accessibilityLabel={torch ? 'Tắt đèn flash' : 'Bật đèn flash'}
            onPress={() => setTorch(v => !v)}
            hitSlop={12}
            style={[styles.iconButton, torch && { backgroundColor: colors.primaryContainer, borderRadius: 24 }]}
          >
            <MaterialIcons
              name={torch ? 'flash-on' : 'flash-off'}
              size={26}
              color={torch ? colors.onPrimaryContainer : colors.onScrim}
            />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      <View style={styles.area} onLayout={event => setArea(event.nativeEvent.layout)}>
        {!granted ? (
          renderPermissionState()
        ) : mountError ? (
          renderCameraErrorState()
        ) : (
          <View style={[styles.previewBox, { width: preview.width, height: preview.height }]}>
            {showCamera ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                ratio="4:3"
                zoom={zoom}
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
                onCameraReady={() => setReady(true)}
                onMountError={() => {
                  setMountError(true);
                  setReady(false);
                }}
              />
            ) : null}

            <SquareQrOverlay
              width={preview.width}
              height={preview.height}
              size={squareSize}
              activeColor={phase === 'success' ? colors.primary : undefined}
            />

            {phase === 'scanning' && showCamera && !ready ? (
              <View style={styles.centerOverlay}>
                <ActivityIndicator color={colors.onScrim} />
              </View>
            ) : null}

            {phase === 'submitting' ? (
              <View style={[styles.centerOverlay, { backgroundColor: colors.scrim70 }]}>
                <ActivityIndicator size="large" color={colors.onScrim} />
                <Text style={styles.onDarkText}>Đang đối chiếu mã QR…</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, spacing.spaceMd) }]}>
        <ScrollView contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.sideToggleRow}>
            <View style={styles.sideButtonWrap}>
              <Button
                variant={selectedSide === 'FRONT' ? 'primary' : 'secondary'}
                label={isGplx ? 'GPLX · Mặt trước' : 'CCCD 2021 · Mặt trước'}
                disabled={phase === 'submitting'}
                onPress={() => setSelectedSide('FRONT')}
              />
            </View>
            <View style={styles.sideButtonWrap}>
              <Button
                variant={selectedSide === 'BACK' ? 'primary' : 'secondary'}
                label={isGplx ? 'GPLX · Mặt sau (QR)' : 'Căn cước 2024 · Mặt sau'}
                disabled={phase === 'submitting'}
                onPress={() => setSelectedSide('BACK')}
              />
            </View>
          </View>

          <Text style={styles.templateHint}>{templateGuide}</Text>

          {phase === 'scanning' ? (
            <View style={styles.zoomBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Giảm thu phóng"
                accessibilityState={{ disabled: zoom <= QR_ZOOM_MIN }}
                disabled={zoom <= QR_ZOOM_MIN}
                onPress={() => setZoom(current => stepQrZoom(current, -QR_ZOOM_STEP))}
                style={[styles.zoomButton, zoom <= QR_ZOOM_MIN ? styles.zoomButtonDisabled : undefined]}
              >
                <MaterialIcons
                  name="remove"
                  size={22}
                  color={zoom <= QR_ZOOM_MIN ? colors.onSurfaceVariant : colors.primary}
                  importantForAccessibility="no"
                />
              </Pressable>
              <Text style={styles.zoomLabel} accessibilityLiveRegion="polite">
                {`Thu phóng · ${formatQrZoomPercent(zoom)}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tăng thu phóng"
                accessibilityState={{ disabled: zoom >= QR_ZOOM_MAX }}
                disabled={zoom >= QR_ZOOM_MAX}
                onPress={() => setZoom(current => stepQrZoom(current, QR_ZOOM_STEP))}
                style={[styles.zoomButton, zoom >= QR_ZOOM_MAX ? styles.zoomButtonDisabled : undefined]}
              >
                <MaterialIcons
                  name="add"
                  size={22}
                  color={zoom >= QR_ZOOM_MAX ? colors.onSurfaceVariant : colors.primary}
                  importantForAccessibility="no"
                />
              </Pressable>
            </View>
          ) : null}

          {phase === 'scanning' ? (
            <View style={[styles.banner, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={styles.bannerText} accessibilityLiveRegion="polite">
                Đưa mã QR vào khung và nghiêng nhẹ thẻ để tránh ánh sáng phản chiếu.
              </Text>
            </View>
          ) : null}

          {phase === 'submitting' ? (
            <View style={[styles.banner, { backgroundColor: colors.surfaceContainerHigh }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.bannerText, styles.flex]} accessibilityLiveRegion="polite">
                {statusMessage}
              </Text>
            </View>
          ) : null}

          {phase === 'success' ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor:
                    scanResult?.status === 'CONFLICT'
                      ? colors.warningContainer
                      : colors.successContainer,
                },
              ]}
              accessibilityLiveRegion="polite"
            >
              <MaterialIcons
                name={scanResult?.status === 'CONFLICT' ? 'warning-amber' : 'qr-code-2'}
                size={22}
                color={
                  scanResult?.status === 'CONFLICT'
                    ? colors.onWarningContainer
                    : colors.onSuccessContainer
                }
                importantForAccessibility="no"
              />
              <Text
                style={[
                  styles.bannerLabel,
                  styles.flex,
                  {
                    color:
                      scanResult?.status === 'CONFLICT'
                        ? colors.onWarningContainer
                        : colors.onSuccessContainer,
                  },
                ]}
              >
                {statusMessage}
              </Text>
            </View>
          ) : null}

          {phase === 'error' ? (
            <View style={[styles.banner, { backgroundColor: colors.errorContainer }]} accessibilityRole="alert">
              <MaterialIcons name="error-outline" size={22} color={colors.onErrorContainer} importantForAccessibility="no" />
              <Text style={[styles.bannerLabel, styles.flex, { color: colors.onErrorContainer }]}>
                {statusMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionStack}>
            {phase === 'success' ? (
              <Button label="Tiếp tục đối chiếu thông tin" onPress={onDone} />
            ) : null}
            {phase !== 'scanning' ? (
              <Button variant={phase === 'success' ? 'secondary' : 'primary'} label="Quét lại" onPress={resetScanner} />
            ) : null}
          </View>
        </ScrollView>
        <Button variant="ghost" label="Bỏ qua quét QR · Nhập tay" onPress={handleCloseSkip} />
      </View>
    </View>
  );
}

function SquareQrOverlay({ width, height, size, activeColor }: { width: number; height: number; size: number; activeColor?: string }) {
  const styles = useThemedStyles(makeStyles);
  if (width <= 0 || height <= 0 || size <= 0) return null;
  const left = (width - size) / 2;
  const top = (height - size) / 2;
  const arm = size * 0.18;
  const thickness = 4;
  const cornerTint = activeColor ? { backgroundColor: activeColor } : undefined;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.mask, { left: 0, top: 0, width, height: top }]} />
      <View style={[styles.mask, { left: 0, top: top + size, width, height: Math.max(0, height - top - size) }]} />
      <View style={[styles.mask, { left: 0, top, width: left, height: size }]} />
      <View style={[styles.mask, { left: left + size, top, width: Math.max(0, width - left - size), height: size }]} />
      <View style={{ position: 'absolute', left, top, width: size, height: size }}>
        <View style={[styles.cornerBar, cornerTint, { left: 0, top: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, cornerTint, { left: 0, top: 0, width: thickness, height: arm }]} />
        <View style={[styles.cornerBar, cornerTint, { right: 0, top: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, cornerTint, { right: 0, top: 0, width: thickness, height: arm }]} />
        <View style={[styles.cornerBar, cornerTint, { left: 0, bottom: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, cornerTint, { left: 0, bottom: 0, width: thickness, height: arm }]} />
        <View style={[styles.cornerBar, cornerTint, { right: 0, bottom: 0, width: arm, height: thickness }]} />
        <View style={[styles.cornerBar, cornerTint, { right: 0, bottom: 0, width: thickness, height: arm }]} />
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.mediaViewerBackground },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.px3,
      paddingVertical: spacing.spaceSm,
      gap: spacing.spaceSm,
    },
    iconButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitleWrap: { flex: 1, alignItems: 'center' },
    topTitle: { ...typography.sectionTitle, color: colors.onScrim, textAlign: 'center' },
    topSubtitle: { ...typography.caption, color: colors.onScrim, textAlign: 'center' },
    area: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    previewBox: { overflow: 'hidden', backgroundColor: colors.mediaViewerBackground },
    mask: { position: 'absolute', backgroundColor: colors.scrim70 },
    cornerBar: { position: 'absolute', backgroundColor: colors.onScrim, borderRadius: 2 },
    centerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.spaceSm,
    },
    centerBox: {
      flex: 1,
      padding: spacing.spaceLg,
      gap: spacing.px3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    permissionActions: { width: '100%', gap: spacing.spaceSm },
    onDarkTitle: { ...typography.sectionTitle, color: colors.onScrim, textAlign: 'center' },
    onDarkText: { ...typography.body, color: colors.onScrim, textAlign: 'center' },
    panel: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.sheet,
      borderTopRightRadius: borderRadius.sheet,
      paddingHorizontal: spacing.spaceMd,
      paddingTop: spacing.spaceMd,
      maxHeight: '46%',
    },
    panelContent: { gap: spacing.spaceSm },
    sideToggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.spaceSm },
    sideButtonWrap: { flex: 1, minWidth: 140 },
    templateHint: { ...typography.label, color: colors.onSurface, textAlign: 'center' },
    zoomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.xxs,
    },
    zoomButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
    },
    zoomButtonDisabled: { opacity: 0.38 },
    zoomLabel: {
      ...typography.label,
      color: colors.onSurface,
      fontVariant: ['tabular-nums'],
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.spaceSm,
      padding: spacing.px3,
      borderRadius: spacing.spaceMd,
    },
    bannerText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    bannerLabel: { ...typography.label },
    actionStack: { gap: spacing.spaceSm, paddingTop: spacing.xxs },
    flex: { flex: 1 },
  });
