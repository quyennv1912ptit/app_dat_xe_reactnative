import { CustomerNotice, customerType } from "@/components/CustomerRideUI";
import { formatMoney, getLocale, translate as t, type RideEstimate } from "@datxe/shared";
import { Card, KeyValueRow, Typography as Text, useLanguage, useThemeColors, useThemedStyles } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, List } from "react-native-paper";
import { minimumFareAdjustment } from "../bookingUtils";
import { bookingStyles } from "./bookingStyles";

export function FareDetails({ estimate, loading, error, retry }: {
  estimate?: RideEstimate;
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  useLanguage();
  const c = useThemeColors();
  const s = useThemedStyles(bookingStyles);
  if (error) return <CustomerNotice onRetry={retry}>{t(error)}</CustomerNotice>;
  if (loading || !estimate) return (
    <Card style={s.card}>
      {loading ? <View style={s.row}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.muted}>{t("Đang cập nhật giá chuyến…")}</Text>
      </View> : <Text style={s.muted}>{t("Chưa có giá")}</Text>}
    </Card>
  );

  const subtotalAfterDiscount = Math.max(0, estimate.estimatedFare - estimate.discountAmount);
  const roundingAdjustment = estimate.payableFare - subtotalAfterDiscount;
  const fees = [
    { label: "Giá mở đầu", value: estimate.baseFare },
    { label: "Cước quãng đường", value: estimate.distanceFare },
    ...[
      { label: "Phí chờ", value: estimate.waitingFare },
      { label: "Phụ phí ban đêm", value: estimate.nightSurcharge },
      { label: "Phí tài xế quay về", value: estimate.returnFee },
      { label: "Điều chỉnh cước tối thiểu", value: minimumFareAdjustment(estimate) },
    ].filter(({ value }) => value > 0),
    ...(estimate.discountAmount > 0 ? [{ label: "Ưu đãi", value: -estimate.discountAmount }] : []),
    ...(roundingAdjustment !== 0 ? [{ label: "Làm tròn bội 1.000 đ", value: roundingAdjustment }] : []),
    { label: "Tổng thanh toán", value: estimate.payableFare },
  ];
  return (
    <Card style={s.card}>
      <Text style={s.label}>{t("Quãng đường và thời gian dự kiến")}</Text>
      <Text style={customerType.metric}>
        {estimate.distanceKm.toLocaleString(getLocale(), { maximumFractionDigits: 1 })} km · {estimate.estimatedDurationMinutes} {t("phút")}
      </Text>
      {estimate.route?.limitation ? <Text style={s.muted}>{t(estimate.route.limitation)}</Text> : null}
      <List.Accordion title={t("Chi tiết giá")} style={styles.accordion} theme={{ colors: { background: c.transparent } }}>
        <View style={styles.breakdown}>
          {fees.map(({ label, value }) => (
            <KeyValueRow
              key={label}
              label={t(label)}
              value={formatMoney(value, { locale: getLocale(), signed: value < 0, nonBreaking: true })}
              tabular
            />
          ))}
          <Text style={s.muted}>{t("Giá được tính theo lộ trình và bảng giá đang áp dụng.")}</Text>
        </View>
      </List.Accordion>
    </Card>
  );
}

const styles = StyleSheet.create({
  accordion: { minHeight: 48 },
  breakdown: { gap: 8 },
  label: { flexShrink: 1 },
});
