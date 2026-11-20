import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';
import {
  Button,
  Card,
  MotionPressable,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import type { VerificationWarning } from '../api';
import { captureInstructions, isSmall, type PhotoAsset } from '../verificationLabels';
import type { QrDocumentType, SlotKey } from '../workflow';
import { AlertBanner, SlotPhotoFrame, WarningBannerList } from './VerificationShared';

/** Focused single-slot capture card paired with footer thumb CTAs and optional back-side QR prompt. */
export function VerificationCaptureStep({
  slotKey,
  slotLabel,
  stepIndex,
  totalSlots,
  photo,
  photoUri,
  hasSavedCapture,
  allowed,
  locked,
  reading,
  smallAck,
  slotWarnings,
  backQrPromptDoc,
  extractFailed,
  onToggleSmallAck,
  onOpenCamera,
  onPickGallery,
  onOpenLiveQr,
  onSkipBackQr,
}: {
  slotKey: SlotKey;
  slotLabel: string;
  stepIndex: number;
  totalSlots: number;
  photo?: PhotoAsset;
  photoUri?: string;
  hasSavedCapture: boolean;
  allowed: boolean;
  locked: boolean;
  reading: boolean;
  smallAck: boolean;
  slotWarnings: readonly VerificationWarning[];
  backQrPromptDoc: QrDocumentType | null;
  extractFailed: boolean;
  onToggleSmallAck: (value: boolean) => void;
  onOpenCamera: () => void;
  onPickGallery: () => void;
  onOpenLiveQr: (docType: QrDocumentType) => void;
  onSkipBackQr: (isGplx: boolean) => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const hasAnyPhoto = Boolean(photo || hasSavedCapture);
  const showBackQrPrompt = !reading && (
    (slotKey === 'cccd_back' && backQrPromptDoc === 'CCCD')
    || (slotKey === 'gplx_back' && backQrPromptDoc === 'GPLX')
  );
  const docType: QrDocumentType = slotKey === 'gplx_back' ? 'GPLX' : 'CCCD';

  return (
    <Card style={styles.card}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{`${stepIndex + 1}/${totalSlots} · ${slotLabel}`}</Text>
        <Text style={styles.bodyText}>{captureInstructions[slotKey]}</Text>
      </View>

      {hasAnyPhoto ? (
        <SlotPhotoFrame
          uri={photoUri}
          label={slotLabel}
          hasSavedCapture={hasSavedCapture}
          isSelfie={slotKey === 'selfie'}
          large
          busy={locked}
        />
      ) : (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`Mở camera chụp ${slotLabel}`}
          disabled={locked || !allowed}
          onPress={onOpenCamera}
          style={styles.tapFrame}
        >
          <SlotPhotoFrame
            uri={undefined}
            label={slotLabel}
            hasSavedCapture={false}
            isSelfie={slotKey === 'selfie'}
            large
            busy={locked}
            interactive={allowed && !locked}
          />
        </MotionPressable>
      )}

      <WarningBannerList items={slotWarnings} />

      {photo && isSmall(photo) ? (
        <MotionPressable
          accessible={false}
          disabled={locked}
          onPress={() => onToggleSmallAck(!smallAck)}
          style={[styles.consentBox, { backgroundColor: colors.warningContainer }]}
        >
          <Switch
            accessibilityLabel="Xác nhận ảnh nhỏ vẫn rõ chữ hoặc khuôn mặt"
            value={smallAck}
            disabled={locked}
            onValueChange={onToggleSmallAck}
          />
          <Text style={[styles.flexText, { color: colors.onWarningContainer }]}>
            Ảnh có độ phân giải nhỏ. Tôi đã kiểm tra chữ hoặc khuôn mặt vẫn rõ.
          </Text>
        </MotionPressable>
      ) : null}

      {!allowed ? (
        <Text style={styles.mutedText}>Ảnh này không nằm trong danh sách cần bổ sung lần này.</Text>
      ) : null}

      {hasAnyPhoto ? (
        <Button
          variant="secondary"
          label="Chụp lại bằng camera"
          icon="photo-camera"
          iconPosition="leading"
          disabled={locked || !allowed}
          onPress={onOpenCamera}
        />
      ) : null}

      {slotKey !== 'selfie' ? (
        <Button
          variant="ghost"
          label="Chọn ảnh từ thư viện"
          icon="photo-library"
          iconPosition="leading"
          disabled={locked || !allowed}
          onPress={onPickGallery}
        />
      ) : (
        <Text style={styles.mutedText}>Ảnh chân dung cần chụp trực tiếp bằng camera để phản ánh đúng thời điểm xác minh.</Text>
      )}

      {showBackQrPrompt ? (
        <View style={[styles.qrPrompt, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Text style={styles.qrPromptTitle}>
            {extractFailed
              ? `Máy chủ đang bận · Có thể quét QR ${docType} trực tiếp`
              : `Quét nhanh mã QR trên ${docType}`}
          </Text>
          <Text style={styles.mutedText}>
            {extractFailed
              ? `Quy trình không bị khóa. Bạn có thể quét mã QR trực tiếp bằng camera hoặc tiếp tục chụp ${docType === 'GPLX' ? 'selfie' : 'GPLX'}.`
              : docType === 'GPLX'
                ? 'Nếu GPLX thẻ PET có mã QR ở mặt sau (từ 06/2020), hãy quét QR để điền nhanh. Nếu thẻ cũ không có QR, hãy bấm Bỏ qua.'
                : 'Nếu thẻ là CCCD 2021 hoặc Căn cước 2024, hãy quét QR để giảm nhập tay. Nếu thẻ cũ không có QR, hãy bấm Bỏ qua.'}
          </Text>
          <View style={styles.qrActions}>
            <Button
              variant="secondary"
              label="Quét mã QR trực tiếp"
              icon="qr-code-scanner"
              iconPosition="leading"
              disabled={locked || reading}
              onPress={() => onOpenLiveQr(docType)}
            />
            <Button
              variant="ghost"
              label={docType === 'GPLX' ? 'Bỏ qua · Chụp ảnh chân dung' : 'Bỏ qua · Chụp GPLX'}
              disabled={locked || reading}
              onPress={() => onSkipBackQr(docType === 'GPLX')}
            />
          </View>
        </View>
      ) : null}

      {reading && (slotKey === 'cccd_back' || slotKey === 'gplx_back') ? (
        <View style={[styles.readingRow, { backgroundColor: colors.surfaceContainerHigh }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.flexText} accessibilityLiveRegion="polite">
            {`Đang đọc mã QR từ ảnh ${docType}…`}
          </Text>
        </View>
      ) : null}

      {!hasAnyPhoto && !allowed ? (
        <AlertBanner tone="info" icon="info-outline" message="Bấm Tiếp tục ở dưới để sang mục kế tiếp." />
      ) : null}
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { gap: spacing.px3 },
    headerBlock: { gap: spacing.xxs },
    title: { ...typography.sectionTitle, color: colors.onSurface },
    bodyText: { ...typography.body, color: colors.onSurface },
    mutedText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    tapFrame: { alignSelf: 'center', width: '100%' },
    consentBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.spaceSm,
      padding: spacing.px3,
      borderRadius: spacing.spaceMd,
    },
    flexText: { ...typography.bodySecondary, color: colors.onSurface, flex: 1 },
    qrPrompt: {
      padding: spacing.spaceMd,
      borderRadius: spacing.spaceMd,
      gap: spacing.spaceSm,
    },
    qrPromptTitle: { ...typography.cardTitle, color: colors.onSurface },
    qrActions: { gap: spacing.spaceSm },
    readingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.spaceSm,
      padding: spacing.px3,
      borderRadius: spacing.spaceMd,
    },
  });
