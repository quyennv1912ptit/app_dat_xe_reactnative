import type { PaymentMethod } from '@datxe/shared';
import { borderRadius,colors,spacing,typography } from '@datxe/ui';
import { StyleSheet,Text,View } from 'react-native';
export const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: 'CASH', label: 'Tiền mặt' },
];

export const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

export const paramText = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? '' : value ?? '';

export function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.priceRow}><Text style={[styles.priceLabel, strong && styles.strong]}>{label}</Text><Text style={[styles.priceValue, strong && styles.strong]}>{value}</Text></View>;
}

export function formatLocalDateTime(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function parseLocalDateTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getTime() <= Date.now()) {
    return null;
  }
  return date.toISOString();
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  content: { padding: spacing.margin, gap: 14, paddingBottom: 28 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.lg, padding: 16, gap: 9, elevation: 1 },
  sectionTitle: { ...typography.labelLg, color: colors.onSurface, marginBottom: 4 },
  typeOptions: { flexDirection: 'row', gap: 8 },
  typeOption: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.lg },
  typeOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryFixedTint },
  typeOptionText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  typeOptionTextActive: { color: colors.primary },
  helper: { ...typography.labelSm, color: colors.onSurfaceVariant },
  label: { ...typography.labelSm, color: colors.primary },
  address: { ...typography.bodyMd, color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: 5 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  optionText: { ...typography.bodyMd, color: colors.onSurface },
  voucherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voucherInput: { ...typography.bodyMd, flex: 1, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.lg, padding: 11, color: colors.onSurface },
  apply: { backgroundColor: colors.primary, padding: 12, borderRadius: borderRadius.lg }, applyText: { ...typography.labelMd, color: colors.onPrimary },
  voucher: { borderRadius: borderRadius.lg, backgroundColor: colors.primaryFixedTint, padding: 10 }, voucherCode: { ...typography.labelMd, color: colors.primary }, voucherMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, priceLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant }, priceValue: { ...typography.bodyMd, color: colors.onSurface, textAlign: 'right' }, strong: { ...typography.labelLg, color: colors.onSurface },
  error: { ...typography.bodyMd, color: colors.error },
  primary: { marginHorizontal: spacing.margin, marginBottom: spacing.spaceMd, minHeight: 54, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, primaryText: { ...typography.labelLg, color: colors.onPrimary }, disabled: { opacity: 0.55 },
});
