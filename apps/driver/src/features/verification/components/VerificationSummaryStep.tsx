import { useState } from 'react';
import { groupVerificationWarnings, isPhotoQualityWarning } from '../warningPresentation';
import { StyleSheet, Switch, View } from 'react-native';
import {
  Button,
  Card,
  GroupedList,
  KeyValueRow,
  MotionPressable,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import type { Application, VerificationWarning } from '../api';
import {
  formatGenderValue,
  formatVnDate,
  isSmall,
  slotAllowed,
  type PhotoAsset,
  type SlotMap,
} from '../verificationLabels';
import { fields, slots, type FieldKey, type Fields, type SlotKey } from '../workflow';
import { AlertBanner, SlotPhotoFrame, WarningBannerList } from './VerificationShared';

type DraftFaceQuality = {
  revision: number;
  status: 'QUALITY_CHECKED' | 'NOT_EVALUATED';
  quality?: Record<string, string>;
  verificationWarnings: VerificationWarning[];
};

const faceSlotLabels: Record<string, string> = {
  cccd_front: 'CCCD mặt trước',
  gplx_front: 'GPLX mặt trước',
  selfie: 'Ảnh chân dung',
};

/** Compact final review view: 2-column thumbnail grid + KeyValueRow list + single confirmation checklist. */
export function VerificationSummaryStep({
  app,
  locked,
  reading,
  photos,
  pendingPhotoCount,
  resolvedUri,
  values,
  noExpiry,
  warnings,
  faceNotice,
  faceConsent,
  liveFace,
  checkingFace = false,
  confirm,
  currentWarningReview,
  onEditPhoto,
  onPreviewSaved,
  onToggleFaceConsent,
  onCheckFaceQuality,
  onToggleConfirm,
  onToggleWarningReview,
}: {
  app: Application | null;
  locked: boolean;
  reading: boolean;
  photos: SlotMap<PhotoAsset>;
  pendingPhotoCount: number;
  resolvedUri: (key: SlotKey) => string | undefined;
  values: Fields;
  noExpiry: boolean;
  warnings: readonly VerificationWarning[];
  faceNotice?: string;
  faceConsent: boolean;
  liveFace?: DraftFaceQuality;
  checkingFace?: boolean;
  confirm: boolean;
  currentWarningReview?: { revision: number; acknowledged: boolean };
  onEditPhoto: (index: number) => void;
  onPreviewSaved: (key: SlotKey) => void;
  onToggleFaceConsent: (value: boolean) => void;
  onCheckFaceQuality: () => void;
  onToggleConfirm: (value: boolean) => void;
  onToggleWarningReview: (revision: number, acknowledged: boolean) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const urgent = warnings.filter(warning => warning.blocksSubmission || warning.blocksActivation
    || warning.severity === 'CRITICAL' || warning.severity === 'BLOCKING');
  const notes = warnings.filter(warning => !urgent.includes(warning));
  const noteCount = groupVerificationWarnings(notes).length;
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const preparedSlots = slots.filter(([key]) => Boolean(photos[key] || app?.document?.captures[key]));

  function displayValue(key: FieldKey): string {
    if (key === 'expiry_date' && noExpiry) return 'Không thời hạn';
    if (key === 'cccd_gender') return formatGenderValue(values[key]);
    const value = values[key]?.trim() || '—';
    return key.includes('dob') || key.includes('expiry_date')
      ? formatVnDate(value) : value;
  }

  return (
    <View style={styles.stack}>
      <Text style={styles.introText}>
        Kiểm tra nhanh ảnh giấy tờ và thông tin cá nhân trước khi gửi xét duyệt.
      </Text>

      <WarningBannerList items={urgent} />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Ảnh giấy tờ ({preparedSlots.length}/{slots.length})</Text>
        <View style={styles.photoGrid}>
          {preparedSlots.map(([key, label]) => {
            const slotIdx = slots.findIndex(([item]) => item === key);
            const allowed = slotAllowed(app, key);
            const slotWarns = warnings.filter(w => w.slot === key && isPhotoQualityWarning(w));
            return (
              <View key={key} style={styles.photoCell}>
                <Text style={styles.cellTitle}>{label}</Text>
                <SlotPhotoFrame
                  uri={resolvedUri(key)}
                  label={label}
                  hasSavedCapture={Boolean(app?.document?.captures[key])}
                  isSelfie={key === 'selfie'}
                  tile
                  busy={locked}
                  onLoadSaved={() => onPreviewSaved(key)}
                />
                {photos[key] && isSmall(photos[key]!) ? (
                  <Text style={styles.mutedText}>Ảnh nhỏ · đã xác nhận</Text>
                ) : null}
                {slotWarns.length ? (
                  <Text style={[styles.mutedText, { color: colors.onSurfaceVariant }]}>
                    Kiểm tra lại độ rõ của ảnh
                  </Text>
                ) : null}
                <Button
                  variant="ghost"
                  label="Chụp lại"
                  accessibilityLabel={`Sửa ảnh ${label}`}
                  disabled={locked || !allowed}
                  onPress={() => onEditPhoto(slotIdx)}
                />
              </View>
            );
          })}
        </View>
      </Card>

      <GroupedList title="Thông tin CCCD & GPLX">
        <View style={styles.rowsContainer}>
          {fields.map(([key, label]) => (
            <KeyValueRow
              key={key}
              label={label.replace(/\s*\([^)]*\)/g, '')}
              value={displayValue(key)}
              tabular={key === 'cccd_id' || key === 'cccd_dob' || key === 'gplx_dob' || key === 'expiry_date' || key === 'cccd_expiry_date' || key === 'gplx_number'}
            />
          ))}
        </View>
      </GroupedList>

      {pendingPhotoCount > 0 ? (
        <AlertBanner tone="info" icon="cloud-upload" message={`${pendingPhotoCount} ảnh đang lưu trên máy. Ảnh sẽ được tải lên khi bạn kiểm tra hồ sơ để nộp.`} />
      ) : null}
      {noteCount > 0 ? (
        <Card style={styles.card}>
          <Button variant="ghost" label={showNotes ? "Thu gọn lưu ý" : `Xem ${noteCount} lưu ý khi xét duyệt`}
            accessibilityLabel={showNotes ? "Thu gọn lưu ý xét duyệt" : `Mở ${noteCount} lưu ý xét duyệt`} onPress={() => setShowNotes(value => !value)} />
          {showNotes ? <WarningBannerList items={notes} /> : null}
        </Card>
      ) : null}

      {faceNotice ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Đối chiếu & kiểm tra khuôn mặt</Text>
          <MotionPressable
            accessible={false}
            disabled={locked || reading}
            onPress={() => onToggleFaceConsent(!faceConsent)}
            style={[styles.switchBox, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <Switch
              accessibilityLabel="Cho phép kiểm tra chất lượng ảnh chân dung và để admin đối chiếu với ảnh giấy tờ"
              value={faceConsent}
              disabled={locked || reading}
              onValueChange={onToggleFaceConsent}
            />
            <Text style={styles.switchText}>
              Cho phép kiểm tra khuôn mặt và đối chiếu ảnh chân dung với CCCD, GPLX khi xét duyệt.
            </Text>
          </MotionPressable>
          {faceConsent ? (
            <View style={styles.faceCheckBlock}>
              {checkingFace ? (
                <AlertBanner
                  tone="info"
                  icon="face"
                  live
                  message="Đang tự động kiểm tra khuôn mặt trên CCCD, GPLX và ảnh chân dung…"
                />
              ) : liveFace ? (
                <>
                  {liveFace.status === 'QUALITY_CHECKED' && liveFace.verificationWarnings.length === 0 ? (
                    <AlertBanner
                      tone="success"
                      icon="check-circle-outline"
                      live
                      message="Khuôn mặt trên CCCD, GPLX và ảnh chân dung đã rõ nét, sẵn sàng đối chiếu khi xét duyệt."
                    />
                  ) : (
                    <AlertBanner
                      tone="info"
                      icon="info-outline"
                      live
                      message={liveFace.status === 'NOT_EVALUATED'
                        ? 'Chưa đánh giá được ảnh. Bạn vẫn có thể gửi để admin xem thủ công.'
                        : 'Đã kiểm tra chất lượng ảnh. Bạn có thể chụp lại theo cảnh báo hoặc gửi để admin xem thủ công.'}
                    />
                  )}
                  {liveFace.quality && Object.keys(liveFace.quality).length > 0 ? (
                    <View style={styles.rowsContainer}>
                      {Object.entries(liveFace.quality).map(([slot, status]) => (
                        <KeyValueRow
                          key={slot}
                          label={faceSlotLabels[slot] ?? slot}
                          value={status === 'READY' ? 'Khuôn mặt rõ nét' : 'Cần kiểm tra lại'}
                        />
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}
              <Button
                variant="secondary"
                label={liveFace ? 'Kiểm tra lại ảnh chân dung' : 'Kiểm tra chất lượng ảnh chân dung'}
                loading={checkingFace}
                disabled={locked || reading || checkingFace}
                onPress={onCheckFaceQuality}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <MotionPressable
          accessible={false}
          disabled={locked || reading}
          onPress={() => {
            const next = !(confirm && currentWarningReview?.acknowledged !== false);
            onToggleConfirm(next);
            if (currentWarningReview) onToggleWarningReview(currentWarningReview.revision, next);
          }}
          style={[
            styles.switchBox,
            {
              backgroundColor:
                confirm && currentWarningReview?.acknowledged !== false
                  ? colors.primaryContainer
                  : colors.surfaceContainerHigh,
            },
          ]}
        >
          <Switch
            accessibilityLabel="Tôi đã kiểm tra ảnh, thông tin và các lưu ý của hồ sơ này, đồng ý gửi xét duyệt"
            value={confirm && currentWarningReview?.acknowledged !== false}
            disabled={locked || reading}
            onValueChange={value => {
              onToggleConfirm(value);
              if (currentWarningReview) onToggleWarningReview(currentWarningReview.revision, value);
            }}
          />
          <Text
            style={[
              styles.switchText,
              confirm && currentWarningReview?.acknowledged !== false && { color: colors.onPrimaryContainer },
            ]}
          >
            Tôi đã kiểm tra ảnh, thông tin và các lưu ý của hồ sơ này, đồng ý gửi xét duyệt.
          </Text>
        </MotionPressable>

      </Card>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    stack: { gap: spacing.spaceMd },
    introText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    card: { gap: spacing.px3 },
    sectionTitle: { ...typography.sectionTitle, color: colors.onSurface },
    cardTitle: { ...typography.cardTitle, color: colors.onSurface },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.spaceSm,
    },
    photoCell: {
      width: '48%',
      minWidth: 140,
      flexGrow: 1,
      gap: spacing.xxs,
    },
    cellTitle: { ...typography.label, color: colors.onSurface },
    mutedText: { ...typography.caption, color: colors.onSurfaceVariant },
    rowsContainer: { paddingVertical: spacing.spaceXs, gap: spacing.spaceSm },
    switchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.spaceSm,
      padding: spacing.px3,
      minHeight: 56,
      borderRadius: spacing.spaceMd,
    },
    switchText: { ...typography.bodySecondary, color: colors.onSurface, flex: 1 },
    faceCheckBlock: { gap: spacing.spaceSm },
  });
