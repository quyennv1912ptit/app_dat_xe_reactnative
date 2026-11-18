import { ActivityIndicator } from "react-native-paper";
import type { CustomerVoucher, CustomerVoucherCampaign } from "@datxe/shared";
import { getLocale, translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal, ScrollView, StyleSheet, View } from "react-native";

import { campaignClaimBlocked, isVoucherSelected, money, voucherUnavailable } from "../bookingUtils";
import { getVoucherPresentation } from "@/lib/voucherPresentation";
import { bookingStyles as base_s } from "./bookingStyles";
type Props = {
  visible: boolean;
  close: () => void;
  vouchers: CustomerVoucher[];
  loading: boolean;
  error?: string;
  applyError: string;
  selectedCode: string;
  selectedId?: number | null;
  applyingKey: string | null;
  subtotal?: number;
  onApply: (selection: { id: number | null; code: string }) => void;
  onRetry: () => void;
  campaigns: CustomerVoucherCampaign[];
  campaignsLoading: boolean;
  campaignsError?: string;
  retryCampaigns: () => void;
  claimVoucher: (campaignId: number) => void;
  claimingCampaignId: number | null;
};
export function VoucherPickerModal(p: Props) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const s = useThemedStyles(base_s);

  const claimedCodes = new Set(
    p.vouchers.map((voucher) => voucher.campaignCode).filter(Boolean) as string[],
  );
  const claimable = p.campaigns.filter(
    (campaign) => !claimedCodes.has(campaign.code) && campaignClaimBlocked(campaign) === null,
  );

  return (
    <Modal
      visible={p.visible}
      transparent
      animationType="slide"
      onRequestClose={p.close}
    >
      <View style={extra.item1}>
        <Pressable
          accessibilityLabel={i18nT("Đóng ưu đãi")}
          style={extra.item2}
          onPress={p.close}
        />
        <SafeAreaView edges={["bottom"]} style={[s.sheet, extra.item3]}>
          <View style={s.handle} />
          <View style={s.between}>
            <View style={s.flex}>
              <Text style={s.title}>{i18nT("Ưu đãi cho chuyến đi")}</Text>
              <Text style={s.muted}>
                {i18nT("Chọn một ưu đãi phù hợp với bạn")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT("Đóng")}
              onPress={p.close}
              style={extra.closeButton}
            >
              <MaterialIcons
                name="close"
                size={25}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={extra.item4}
          >
            {p.applyError ? (
              <View style={s.errorBox}>
                <Text accessibilityRole="alert" style={s.error}>
                  {i18nT(p.applyError)}
                </Text>
              </View>
            ) : null}
            <Pressable
              disabled={p.applyingKey !== null}
              onPress={() => p.onApply({ id: null, code: "" })}
              accessibilityRole="radio"
              accessibilityLabel={i18nT("Không dùng ưu đãi")}
              accessibilityState={{
                selected: !p.selectedCode && p.selectedId == null,
                checked: !p.selectedCode && p.selectedId == null,
                disabled: p.applyingKey !== null,
              }}
              style={[s.card, s.row, !p.selectedCode && p.selectedId == null && s.selected]}
            >
              <MaterialIcons
                name={
                  !p.selectedCode && p.selectedId == null
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={23}
                color={colors.primary}
              />
              <Text style={[s.text, s.flex]}>{i18nT("Không dùng ưu đãi")}</Text>
              {p.applyingKey === "NONE" ? <ActivityIndicator /> : null}
            </Pressable>
            {p.campaignsLoading ? <ActivityIndicator color={colors.primary} /> : null}
            {p.campaignsError ? (
              <View style={s.errorBox}>
                <Text style={s.error}>{i18nT(p.campaignsError)}</Text>
                <Pressable accessibilityRole="button" style={extra.retryLink} onPress={p.retryCampaigns}>
                  <Text style={s.link}>{i18nT("Tải lại ưu đãi")}</Text>
                </Pressable>
              </View>
            ) : null}
            {claimable.length ? (
              <Text style={s.section}>{i18nT("Ưu đãi đang mở")}</Text>
            ) : null}
            {claimable.map((campaign) => {
              const claiming = p.claimingCampaignId === campaign.id;
              return (
                <View key={campaign.id} style={s.card}>
                  <View style={s.row}>
                    <View style={[s.icon, extra.item6]}>
                      <MaterialIcons
                        name="campaign"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={s.flex}>
                      <Text style={s.section}>
                        {campaign.campaignTitle?.trim() || campaign.code}
                      </Text>
                      <Text style={s.muted}>
                        {campaign.discountType === "PERCENT"
                          ? i18nT("Giảm {0}%", { "0": campaign.value })
                          : i18nT("Giảm {0}", { "0": money(campaign.value) })}
                        {campaign.maxDiscount !== null
                          ? i18nT(" · Tối đa {0}", {
                              "0": money(campaign.maxDiscount),
                            })
                          : ""}
                      </Text>
                      <Text style={s.muted}>
                        {i18nT("Chuyến từ")} {money(campaign.minimumOrderAmount)}{" "}
                        {i18nT("· Hết hạn")}{" "}
                        {new Date(campaign.validTo).toLocaleDateString(getLocale())}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={i18nT("Nhận ưu đãi {0}", {
                        0: campaign.campaignTitle?.trim() || campaign.code,
                      })}
                      disabled={claiming}
                      onPress={() => p.claimVoucher(campaign.id)}
                      hitSlop={8}
                      style={extra.claimButton}
                    >
                      {claiming ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={s.link}>{i18nT("Nhận")}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {p.loading ? <ActivityIndicator color={colors.primary} /> : null}
            {p.error ? (
              <View style={s.errorBox}>
                <Text style={s.error}>{i18nT(p.error)}</Text>
                <Pressable accessibilityRole="button" style={extra.retryLink} onPress={p.onRetry}>
                  <Text style={s.link}>{i18nT("Tải lại ưu đãi")}</Text>
                </Pressable>
              </View>
            ) : null}
            {!p.loading && !p.error && !p.campaignsLoading && !p.campaignsError && !p.vouchers.length && !claimable.length ? (
              <View style={s.empty}>
                <MaterialIcons
                  name="local-offer"
                  size={42}
                  color={colors.outline}
                />
                <Text style={s.section}>
                  {i18nT("Chưa có ưu đãi khả dụng")}
                </Text>
                <Text style={s.muted}>
                  {i18nT("Bạn vẫn có thể tiếp tục đặt chuyến.")}
                </Text>
              </View>
            ) : null}
            {p.vouchers.map((voucher) => {
              const reason = voucherUnavailable(voucher, p.subtotal);
              const selected = isVoucherSelected(voucher, p.selectedCode, p.selectedId);
              const applying = p.applyingKey === String(voucher.id);
              const info = getVoucherPresentation(voucher);
              return (
                <Pressable
                  key={voucher.id}
                  disabled={Boolean(reason) || p.applyingKey !== null}
                  onPress={() => p.onApply({ id: voucher.id, code: voucher.code ?? "" })}
                  accessibilityRole="radio"
                  accessibilityLabel={info.title}
                  accessibilityState={{
                    selected,
                    checked: selected,
                    disabled: Boolean(reason) || p.applyingKey !== null,
                  }}
                  style={[
                    s.card,
                    selected && s.selected,
                    reason ? extra.item5 : null,
                  ]}
                >
                  <View style={s.row}>
                    <View style={[s.icon, extra.item6]}>
                      <MaterialIcons
                        name="local-offer"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={s.flex}>
                      <Text style={s.section}>
                        {voucher.discountType === "PERCENT"
                          ? i18nT("Giảm {0}%", { "0": voucher.value })
                          : i18nT("Giảm {0}", { "0": money(voucher.value) })}
                      </Text>
                      <Text style={s.muted}>
                        {info.title} ({info.badge})
                        {voucher.maxDiscount !== null
                          ? i18nT(" · Tối đa {0}", {
                              "0": money(voucher.maxDiscount),
                            })
                          : ""}
                      </Text>
                      {info.description && info.description !== info.title ? (
                        <Text style={s.muted}>{info.description}</Text>
                      ) : null}
                    </View>
                    {applying ? (
                      <ActivityIndicator />
                    ) : (
                      <MaterialIcons
                        name={
                          selected
                            ? "radio-button-checked"
                            : "radio-button-unchecked"
                        }
                        size={23}
                        color={colors.primary}
                      />
                    )}
                  </View>
                  <Text style={s.muted}>
                    {i18nT("Chuyến từ")}{" "}
                    {money(voucher.minimumOrderAmount)}{" "}
                    {i18nT("· Hết hạn")}{" "}
                    {new Date(voucher.validTo).toLocaleDateString(getLocale())}
                  </Text>
                  {reason ? (
                    <Text style={s.error}>{i18nT(reason)}</Text>
                  ) : (
                    <Text style={s.link}>{i18nT("Chọn ưu đãi này")}</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item1: {
      flex: 1,
      backgroundColor: colors.scrim60,
      justifyContent: "flex-end",
    },
    item2: { flex: 1, minHeight: 48 },
    item3: { flex: 0, maxHeight: "85%" },
    item4: { gap: 12, paddingBottom: 12 },
    item5: { opacity: 0.5 },
    item6: { backgroundColor: colors.primarySoft },
    closeButton: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
    retryLink: { minHeight: 48, minWidth: 48, justifyContent: "center" },
    claimButton: {
      minHeight: 48,
      minWidth: 48,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.primarySoft,
    },
  });
