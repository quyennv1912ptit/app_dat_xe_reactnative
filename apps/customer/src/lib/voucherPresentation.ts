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
    const title = voucher.campaignTitle?.trim();
    return {
      title: title || i18nT(voucher.code),
      badge: title ? voucher.code : i18nT("Mã công khai"),
      description: voucher.description || null,
      isCampaign: false,
    };
  }
  const customTitle = voucher.campaignTitle?.trim();
  const customDesc = voucher.description?.trim();
  const milestone = voucher.milestone ?? 0;
  if (customTitle) {
    return {
      title: customTitle,
      badge: i18nT("Ưu đãi dành riêng cho bạn"),
      description: customDesc || null,
      isCampaign: false,
    };
  }
  if (milestone > 0) {
    return {
      title: i18nT("Ưu đãi mốc {0} chuyến", { "0": milestone }),
      badge: i18nT("Ưu đãi hệ thống"),
      description: customDesc || null,
      isCampaign: false,
    };
  }
  if (customDesc) {
    return {
      title: i18nT("Ưu đãi dành riêng cho bạn"),
      badge: i18nT("Ưu đãi cá nhân"),
      description: customDesc,
      isCampaign: false,
    };
  }
  const isWelcome = voucher.source === "SYSTEM_REWARD" && milestone === 0;
  return {
    title: isWelcome ? i18nT("Voucher chào mừng thành viên mới") : i18nT("Ưu đãi dành riêng cho bạn"),
    badge: isWelcome ? i18nT("Quà chào mừng") : i18nT("Ưu đãi hệ thống"),
    description: isWelcome ? i18nT("Áp dụng cho chuyến đi đầu tiên của bạn") : null,
    isCampaign: false,
  };
}
