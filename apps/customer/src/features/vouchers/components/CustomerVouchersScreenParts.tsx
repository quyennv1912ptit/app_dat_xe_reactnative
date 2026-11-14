import type { CustomerVoucher } from "@datxe/shared";
import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";

export const money = (amount: number) =>
  i18nT("{0} đ", { "0": new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(amount) });

export const date = (value: string) =>
  new Date(value).toLocaleDateString(getLocale());

export function getVoucherPresentation(voucher: CustomerVoucher) {
  if (voucher.campaignCode) {
    const slotBadge =
      voucher.claimSequence != null && voucher.campaignClaimLimit != null
        ? i18nT("{0} · Suất #{1}/{2}", {
            "0": voucher.campaignCode,
            "1": voucher.claimSequence,
            "2": voucher.campaignClaimLimit,
          })
        : voucher.claimSequence != null
          ? i18nT("{0} · Suất #{1}", { "0": voucher.campaignCode, "1": voucher.claimSequence })
          : voucher.campaignCode;
    return {
      title: voucher.campaignTitle?.trim() || voucher.campaignCode,
      badge: slotBadge,
      description: voucher.description || null,
      isCampaign: true,
    };
  }
  if (voucher.code) {
    return {
      title: i18nT(voucher.code),
      badge: i18nT("Mã công khai"),
      description: voucher.description || null,
      isCampaign: false,
    };
  }
  const isWelcome = voucher.source === "SYSTEM_REWARD" && (voucher.milestone ?? 0) === 0;
  return {
    title: isWelcome ? i18nT("Voucher chào mừng thành viên mới") : i18nT("Ưu đãi dành riêng cho bạn"),
    badge: isWelcome ? i18nT("Quà chào mừng") : i18nT("Ưu đãi hệ thống"),
    description: voucher.description || (isWelcome ? i18nT("Áp dụng cho chuyến đi đầu tiên của bạn") : null),
    isCampaign: false,
  };
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.margin, gap: 14, paddingBottom: 28 },
    intro: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    voucher: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 14,
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
    details: { flex: 1, gap: 5 },
    titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    code: { ...typography.labelLg, color: colors.primary, fontWeight: "700" },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.primarySoft ?? colors.primaryFixedTint,
    },
    badgeText: {
      ...typography.labelSm,
      color: colors.primary,
      fontWeight: "700",
    },
    description: { ...typography.bodySm, color: colors.onSurface, fontStyle: "italic" },
    discount: { ...typography.labelMd, color: colors.onSurface, fontWeight: "600" },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    use: { alignSelf: "flex-start", paddingVertical: 6 },
    useText: { ...typography.labelMd, color: colors.primary, fontWeight: "700" },
    empty: { alignItems: "center", gap: 8, padding: 24 },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    error: { ...typography.bodyMd, color: colors.error },
  });