import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  GroupedList,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
  localizedAlert,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getVoucherPresentation } from "@/lib/voucherPresentation";
import {
  styles as base_styles,
  date,
  money,
} from "../components/CustomerVouchersScreenParts";
import { useCustomerVouchers } from "../hooks/useCustomerVouchers";
import { claimVoucherCampaign, getVoucherCampaigns } from "../api";

export default function CustomerVouchersScreen() {
  useLanguage();
  const colors = useThemeColors();
  const styles = useThemedStyles(base_styles);
  const { router, vouchers, loading, error, refresh } = useCustomerVouchers();
  const client = useQueryClient();
  const campaigns = useQuery({ queryKey: ["customer", "voucherCampaigns"], queryFn: getVoucherCampaigns });

  const claim = useMutation({
    mutationFn: claimVoucherCampaign,
    onSuccess: async (claimed) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["customer", "getCustomerVouchers"] }),
        client.invalidateQueries({ queryKey: ["customer", "voucherCampaigns"] }),
      ]);
      const info = getVoucherPresentation(claimed);
      localizedAlert(
        i18nT("Đã nhận voucher {0}", { "0": info.title }),
        i18nT("{0} · Đã thêm vào danh sách ưu đãi của bạn.", { "0": info.badge }),
      );
    },
    onError: (err) =>
      localizedAlert(
        i18nT("Không nhận được voucher"),
        err instanceof Error ? err.message : i18nT("Ưu đãi có thể đã hết lượt hoặc ngân sách."),
      ),
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title={i18nT("Ưu đãi của tôi")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          {i18nT("Mã ưu đãi áp dụng được hiển thị khi hệ thống tính giá chuyến.")}
        </Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}

        {campaigns.data?.length ? (
          <View style={{ gap: 10 }}>
            <Text style={styles.heading}>{i18nT("Ưu đãi đang mở")}</Text>
            <Text style={styles.meta}>
              {i18nT("Mỗi tài khoản nhận tối đa một lượt. Ưu đãi có thể hết trước thời hạn.")}
            </Text>
            <GroupedList>
              {campaigns.data.map((campaign) => (
                <View key={campaign.id} style={styles.voucher}>
                  <View style={styles.voucherIcon}>
                    <MaterialIcons name="campaign" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.details}>
                    <View style={styles.titleRow}>
                      <Text style={styles.code}>{campaign.campaignTitle?.trim() || campaign.code}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {i18nT("{2} · Còn {0}/{1} suất", { "2": campaign.code,
                            "0": Math.max(0, campaign.claimLimit - campaign.claimedCount),
                            "1": campaign.claimLimit,
                          })}
                        </Text>
                      </View>
                    </View>
                    {campaign.description ? <Text style={styles.description}>{campaign.description}</Text> : null}
                    <Text style={styles.discount}>
                      {campaign.discountType === "PERCENT"
                        ? i18nT("Giảm {0}%{1}", {
                            "0": campaign.value,
                            "1": campaign.maxDiscount ? i18nT(" tối đa {0}", { "0": money(campaign.maxDiscount) }) : "",
                          })
                        : i18nT("Giảm {0}", { "0": money(campaign.value) })}
                    </Text>
                    <Text style={styles.meta}>
                      {i18nT("Đơn tối thiểu")} {money(campaign.minimumOrderAmount)}
                    </Text>
                    <Text style={styles.meta}>
                      {i18nT("Đã phát {0}/{1} suất", { "0": campaign.claimedCount, "1": campaign.claimLimit })}
                    </Text>
                    <Text style={styles.meta}>
                      {i18nT("Hiệu lực:")} {date(campaign.validFrom)} – {date(campaign.validTo)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={claim.isPending}
                      onPress={() => claim.mutate(campaign.id)}
                      style={styles.use}
                    >
                      {claim.isPending ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={styles.useText}>{i18nT("Nhận ưu đãi này")}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ))}
            </GroupedList>
          </View>
        ) : null}

        {campaigns.isError ? (
          <CustomerNotice onRetry={() => void campaigns.refetch()}>
            {i18nT("Không tải được ưu đãi đang mở.")}
          </CustomerNotice>
        ) : null}

        {!loading && !error && !campaigns.isLoading && vouchers.length === 0 && !campaigns.data?.length ? (
          <View style={styles.empty}>
            <MaterialIcons name="confirmation-number" size={38} color={colors.primary} />
            <Text style={styles.heading}>{i18nT("Chưa có ưu đãi")}</Text>
            <Text style={styles.meta}>{i18nT("Ưu đãi khả dụng sẽ xuất hiện tại đây.")}</Text>
          </View>
        ) : null}

        {vouchers.length ? (
          <View style={{ gap: 10 }}>
            <Text style={styles.heading}>{i18nT("Ưu đãi của bạn")}</Text>
            <GroupedList>
              {vouchers.map((voucher) => {
                const info = getVoucherPresentation(voucher);
                return (
                  <View key={voucher.id} style={styles.voucher}>
                    <View style={styles.voucherIcon}>
                      <MaterialIcons
                        name={info.isCampaign ? "confirmation-number" : "card-giftcard"}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.details}>
                      <View style={styles.titleRow}>
                        <Text style={styles.code}>{info.title}</Text>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{info.badge}</Text>
                        </View>
                      </View>
                      {info.description ? <Text style={styles.description}>{info.description}</Text> : null}
                      <Text style={styles.discount}>
                        {i18nT(
                          voucher.discountType === "PERCENT"
                            ? i18nT("Giảm {0}%{1}", {
                                "0": voucher.value,
                                "1": voucher.maxDiscount
                                  ? i18nT(" tối đa {0}", { "0": money(voucher.maxDiscount) })
                                  : "",
                              })
                            : i18nT("Giảm {0}", { "0": money(voucher.value) }),
                        )}
                      </Text>
                      <Text style={styles.meta}>
                        {i18nT("Đơn tối thiểu")} {i18nT(money(voucher.minimumOrderAmount))}
                      </Text>
                      <Text style={styles.meta}>
                        {i18nT("Hiệu lực:")} {i18nT(date(voucher.validFrom))} – {i18nT(date(voucher.validTo))}
                      </Text>
                      {voucher.usageLimit !== null ? (
                        <Text style={styles.meta}>
                          {i18nT("Đã dùng")} {i18nT(voucher.usageCount)}/{i18nT(voucher.usageLimit)}{" "}
                          {i18nT("lượt")}
                        </Text>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: "/ride/route-selection",
                            params: voucher.code ? { voucherCode: voucher.code } : { voucherId: String(voucher.id) },
                          })
                        }
                        style={styles.use}
                      >
                        <Text style={styles.useText}>{i18nT("Dùng ưu đãi này")}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </GroupedList>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}