import { getLocale, translate as i18nT, type CustomerVoucher } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const money = (amount: number) =>
  i18nT("{0} đ", { "0": new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(amount) });

export const date = (value: string) =>
  new Date(value).toLocaleDateString(getLocale());

export const voucherLabel = (
  voucher: Pick<CustomerVoucher, "code" | "campaignTitle" | "description" | "milestone">,
) => {
  const code = voucher.code?.trim();
  if (code) return code;
  const title = voucher.campaignTitle?.trim();
  if (title) return title;
  if (voucher.milestone && voucher.milestone > 0) {
    return i18nT("Ưu đãi mốc {0} chuyến", { "0": voucher.milestone });
  }
  return voucher.description?.trim() || i18nT("Ưu đãi cá nhân");
};

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.margin, gap: 12, paddingBottom: 28 },
    intro: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    voucher: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 0,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    voucherIcon: {
      width: 44,
      height: 44,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryFixedTint,
    },
    details: { flex: 1, gap: 4 },
    code: { ...typography.labelLg, color: colors.primary },
    discount: { ...typography.labelMd, color: colors.onSurface },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    use: { alignSelf: "flex-start", minHeight: 48, minWidth: 48, justifyContent: "center", paddingVertical: 6 },
    useText: { ...typography.labelMd, color: colors.primary },
    empty: { alignItems: "center", gap: 8, padding: 24 },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    sectionHeading: { ...typography.cardTitle, color: colors.onSurface, marginTop: 4 },
    error: { ...typography.bodyMd, color: colors.error },
  });
