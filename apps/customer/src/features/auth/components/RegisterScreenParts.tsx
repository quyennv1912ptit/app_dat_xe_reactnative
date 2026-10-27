import { borderRadius,colors,spacing,typography } from '@datxe/ui';
import { StyleSheet } from 'react-native';
export const genderOptions = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export function formatIsoDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isPastIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: spacing.margin, paddingTop: spacing.spaceXs },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: spacing.formMaxWidth + spacing.margin * 2, alignSelf: 'center', paddingHorizontal: spacing.margin, paddingVertical: spacing.spaceLg },
  card: { width: '100%', padding: spacing.spaceMd, gap: spacing.spaceMd, borderRadius: borderRadius.xxl },
  fieldGroup: { gap: spacing.spaceXs },
  fieldLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  textInput: { minHeight: 52, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.lg, paddingHorizontal: spacing.spaceMd, ...typography.bodyMd, color: colors.onSurface, backgroundColor: colors.surfaceContainerLowest },
  fieldHint: { ...typography.labelSm, color: colors.onSurfaceVariant },
  genderOptions: { flexDirection: 'row', gap: spacing.spaceSm, flexWrap: 'wrap' },
  genderOption: { paddingVertical: spacing.spaceSm, paddingHorizontal: spacing.spaceMd, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLowest },
  genderOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryFixedTint },
  genderOptionText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  genderOptionTextSelected: { color: colors.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, padding: spacing.spaceSm, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerLow },
  infoCopy: { flex: 1 },
  infoLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  infoValue: { ...typography.labelMd, color: colors.onSurface, marginTop: spacing.py1 },
  helperText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  errorText: { ...typography.bodyMd, color: colors.error },
  submitButton: { marginTop: spacing.spaceXs },
  legalNotice: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  legalLink: { color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' },
});
