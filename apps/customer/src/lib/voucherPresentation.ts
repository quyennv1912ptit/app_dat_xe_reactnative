import type { CustomerVoucher } from "@datxe/shared";
import { translate as i18nT } from "@datxe/shared";

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
