import { PendingPaymentMethod } from "./PendingPaymentMethod";
import { formatMoney, getLocale, translate as t, type CustomerRideDetail } from "@datxe/shared";
import { Card, KeyValueRow, SharedStatusBadge, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { customerType, MoneyText } from "./CustomerRideUI";

const paymentLabels = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán chưa thành công",
  REFUNDED: "Đã hoàn tiền",
} as const;

export function CustomerPaymentSummary({ ride }: { ride: CustomerRideDetail }) {
  useLanguage();
  const c = useThemeColors();
  const payment = ride.payment;
  const method = payment?.method ?? ride.paymentMethod;
  const discount = ride.discountAmount ?? 0;
  const isUnbilledTerminal = ["CANCELLED", "NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"].includes(ride.status);
  const cash = payment?.method === "CASH";
  const pendingCash = cash && payment.status === "PENDING" && ride.status === "COMPLETED";
  const paidCash = cash && payment.status === "PAID";
  const amount = payment?.amount ?? ride.finalFare ?? ride.payableFare ?? ride.estimatedFare;
  const label = isUnbilledTerminal && !payment
    ? "Trạng thái thanh toán"
    : pendingCash
      ? "Tiền mặt cần trả"
      : paidCash
        ? "Tiền mặt đã thanh toán"
        : payment
          ? "Khoản thanh toán"
          : ride.finalFare != null
            ? "Cước chuyến đi"
            : "Giá dự kiến";
  const badgeTone = payment?.status === "PAID"
    ? "success"
    : payment?.status === "FAILED"
      ? "danger"
      : payment?.status === "PENDING"
        ? "pending"
        : "neutral";

  if (isUnbilledTerminal && (!payment || payment.status !== "PAID")) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[customerType.meta, { color: c.onSurfaceVariant }]}>
            {t(label)}
          </Text>
          <SharedStatusBadge
            label={payment ? t(paymentLabels[payment.status] ?? "Không thu cước") : t("Không thu cước")}
            tone={payment?.status === "REFUNDED" ? "neutral" : "danger"}
          />
        </View>
        <Text style={[customerType.meta, { color: c.onSurface }]}>
          {t(
            ride.status === "CANCELLED"
              ? "Chuyến đã hủy · Không phát sinh thu cước hay thanh toán."
              : "Chuyến chưa thực hiện · Không phát sinh thu cước hay thanh toán.",
          )}
        </Text>
        {ride.estimatedFare > 0 ? (
          <KeyValueRow
            label={t("Giá dự kiến ban đầu (không thu)")}
            value={formatMoney(ride.estimatedFare, { locale: getLocale(), nonBreaking: true })}
            valueColor={c.onSurfaceVariant}
          />
        ) : null}
      </Card>
    );
  }
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[customerType.meta, { color: c.onSurfaceVariant }]}>{t(label)}</Text>
        {payment ? (
          <SharedStatusBadge
            label={t(paymentLabels[payment.status] ?? "Đang cập nhật trạng thái")}
            tone={badgeTone}
          />
        ) : null}
      </View>
      <MoneyText value={amount} />
      {method ? <Text style={customerType.meta}>{t(method === "WALLET" ? "Ví ứng dụng" : method === "CASH" ? "Tiền mặt" : "Phương thức thanh toán khác")}</Text> : null}
      {pendingCash ? <Text style={customerType.address}>{t("Thanh toán cho tài xế khi kết thúc chuyến")}</Text> : null}
      {payment?.paidAt ? (
        <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>{new Date(payment.paidAt).toLocaleString(getLocale())}</Text>
      ) : null}
      <PendingPaymentMethod ride={ride} />
      {discount > 0 ? (
        <KeyValueRow
          label={t("Giảm giá")}
          value={formatMoney(-discount, { locale: getLocale(), signed: true, nonBreaking: true })}
          valueColor={c.onSurfaceVariant}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
});
