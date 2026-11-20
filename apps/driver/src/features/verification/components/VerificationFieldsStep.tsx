import { Fragment, useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Button,
  Card,
  CustomDatePickerModal,
  FilterChip,
  MotionPressable,
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
  formatVnDate,
  gplxFieldKeys,
  isIdentityLockedField,
  isoToLocalDate,
  localDateToIso,
  optionalFields,
  slotLabelMap,
  type PhotoAsset,
  type QrDecision,
  type SlotMap,
} from '../verificationLabels';
import {
  compareNames,
  fields,
  formatOriginLabel,
  type Choice,
  type Choices,
  type FieldKey,
  type Fields,
  type QrDocumentType,
  type SlotKey,
} from '../workflow';
import { AlertBanner, SlotPhotoFrame, WarningBannerList } from './VerificationShared';

const dateFieldKeys = new Set<FieldKey>(['cccd_dob', 'gplx_dob', 'cccd_expiry_date', 'expiry_date']);
const commonGplxClasses = ['A1', 'A', 'B1', 'B', 'C1', 'C'] as const;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function parseClassList(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of raw.toUpperCase().split(/[,;\s]+/)) {
    const token = item.trim();
    if (token && !seen.has(token)) {
      seen.add(token);
      list.push(token);
    }
  }
  return list;
}

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
  onIssueCountChange?: (count: number) => void;
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
  onIssueCountChange,
}: Props) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const [dateField, setDateField] = useState<FieldKey | null>(null);

  function renderOriginBadge(key: FieldKey, identityLockedField: boolean) {
    if (identityLockedField) {
      return (
        <View style={styles.originLockWrap}>
          <MaterialIcons name="lock-outline" size={14} color={colors.primary} importantForAccessibility="no" />
          <Text style={[styles.originText, { color: colors.primary }]}>
            Đã khóa xác minh
          </Text>
        </View>
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

  function hasInlineIssue(key: FieldKey): boolean {
    const trimmed = (values[key] ?? '').trim();
    if (!optionalFields.has(key) && !(key === 'expiry_date' && noExpiry) && !trimmed) return true;
    if (!trimmed) return false;
    if (key === 'cccd_id' && !/^\d{12}$/.test(trimmed)) return true;
    if (dateFieldKeys.has(key) && !(key === 'expiry_date' && noExpiry) && !isValidIsoDate(trimmed)) return true;
    return false;
  }

  const issueCount = fields.filter(([key]) => hasInlineIssue(key)).length;

  useEffect(() => {
    onIssueCountChange?.(issueCount);
  }, [issueCount, onIssueCountChange]);

  function renderFieldRow(key: FieldKey) {
    const label = fieldLabelMap[key];
    const identityLockedField = isIdentityLockedField(key, app);
    const fieldEditable = !locked && fieldAllowed(app, key) && !identityLockedField;
    const fieldWarnings = warnings.filter(warning => warning.fieldKey === key);
    const fieldChoices = identityLockedField ? [] : (choices[key] ?? []);
    const hasConflict = fieldChoices.length > 1 || fieldChoices.some(choice => choice.conflict);
    const trimmedValue = (values[key] ?? '').trim();
    const missingRequired = !optionalFields.has(key)
      && !(key === 'expiry_date' && noExpiry)
      && !trimmedValue;
    const invalidCccd = key === 'cccd_id' && Boolean(trimmedValue) && !/^\d{12}$/.test(trimmedValue);
    const isDateField = dateFieldKeys.has(key);
    const invalidDate = isDateField && Boolean(trimmedValue) && !isValidIsoDate(trimmedValue);
    const dateDisplay = trimmedValue ? formatVnDate(trimmedValue) : '';
    const dateFieldDisabled = !fieldEditable || (key === 'expiry_date' && noExpiry);
    const selectedClasses = key === 'gplx_classes' ? parseClassList(values[key]) : [];

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
        ) : isDateField ? (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${key === 'expiry_date' && noExpiry ? 'không thời hạn' : dateDisplay || 'chưa chọn ngày'}`}
            accessibilityHint="Mở bộ chọn ngày"
            accessibilityState={{ disabled: dateFieldDisabled }}
            disabled={dateFieldDisabled}
            onPress={() => setDateField(key)}
            style={[
              styles.dateField,
              { backgroundColor: identityLockedField ? colors.surfaceContainer : colors.surfaceContainerHigh },
            ]}
          >
            <Text
              style={[
                styles.dateText,
                !dateDisplay && styles.datePlaceholder,
                identityLockedField && { color: colors.onSurfaceVariant },
              ]}
            >
              {key === 'expiry_date' && noExpiry
                ? 'Không thời hạn'
                : dateDisplay || 'Chọn ngày'}
            </Text>
            <MaterialIcons
              name="calendar-month"
              size={20}
              color={colors.onSurfaceVariant}
              importantForAccessibility="no"
            />
          </MotionPressable>
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
            maxLength={key === 'cccd_id' ? 12 : undefined}
            autoCapitalize={key === 'cccd_name' || key === 'gplx_name' || key === 'gplx_number' || key === 'gplx_classes' ? 'characters' : 'none'}
            returnKeyType="done"
            placeholder={key === 'expiry_date' && noExpiry ? 'Không thời hạn' : `Nhập ${label.toLowerCase()}`}
            editable={fieldEditable && !(key === 'expiry_date' && noExpiry)}
            onChangeText={value => onManualChange(key, value)}
          />
        )}

        {key === 'gplx_classes' && fieldEditable ? (
          <View style={styles.quickPickWrap}>
            <Text style={styles.captionText}>Chọn nhanh hạng phổ biến:</Text>
            <View style={styles.chipRow}>
              {commonGplxClasses.map(cls => {
                const active = selectedClasses.includes(cls);
                return (
                  <FilterChip
                    key={cls}
                    label={cls}
                    selected={active}
                    disabled={!fieldEditable}
                    onPress={() => {
                      const next = active
                        ? selectedClasses.filter(item => item !== cls)
                        : [...selectedClasses, cls];
                      onManualChange(key, next.join(', '));
                    }}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {identityLockedField ? (
          <Text style={styles.helperText}>Thông tin định danh đã xác minh được giữ nguyên.</Text>
        ) : null}

        {missingRequired ? (
          <Text style={[styles.helperText, { color: colors.error }]}>
            Thông tin bắt buộc — hãy kiểm tra hoặc nhập bổ sung.
          </Text>
        ) : null}

        {invalidCccd ? (
          <Text style={[styles.helperText, { color: colors.error }]}>
            Cần nhập đủ 12 chữ số.
          </Text>
        ) : null}

        {invalidDate ? (
          <Text style={[styles.helperText, { color: colors.error }]}>
            Ngày đã lưu chưa hợp lệ. Chạm vào ô ngày để chọn lại.
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
          <MotionPressable
            accessible={false}
            disabled={!fieldEditable}
            onPress={() => {
              const nextNoExpiry = !noExpiry;
              onManualChange('expiry_date', nextNoExpiry ? '' : values.expiry_date ?? '', nextNoExpiry);
            }}
            style={styles.switchRow}
          >
            <Switch
              accessibilityLabel="GPLX không thời hạn"
              value={noExpiry}
              disabled={!fieldEditable}
              onValueChange={value => onManualChange('expiry_date', value ? '' : values.expiry_date ?? '', value)}
            />
            <Text style={styles.switchLabel}>
              {noExpiry ? 'GPLX không thời hạn' : 'Bằng lái có ngày hết hạn'}
            </Text>
          </MotionPressable>
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

      {issueCount > 0 ? (
        <AlertBanner
          tone="info"
          icon="info-outline"
          message={`Còn ${issueCount} mục bắt buộc chưa điền hoặc cần kiểm tra định dạng.`}
        />
      ) : null}

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>1. Thông tin Căn cước công dân (CCCD)</Text>
          {renderQrBadge(qrDecision)}
        </View>

        {cccdRevalidationNeeded ? (
          <AlertBanner
            tone="info"
            icon="refresh"
            message="Ảnh CCCD đã thay đổi. Kiểm tra thông tin bên dưới theo ảnh mới. Có thể quét QR để điền nhanh."
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
            tone="info"
            icon="refresh"
            message="Ảnh GPLX đã thay đổi. Kiểm tra thông tin bên dưới theo ảnh mới. Có thể quét QR để điền nhanh."
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

      <CustomDatePickerModal
        visible={Boolean(dateField)}
        title={dateField ? `Chọn ${fieldLabelMap[dateField].replace(/\s*\([^)]*\)/g, '').toLowerCase()}` : 'Chọn ngày'}
        value={dateField ? isoToLocalDate(values[dateField]) : null}
        maximumDate={dateField === 'cccd_dob' || dateField === 'gplx_dob' ? new Date() : undefined}
        onCancel={() => setDateField(null)}
        onConfirm={date => {
          if (dateField) onManualChange(dateField, localDateToIso(date));
          setDateField(null);
        }}
      />
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
    originLockWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
    originText: { ...typography.caption, color: colors.onSurfaceVariant },
    captionText: { ...typography.caption, color: colors.onSurfaceVariant },
    quickPickWrap: { gap: spacing.spaceXs, paddingTop: spacing.xxs },
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.spaceSm,
      borderRadius: borderRadius.default,
      paddingHorizontal: spacing.px3,
      minHeight: 48,
    },
    dateText: { ...typography.body, color: colors.onSurface, flex: 1, fontVariant: ['tabular-nums'] },
    datePlaceholder: { color: colors.onSurfaceVariant },
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
      minHeight: 48,
      paddingTop: spacing.xxs,
    },
    switchLabel: { ...typography.bodySecondary, color: colors.onSurface, flex: 1 },
  });
