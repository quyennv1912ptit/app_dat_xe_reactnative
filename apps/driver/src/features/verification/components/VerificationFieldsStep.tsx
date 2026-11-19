import { Fragment } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Divider } from 'react-native-paper';
import {
  Button,
  Card,
  FilterChip,
  SharedStatusBadge,
  Typography as Text,
  ThemedTextInput as TextInput,
  borderRadius,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import type { Application, VerificationWarning } from '../api';
import {
  cccdFieldKeys,
  fieldAllowed,
  fieldLabelMap,
  gplxFieldKeys,
  isIdentityLockedField,
  optionalFields,
  slotLabelMap,
  type PhotoAsset,
  type QrDecision,
  type SlotMap,
} from '../verificationLabels';
import {
  compareNames,
  formatOriginLabel,
  type Choice,
  type Choices,
  type FieldKey,
  type Fields,
  type QrDocumentType,
  type SlotKey,
} from '../workflow';
import { AlertBanner, SlotPhotoFrame, WarningBannerList } from './VerificationShared';

type Props = {
  app: Application | null;
  locked: boolean;
  reading: boolean;
  values: Fields;
  noExpiry: boolean;
  origins: Partial<Record<FieldKey, Choice>>;
  manualFields: Partial<Record<FieldKey, boolean>>;
  choices: Choices;
  warnings: readonly VerificationWarning[];
  photos: SlotMap<PhotoAsset>;
  resolvedUri: (key: SlotKey) => string | undefined;
  qrDecision: QrDecision;
  gplxQrDecision: QrDecision;
  cccdRevalidationNeeded: boolean;
  gplxRevalidationNeeded: boolean;
  compareGroup: 'CCCD' | 'GPLX' | null;
  nameMismatch: ReturnType<typeof compareNames> | null;
  dobMismatch: boolean;
  ocrLockedCccdConflict: boolean;
  onToggleCompare: (group: 'CCCD' | 'GPLX') => void;
  onOpenLiveQr: (docType: QrDocumentType) => void;
  onPreviewSaved: (key: SlotKey) => void;
  onManualChange: (key: FieldKey, value: string, unlimited?: boolean) => void;
  onApplyChoice: (key: FieldKey, choice: Choice) => void;
};

/** Flat two-section form (CCCD & GPLX) without card-per-field nesting, keeping origin and lock clarity. */
export function VerificationFieldsStep({
  app,
  locked,
  reading,
  values,
  noExpiry,
  origins,
  manualFields,
  choices,
  warnings,
  photos,
  resolvedUri,
  qrDecision,
  gplxQrDecision,
  cccdRevalidationNeeded,
  gplxRevalidationNeeded,
  compareGroup,
  nameMismatch,
  dobMismatch,
  ocrLockedCccdConflict,
  onToggleCompare,
  onOpenLiveQr,
  onPreviewSaved,
  onManualChange,
  onApplyChoice,
}: Props) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  function renderOriginBadge(key: FieldKey, identityLockedField: boolean) {
    if (identityLockedField) {
      return (
        <Text style={[styles.originText, { color: colors.primary }]}>
          Đã khóa xác minh
        </Text>
      );
    }
    const origin = origins[key];
    if (origin) {
      return <Text style={styles.originText}>{formatOriginLabel(origin)}</Text>;
    }
    if (manualFields[key] || Boolean(values[key]?.trim())) {
      return <Text style={styles.originText}>Tài xế nhập</Text>;
    }
    return null;
  }

  function renderFieldRow(key: FieldKey) {
    const label = fieldLabelMap[key];
    const identityLockedField = isIdentityLockedField(key, app);
    const fieldEditable = !locked && fieldAllowed(app, key) && !identityLockedField;
    const fieldWarnings = warnings.filter(warning => warning.fieldKey === key);
    const fieldChoices = identityLockedField ? [] : (choices[key] ?? []);
    const hasConflict = fieldChoices.length > 1 || fieldChoices.some(choice => choice.conflict);
    const missingRequired = !optionalFields.has(key)
      && !(key === 'expiry_date' && noExpiry)
      && !(values[key] ?? '').trim();

    return (
      <View key={key} style={styles.fieldRow}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {renderOriginBadge(key, identityLockedField)}
        </View>

        <WarningBannerList items={fieldWarnings} />

        {key === 'cccd_gender' ? (
          <View style={styles.chipRow}>
            <FilterChip
              label="Nam"
              selected={values[key] === 'MALE'}
              disabled={!fieldEditable}
              onPress={() => onManualChange(key, 'MALE')}
            />
            <FilterChip
              label="Nữ"
              selected={values[key] === 'FEMALE'}
              disabled={!fieldEditable}
              onPress={() => onManualChange(key, 'FEMALE')}
            />
            {values[key] ? (
              <FilterChip
                label="Bỏ chọn"
                icon="close"
                selected={false}
                disabled={!fieldEditable}
                onPress={() => onManualChange(key, '')}
              />
            ) : null}
          </View>
        ) : (
          <TextInput
            accessibilityLabel={label}
            style={[
              styles.input,
              {
                backgroundColor: identityLockedField ? colors.surfaceContainer : colors.surfaceContainerHigh,
                color: identityLockedField ? colors.onSurfaceVariant : colors.onSurface,
              },
            ]}
            value={values[key] ?? ''}
            keyboardType={key === 'cccd_id' ? 'number-pad' : 'default'}
            placeholder={key === 'expiry_date' && noExpiry ? 'Không thời hạn' : `Nhập ${label.toLowerCase()}`}
            editable={fieldEditable && !(key === 'expiry_date' && noExpiry)}
            onChangeText={value => onManualChange(key, value)}
          />
        )}

        {identityLockedField ? (
          <Text style={styles.helperText}>Thông tin định danh đã xác minh được giữ nguyên.</Text>
        ) : null}

        {missingRequired ? (
          <Text style={[styles.helperText, { color: colors.error }]}>
            Thông tin bắt buộc — hãy kiểm tra hoặc nhập bổ sung.
          </Text>
        ) : null}

        {hasConflict ? (
          <View style={[styles.conflictBox, { backgroundColor: colors.warningContainer }]}>
            <Text style={[styles.conflictTitle, { color: colors.onWarningContainer }]}>
              Kết quả đọc được khác nhau — chạm để chọn đúng:
            </Text>
            <View style={styles.chipRow}>
              {fieldChoices.map(choice => {
                const choiceText = choice.noExpiry ? 'Không thời hạn' : choice.value;
                return (
                  <FilterChip
                    key={choice.noExpiry ? 'unlimited' : choice.value}
                    label={`${formatOriginLabel(choice)} · ${choiceText}`}
                    selected={values[key] === choice.value && (!choice.noExpiry || noExpiry)}
                    disabled={!fieldEditable}
                    onPress={() => onApplyChoice(key, choice)}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {key === 'expiry_date' ? (
          <View style={styles.switchRow}>
            <Switch
              accessibilityLabel="GPLX không thời hạn"
              value={noExpiry}
              disabled={!fieldEditable}
              onValueChange={value => onManualChange('expiry_date', value ? '' : values.expiry_date ?? '', value)}
            />
            <Text style={styles.switchLabel}>
              {noExpiry ? 'GPLX không thời hạn' : 'Bằng lái có ngày hết hạn'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  function renderCompareStrip(pair: readonly [SlotKey, SlotKey]) {
    const available = pair.filter(k => Boolean(photos[k] || app?.document?.captures[k]));
    if (!available.length) {
      return <Text style={styles.helperText}>Chưa có ảnh ở mục này để đối chiếu.</Text>;
    }
    return (
      <View style={styles.compareGrid}>
        {available.map(k => (
          <View key={k} style={styles.compareCell}>
            <Text style={styles.compareLabel}>{slotLabelMap[k]}</Text>
            <SlotPhotoFrame
              uri={resolvedUri(k)}
              label={slotLabelMap[k]}
              hasSavedCapture={Boolean(app?.document?.captures[k])}
              tile
              busy={locked}
              onLoadSaved={() => onPreviewSaved(k)}
            />
          </View>
        ))}
      </View>
    );
  }

  function renderQrBadge(decision: QrDecision) {
    if (decision.mode === 'SKIP_DECODED' || decision.mode === 'LIVE_SCANNED') {
      return <SharedStatusBadge label="Đã có mã QR" tone="success" icon="qr-code-2" />;
    }
    if (decision.mode === 'RECOMMEND_LIVE_SCAN') {
      return <SharedStatusBadge label="Nên quét QR" tone="pending" icon="qr-code-scanner" />;
    }
    return null;
  }

  return (
    <View style={styles.stack}>
      <Text style={styles.introText}>
        Kiểm tra lại thông tin đã điền sẵn và chỉnh sửa nếu có sai lệch so với giấy tờ gốc.
      </Text>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>1. Thông tin Căn cước công dân (CCCD)</Text>
          {renderQrBadge(qrDecision)}
        </View>

        {cccdRevalidationNeeded ? (
          <AlertBanner
            tone="warning"
            icon="refresh"
            message="Ảnh CCCD đã thay đổi — hãy đọc hoặc quét lại mã QR trước khi nộp."
          />
        ) : null}

        <View style={styles.inlineActions}>
          <Button
            variant="ghost"
            label={compareGroup === 'CCCD' ? 'Ẩn ảnh CCCD' : 'Xem ảnh CCCD'}
            icon={compareGroup === 'CCCD' ? 'visibility-off' : 'photo-library'}
            iconPosition="leading"
            onPress={() => onToggleCompare('CCCD')}
          />
          {qrDecision.mode !== 'SKIP_DECODED' && qrDecision.mode !== 'LIVE_SCANNED' && qrDecision.mode !== 'NO_QR_CARD' ? (
            <Button
              variant="secondary"
              label="Quét mã QR CCCD"
              icon="qr-code-scanner"
              iconPosition="leading"
              disabled={locked || reading}
              onPress={() => onOpenLiveQr('CCCD')}
            />
          ) : null}
        </View>

        {compareGroup === 'CCCD' ? renderCompareStrip(['cccd_front', 'cccd_back']) : null}

        {cccdFieldKeys.map((key, idx) => (
          <Fragment key={key}>
            {idx > 0 ? <Divider style={{ backgroundColor: colors.outlineVariant }} /> : null}
            {renderFieldRow(key)}
          </Fragment>
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>2. Thông tin Giấy phép lái xe (GPLX)</Text>
          {renderQrBadge(gplxQrDecision)}
        </View>
        <Text style={styles.helperText}>
          Dùng để xét quyền lái từng nhóm xe. Sau khi được duyệt, bạn sẽ chọn loại xe nhận chuyến ở bước riêng.
        </Text>

        {gplxRevalidationNeeded ? (
          <AlertBanner
            tone="warning"
            icon="refresh"
            message="Ảnh GPLX đã thay đổi — hãy đọc hoặc quét lại mã QR trước khi nộp."
          />
        ) : null}

        <View style={styles.inlineActions}>
          <Button
            variant="ghost"
            label={compareGroup === 'GPLX' ? 'Ẩn ảnh GPLX' : 'Xem ảnh GPLX'}
            icon={compareGroup === 'GPLX' ? 'visibility-off' : 'photo-library'}
            iconPosition="leading"
            onPress={() => onToggleCompare('GPLX')}
          />
          {gplxQrDecision.mode !== 'SKIP_DECODED' && gplxQrDecision.mode !== 'LIVE_SCANNED' && gplxQrDecision.mode !== 'NO_QR_CARD' ? (
            <Button
              variant="secondary"
              label="Quét mã QR GPLX"
              icon="qr-code-scanner"
              iconPosition="leading"
              disabled={locked || reading}
              onPress={() => onOpenLiveQr('GPLX')}
            />
          ) : null}
        </View>

        {compareGroup === 'GPLX' ? renderCompareStrip(['gplx_front', 'gplx_back']) : null}

        {gplxFieldKeys.map((key, idx) => (
          <Fragment key={key}>
            {idx > 0 ? <Divider style={{ backgroundColor: colors.outlineVariant }} /> : null}
            {renderFieldRow(key)}
          </Fragment>
        ))}
      </Card>

      {nameMismatch && nameMismatch !== 'EXACT_MATCH' ? (
        <AlertBanner
          tone="warning"
          icon="warning-amber"
          message={nameMismatch === 'DIACRITIC_MISMATCH'
            ? 'Họ tên trên CCCD và GPLX đang khác dấu tiếng Việt. Hãy kiểm tra lại.'
            : 'Họ tên giữa CCCD và GPLX đang khác nhau. Hãy đối chiếu lại.'}
        />
      ) : null}

      {dobMismatch ? (
        <AlertBanner
          tone="error"
          icon="error-outline"
          role="alert"
          message="Ngày sinh trên CCCD và GPLX chưa khớp nhau."
        />
      ) : null}

      {ocrLockedCccdConflict ? (
        <AlertBanner
          tone="error"
          icon="error-outline"
          role="alert"
          message="Ảnh CCCD vừa quét có số định danh khác với tài khoản đã xác minh. Thông tin định danh cố định đã được giữ nguyên."
        />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    stack: { gap: spacing.spaceMd },
    introText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    sectionCard: { gap: spacing.px3 },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.spaceSm,
    },
    sectionTitle: { ...typography.sectionTitle, color: colors.onSurface, flexShrink: 1 },
    inlineActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.spaceSm,
    },
    compareGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.spaceSm,
    },
    compareCell: {
      width: '48%',
      minWidth: 136,
      flexGrow: 1,
      gap: spacing.xxs,
    },
    compareLabel: { ...typography.label, color: colors.onSurfaceVariant },
    fieldRow: {
      gap: spacing.spaceXs,
      paddingVertical: spacing.xxs,
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.spaceXs,
    },
    fieldLabel: { ...typography.label, color: colors.onSurface },
    originText: { ...typography.caption, color: colors.onSurfaceVariant },
    input: {
      borderRadius: borderRadius.default,
      paddingHorizontal: spacing.px3,
      paddingVertical: spacing.px3,
      minHeight: 48,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.spaceSm,
    },
    helperText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    conflictBox: {
      padding: spacing.px3,
      borderRadius: spacing.spaceMd,
      gap: spacing.spaceSm,
    },
    conflictTitle: { ...typography.label },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.spaceSm,
      paddingTop: spacing.xxs,
    },
    switchLabel: { ...typography.bodySecondary, color: colors.onSurface, flex: 1 },
  });
