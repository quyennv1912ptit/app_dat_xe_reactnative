import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getVoucherPresentation } from "@/lib/voucherPresentation";
import { translate as i18nT } from "@datxe/shared";
import {
  Button,
  GroupedList,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, View } from "react-native";

import {
  styles as base_styles,
  date,
  money,
} from "../components/CustomerVouchersScreenParts";
import { useCustomerVouchers } from "../hooks/useCustomerVouchers";

export default function CustomerVouchersScreen() {
  useLanguage();
  const colors = useThemeColors();
  const styles = useThemedStyles(base_styles);

  const {
    router,
    vouchers,
    campaigns,
    loading,
    error,
    claimError,
    claimingId,
    claimCampaign,
    refresh,
  } = useCustomerVouchers();
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title={i18nT("Ưu đãi của tôi")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          {i18nT("Mã ưu đãi áp dụng được hiển thị khi hệ thống tính giá chuyến.")}
        </Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
        {claimError ? <CustomerNotice>{i18nT(claimError)}</CustomerNotice> : null}
        {!loading && !error && vouchers.length === 0 && campaigns.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons
              name="confirmation-number"
              size={38}
              color={colors.primary}
            />
            <Text style={styles.heading}>{i18nT("Chưa có ưu đãi")}</Text>
            <Text style={styles.meta}>
              {i18nT("Mỗi tài khoản nhận tối đa một lượt. Ưu đãi có thể hết trước thời hạn.")}
            </Text>
            <Button
              label={i18nT("Đặt chuyến ngay")}
              onPress={() => router.replace("/(tabs)/home")}
            />
          </View>
        ) : null}
        {campaigns.length ? (
          <>
            <Text style={styles.sectionHeading}>{i18nT("Ưu đãi có thể nhận")}</Text>
            <GroupedList>
              {campaigns.map((campaign) => {
                const claiming = claimingId === campaign.id;
                const remaining = Math.max(0, campaign.claimLimit - campaign.claimedCount);
                const exhausted = campaign.claimedCount >= campaign.claimLimit || campaign.budgetRemaining <= 0;
                return (
                  <View key={`campaign-${campaign.id}`} style={styles.voucher}>
                    <View style={styles.voucherIcon}>
                      <MaterialIcons
                        name="card-giftcard"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.details}>
                      <View style={styles.titleRow}>
                        <Text style={styles.code}>
                          {campaign.campaignTitle?.trim() || campaign.code}
                        </Text>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {i18nT("{2} · Còn {0}/{1} suất", {
                              0: remaining,
                              1: campaign.claimLimit,
                              2: campaign.code,
                            })}
                          </Text>
                        </View>
                      </View>
                      {campaign.description ? (
                        <Text style={styles.description}>{campaign.description}</Text>
                      ) : null}
                      <Text style={styles.discount}>
                        {campaign.discountType === "PERCENT"
                          ? i18nT("Giảm {0}%{1}", {
                              "0": campaign.value,
                              "1": campaign.maxDiscount
                                ? i18nT(" tối đa {0}", {
                                    "0": money(campaign.maxDiscount),
                                  })
                                : "",
                            })
                          : i18nT("Giảm {0}", { "0": money(campaign.value) })}
                      </Text>
                      <Text style={styles.meta}>
                        {i18nT("Đơn tối thiểu")} {money(campaign.minimumOrderAmount)}
                      </Text>
                      <Text style={styles.meta}>
                        {i18nT("Hiệu lực:")} {date(campaign.validFrom)} – {date(campaign.validTo)}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={i18nT("Nhận ưu đãi {0}", {
                          0: campaign.campaignTitle?.trim() || campaign.code,
                        })}
                        disabled={claiming || claimingId !== null || exhausted}
                        onPress={() => claimCampaign(campaign.id)}
                        style={styles.use}
                      >
                        <Text style={styles.useText}>
                          {claiming
                            ? i18nT("Đang nhận…")
                            : exhausted
                              ? i18nT("Đã hết suất nhận")
                              : i18nT("Nhận ưu đãi")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </GroupedList>
          </>
        ) : null}
        {vouchers.length ? (
          <>
            {campaigns.length ? (
              <Text style={styles.sectionHeading}>{i18nT("Ưu đãi của bạn")}</Text>
            ) : null}
            <GroupedList>
              {vouchers.map((voucher) => {
                const info = getVoucherPresentation(voucher);
                return (
                  <View key={voucher.id} style={styles.voucher}>
                    <View style={styles.voucherIcon}>
                      <MaterialIcons
                        name={info.isCampaign ? "confirmation-number" : "local-offer"}
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
                      {info.description && info.description.trim() !== info.title ? (
                        <Text style={styles.description}>{info.description.trim()}</Text>
                      ) : null}
                      <Text style={styles.discount}>
                        {voucher.discountType === "PERCENT"
                          ? i18nT("Giảm {0}%{1}", {
                              "0": voucher.value,
                              "1": voucher.maxDiscount
                                ? i18nT(" tối đa {0}", {
                                    "0": money(voucher.maxDiscount),
                                  })
                                : "",
                            })
                          : i18nT("Giảm {0}", { "0": money(voucher.value) })}
                      </Text>
                      <Text style={styles.meta}>
                        {i18nT("Đơn tối thiểu")} {money(voucher.minimumOrderAmount)}
                      </Text>
                      <Text style={styles.meta}>
                        {i18nT("Hiệu lực:")} {date(voucher.validFrom)} – {date(voucher.validTo)}
                      </Text>
                      {voucher.usageLimit !== null ? (
                        <Text style={styles.meta}>
                          {i18nT("Đã dùng")} {voucher.usageCount}/{voucher.usageLimit} {i18nT("lượt")}
                        </Text>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={i18nT("Dùng ưu đãi {0}", { 0: info.title })}
                        onPress={() =>
                          router.push({
                            pathname: "/ride/route-selection",
                            params: {
                              voucherId: String(voucher.id),
                              ...(voucher.code ? { voucherCode: voucher.code } : {}),
                            },
                          })
                        }
                        style={styles.use}
                      >
                        <Text style={styles.useText}>
                          {i18nT("Dùng ưu đãi này")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </GroupedList>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}