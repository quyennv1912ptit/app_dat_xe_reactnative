import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import { visibleObservationWarnings, type QrDecision, type SlotMap } from '../verificationLabels';
import { slots, type Extraction, type QrDocumentType, type SlotKey } from '../workflow';
import { AlertBanner } from './VerificationShared';

/** Clean extraction transition and fallback recovery screen (replaces the old noisy OCR gate). */
export function VerificationExtractionStep({
  reading,
  readingNote,
  readyCaptureCount,
  observations,
  qrDecision,
  gplxQrDecision,
  qrSkipped,
  gplxQrSkipped,
  hasCccdPhotos,
  hasGplxPhotos,
  cccdRevalidationNeeded,
  gplxRevalidationNeeded,
  ocrLockedCccdConflict,
  locked,
  disableAutoExtract,
  onReadAutomatically,
  onOpenLiveQr,
  onSkipQr,
}: {
  reading: boolean;
  readingNote: string;
  readyCaptureCount: number;
  observations: SlotMap<Extraction>;
  qrDecision: QrDecision;
  gplxQrDecision: QrDecision;
  qrSkipped: boolean;
  gplxQrSkipped: boolean;
  hasCccdPhotos: boolean;
  hasGplxPhotos: boolean;
  cccdRevalidationNeeded: boolean;
  gplxRevalidationNeeded: boolean;
  ocrLockedCccdConflict: boolean;
  locked: boolean;
  disableAutoExtract: boolean;
  onReadAutomatically: () => void;
  onOpenLiveQr: (docType: QrDocumentType) => void;
  onSkipQr: (docType: QrDocumentType) => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const [showReadingDetails, setShowReadingDetails] = useState(false);

  const qrEntries = [
    { docType: 'CCCD' as const, label: 'CCCD', decision: qrDecision, skipped: qrSkipped, hasPhotos: hasCccdPhotos },
    { docType: 'GPLX' as const, label: 'GPLX', decision: gplxQrDecision, skipped: gplxQrSkipped, hasPhotos: hasGplxPhotos },
  ];

  const slotWarningEntries: { key: SlotKey; label: string; text: string }[] = [];
  for (const [key, label] of slots) {
    const result = observations[key];
    if (!result) continue;
    const messages = visibleObservationWarnings(result.warnings);
    if (messages.length) slotWarningEntries.push({ key, label, text: messages.join(' ') });
  }

  return (
    <Card style={styles.card}>
      {reading ? (
        <View style={styles.readingState}>
          <View style={[styles.readingSpinnerWrap, { backgroundColor: colors.primaryContainer }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.titleCentered}>Đang đọc thông tin giấy tờ…</Text>
          <Text style={styles.mutedCentered} accessibilityLiveRegion="polite">
            {readingNote || 'Đang đọc thông tin giấy tờ. Quá trình này có thể mất một lúc.'}
          </Text>
        </View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Tổng hợp thông tin tự động</Text>
            <Text style={styles.mutedText}>
              Đã chuẩn bị {readyCaptureCount}/{slots.length} ảnh bắt buộc.
            </Text>
          </View>

          {readingNote ? (
            <AlertBanner tone="info" icon="info-outline" live message={readingNote} />
          ) : null}

          {cccdRevalidationNeeded || gplxRevalidationNeeded ? (
            <AlertBanner
              tone="info"
              icon="refresh"
              message={`Ảnh ${[cccdRevalidationNeeded ? 'CCCD' : null, gplxRevalidationNeeded ? 'GPLX' : null].filter(Boolean).join(' và ')} vừa được thay đổi. Kiểm tra thông tin ở bước tiếp theo hoặc đọc lại tự động.`}
            />
          ) : null}

          {qrEntries.map(({ docType, label, decision, skipped }) => {
            if (decision.mode === 'SKIP_DECODED') {
              return (
                <AlertBanner
                  key={'qr-state-' + docType}
                  tone="success"
                  icon="qr-code-2"
                  message={`Đã đọc mã QR từ ảnh ${label}. Thông tin hỗ trợ điền sẵn và sẽ được admin kiểm tra.`}
                />
              );
            }
            if (decision.mode === 'LIVE_SCANNED') {
              return (
                <AlertBanner key={'qr-state-' + docType} tone="success" icon="qr-code-2"
                  message={`Đã quét mã QR ${label}. Tiếp tục kiểm tra thông tin đã điền.`} />
              );
            }
            if (decision.shouldOffer && !skipped) {
              return (
                <View
                  key={'qr-state-' + docType}
                  style={[
                    styles.qrPromptBox,
                    { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <Text
                    style={[
                      styles.qrPromptTitle,
                    ]}
                  >
                    {decision.mode === 'RECOMMEND_LIVE_SCAN'
                      ? `Quét mã QR ${label} trực tiếp`
                      : decision.mode === 'SERVER_FALLBACK'
                        ? `Quét mã QR ${label} hoặc tự nhập tay`
                        : `Quét mã QR ${label} trực tiếp (tùy chọn)`}
                  </Text>
                  <Text
                    style={[
                      styles.mutedText,
                    ]}
                  >
                    {decision.mode === 'RECOMMEND_LIVE_SCAN'
                      ? `Chưa đọc được mã QR ${label} từ ảnh. Bạn có thể quét trực tiếp để điền nhanh hoặc tự nhập ở bước sau.`
                      : decision.mode === 'SERVER_FALLBACK'
                        ? 'Máy chủ chưa đọc xong tự động. Bạn có thể quét QR trực tiếp hoặc tự nhập tay ở bước sau.'
                        : docType === 'GPLX'
                          ? 'Nếu GPLX thẻ PET có mã QR mặt sau (từ 06/2020), hãy quét trực tiếp hoặc bỏ qua nếu thẻ cũ không có QR.'
                          : 'Nếu là CCCD gắn chip hoặc Căn cước mới, hãy quét QR; nếu thẻ cũ không có QR, hãy bấm Bỏ qua.'}
                  </Text>
                  <View style={styles.qrActions}>
                    <Button
                      label={`Quét mã QR ${label} trực tiếp`}
                      icon="qr-code-scanner"
                      iconPosition="leading"
                      disabled={locked}
                      onPress={() => onOpenLiveQr(docType)}
                    />
                    <Button
                      variant="ghost"
                      label="Bỏ qua · Tiếp tục nhập tay"
                      disabled={locked}
                      onPress={() => onSkipQr(docType)}
                    />
                  </View>
                </View>
              );
            }
            return null;
          })}

          {slotWarningEntries.length > 0 ? (
            <Button variant="ghost" label={showReadingDetails ? 'Ẩn chi tiết đọc tự động' : 'Xem chi tiết đọc tự động'}
              onPress={() => setShowReadingDetails(value => !value)} />
          ) : null}
          {showReadingDetails ? slotWarningEntries.map(entry => (
            <AlertBanner
              key={entry.key}
              tone="info"
              icon="info-outline"
              message={`${entry.label} · ${entry.text}`}
            />
          )) : null}

          {ocrLockedCccdConflict ? (
            <AlertBanner
              tone="error"
              icon="error-outline"
              role="alert"
              message="Số CCCD đọc từ ảnh mới khác với danh tính đã xác minh của tài khoản. Không thể sử dụng CCCD của người khác."
            />
          ) : null}

          <View style={styles.secondaryActions}>
            <Button
              variant="secondary"
              label="Đọc thông tin tự động"
              icon="auto-fix-high"
              iconPosition="leading"
              disabled={locked || disableAutoExtract}
              onPress={onReadAutomatically}
            />
            {qrEntries
              .filter(item => !item.decision.shouldOffer && item.decision.mode !== 'SKIP_DECODED'
                && item.decision.mode !== 'LIVE_SCANNED' && item.decision.mode !== 'NO_QR_CARD' && item.hasPhotos)
              .map(item => (
                <Button
                  key={'direct-qr-' + item.docType}
                  variant="ghost"
                  label={`Quét mã QR ${item.label} trực tiếp`}
                  icon="qr-code-scanner"
                  iconPosition="leading"
                  disabled={locked}
                  onPress={() => onOpenLiveQr(item.docType)}
                />
              ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { gap: spacing.px3 },
    stack: { gap: spacing.px3 },
    headerBlock: { gap: spacing.xxs },
    title: { ...typography.sectionTitle, color: colors.onSurface },
    mutedText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    readingState: {
      alignItems: 'center',
      paddingVertical: spacing.spaceLg,
      gap: spacing.px3,
    },
    readingSpinnerWrap: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleCentered: {
      ...typography.sectionTitle,
      color: colors.onSurface,
      textAlign: 'center',
    },
    mutedCentered: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    qrPromptBox: {
      padding: spacing.spaceMd,
      borderRadius: spacing.spaceMd,
      gap: spacing.spaceSm,
    },
    qrPromptTitle: { ...typography.cardTitle, color: colors.onSurface },
    qrPromptText: { ...typography.label },
    qrActions: { gap: spacing.spaceXs },
    secondaryActions: { gap: spacing.spaceSm },
  });
