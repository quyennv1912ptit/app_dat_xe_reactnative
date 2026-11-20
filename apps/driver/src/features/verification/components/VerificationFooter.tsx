import { StyleSheet, View } from 'react-native';
import {
  Button,
  Typography as Text,
  spacing,
  typography,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import type { Application, VerificationWarning } from '../api';
import type { FlowStage } from '../verificationLabels';
import { slots, type SlotKey } from '../workflow';

/** Anchored thumb-zone footer keeping one clear primary CTA per eKYC step. */
export function VerificationFooter({
  pending,
  canEdit,
  stage,
  step,
  slotKey,
  busy,
  locked,
  reading,
  consent,
  needsCapture,
  currentSlotAllowed,
  currentHasPhoto,
  smallBlocked,
  hasObservations,
  extractFailed,
  confirm,
  currentWarningReview,
  warnings,
  appStatus,
  onRetryPendingSubmit,
  onStartCapture,
  onJumpConfirmFields,
  onOpenCamera,
  onContinueBack,
  onNextCaptureStep,
  onCompleteCapture,
  onBackFromCapture,
  onAbortExtractionToManual,
  onBackToCaptureFromOcr,
  onGoSummary,
  onBackFromFields,
  onSubmit,
}: {
  pending: boolean;
  canEdit: boolean;
  stage: FlowStage;
  step: number;
  slotKey?: SlotKey;
  busy: string;
  locked: boolean;
  reading: boolean;
  consent: boolean;
  needsCapture: boolean;
  currentSlotAllowed: boolean;
  currentHasPhoto: boolean;
  smallBlocked: boolean;
  hasObservations: boolean;
  extractFailed: boolean;
  confirm: boolean;
  currentWarningReview?: { revision: number; acknowledged: boolean };
  warnings: readonly VerificationWarning[];
  appStatus?: Application['status'];
  onRetryPendingSubmit: () => void;
  onStartCapture: () => void;
  onJumpConfirmFields: () => void;
  onOpenCamera: () => void;
  onContinueBack: (docType: 'CCCD' | 'GPLX') => void;
  onNextCaptureStep: () => void;
  onCompleteCapture: () => void;
  onBackFromCapture: () => void;
  onAbortExtractionToManual: () => void;
  onBackToCaptureFromOcr: () => void;
  onGoSummary: () => void;
  onBackFromFields: () => void;
  onSubmit: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  if (pending) {
    return (
      <Button
        label="Thử nộp lại"
        disabled={Boolean(busy)}
        onPress={onRetryPendingSubmit}
      />
    );
  }
  if (!canEdit) return null;

  if (stage === 'PREPARE') {
    return (
      <View style={styles.footerStack}>
        {!consent ? (
          <Text style={styles.disabledHint}>Hãy bật đồng ý gửi ảnh ở trên để bắt đầu chụp.</Text>
        ) : null}
        <Button label="Bắt đầu chụp ảnh" disabled={locked || !consent} onPress={onStartCapture} />
        {appStatus === 'NEEDS_MORE_INFO' && !needsCapture ? (
          <Button
            variant="secondary"
            label="Đi thẳng tới sửa thông tin"
            disabled={locked || !consent}
            onPress={onJumpConfirmFields}
          />
        ) : null}
      </View>
    );
  }

  if (stage === 'CAPTURE' && slotKey) {
    const needCaptureFirst = currentSlotAllowed && !currentHasPhoto;
    return (
      <View style={styles.footerStack}>
        {smallBlocked ? (
          <Text style={styles.disabledHint}>Hãy xác nhận ảnh nhỏ ở trên để tiếp tục.</Text>
        ) : null}
        {needCaptureFirst ? (
          <Button
            label="Mở camera hướng dẫn"
            icon="photo-camera"
            iconPosition="leading"
            disabled={locked}
            onPress={onOpenCamera}
          />
        ) : (
          <Button
            label={slotKey === 'cccd_back' && reading
              ? 'Đang kiểm tra QR CCCD…'
              : slotKey === 'gplx_back' && reading
                ? 'Đang kiểm tra QR GPLX…'
                : step + 1 < slots.length
                  ? 'Tiếp tục'
                  : 'Hoàn tất chụp ảnh'}
            disabled={locked || reading || smallBlocked}
            onPress={() => {
              if (slotKey === 'cccd_back') { onContinueBack('CCCD'); return; }
              if (slotKey === 'gplx_back') { onContinueBack('GPLX'); return; }
              if (step + 1 < slots.length) onNextCaptureStep();
              else onCompleteCapture();
            }}
          />
        )}
        <Button variant="ghost" label="Quay lại" disabled={locked || reading} onPress={onBackFromCapture} />
      </View>
    );
  }

  if (stage === 'OCR') {
    if (reading) {
      return (
        <Button
          variant="secondary"
          label="Dừng đọc & tự nhập thông tin"
          onPress={onAbortExtractionToManual}
        />
      );
    }
    return (
      <View style={styles.footerStack}>
        <Button
          label={hasObservations ? 'Tiếp tục kiểm tra thông tin' : 'Tự nhập thông tin'}
          disabled={locked}
          onPress={onJumpConfirmFields}
        />
        <Button variant="ghost" label="Quay lại chụp ảnh" disabled={locked} onPress={onBackToCaptureFromOcr} />
      </View>
    );
  }

  if (stage === 'CONFIRM_FIELDS') {
    return (
      <View style={styles.footerStack}>
        <Button label="Xem tổng hợp" disabled={locked || reading} onPress={onGoSummary} />
        <Button
          variant="ghost"
          label="Quay lại"
          disabled={locked}
          onPress={() => onBackFromFields()}
        />
        {extractFailed ? (
          <Text style={styles.disabledHint}>Có thể quay lại bước đọc tự động hoặc quét lại mã QR.</Text>
        ) : null}
      </View>
    );
  }

  if (stage === 'SUMMARY') {
    const missingWarningAck = Boolean(currentWarningReview && !currentWarningReview.acknowledged);
    const blocked = warnings.some(warning => warning.blocksSubmission);
    return (
      <View style={styles.footerStack}>
        {blocked ? (
          <Text style={styles.disabledHint}>Bổ sung ảnh hoặc sửa mục được báo ở đầu hồ sơ để có thể nộp.</Text>
        ) : !confirm ? (
          <Text style={styles.disabledHint}>Xác nhận đã kiểm tra ảnh và thông tin để tiếp tục.</Text>
        ) : missingWarningAck ? (
          <Text style={styles.disabledHint}>Hồ sơ đã được đồng bộ. Xem các lưu ý và xác nhận lại để nộp.</Text>
        ) : null}
        <Button
          label={!currentWarningReview && warnings.some(warning => warning.requiresReview)
            ? 'Kiểm tra hồ sơ để nộp'
            : appStatus === 'NEEDS_MORE_INFO'
              ? 'Nộp bổ sung'
              : 'Nộp hồ sơ'}
          disabled={locked || reading || !confirm || missingWarningAck || blocked}
          onPress={onSubmit}
        />
        <Button variant="ghost" label="Sửa thông tin" disabled={locked} onPress={onJumpConfirmFields} />
      </View>
    );
  }

  return null;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    footerStack: { gap: spacing.spaceSm },
    disabledHint: { ...typography.bodySecondary, color: colors.onSurfaceVariant, textAlign: 'center' },
  });
