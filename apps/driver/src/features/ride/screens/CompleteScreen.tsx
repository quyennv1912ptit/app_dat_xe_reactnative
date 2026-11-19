import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { statusLabel } from "@/lib/displayLabels";
import { formatDistance, formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  GroupedList,
  KeyValueRow,
  MoneyText,
  SectionHeading,
  SettingsListItem,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { Divider } from "react-native-paper";
import { StyleSheet, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { RideCustomerRating } from "../components/RideCustomerRating";
import { HandoverSummary } from "../components/HandoverSummary";
import { RideRouteCard } from "../components/RideRouteCard";
import { RideStatusBanner } from "../components/RideStatusBanner";
import { useComplete } from "../hooks/useComplete";
import { completePresentation, formatRideVehicleSummary } from "../ridePresentation";

function ReceiptRow({
  label,
  value,
  strong = false,
  valueColor,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueColor?: string;
}) {
  return <KeyValueRow label={label} value={value} strong={strong} valueColor={valueColor} />;
}

export default function CompleteRideScreen() {
  const [confirmation, setConfirmation] = useState<{ rideId: number; amount: number } | null>(null);
  const params = useLocalSearchParams<{ ratingStars?: string; ratingComment?: string; ratingTags?: string }>();
  const receivedStars = params.ratingStars ? Number(params.ratingStars) : null;
  const receivedComment = typeof params.ratingComment === "string" ? params.ratingComment.trim() : "";
  const receivedTags = typeof params.ratingTags === "string" && params.ratingTags.trim()
    ? params.ratingTags.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  const themed_s = useThemedStyles(s);
  const colors = useThemeColors();
  const { query: q, myRating, cash, confirmCash, router, valid } = useComplete();
  const ride = q.data;
  const model = completePresentation(ride);
  const payment = ride?.payment;
  const canConfirmCash = Boolean(model?.terminal && model.canConfirmCash);
  const cashToCollect = model?.terminal ? model.cashToCollect : undefined;
  const confirming = confirmation !== null && confirmation.rideId === ride?.id && confirmation.amount === cashToCollect;
  const currentEventId = ride?.statusHistory.findLast((entry) => entry.toStatus === ride.status)?.id;
  const earnings = ride?.driverEarnings;
  const vehicleSummary = formatRideVehicleSummary(ride);

  return (
    <DriverPage
      title={model?.title ?? "Chi tiết chuyến"}
      appearance="ride"
      footer={canConfirmCash && cashToCollect !== undefined ? (
        <>
          <View style={styles.collection}>
            <Text style={themed_s.label}>Tiền mặt cần thu · Chưa thu</Text>
            <MoneyText value={cashToCollect} variant="display" style={themed_s.amount} />
          </View>
          <Button
            label="Xác nhận đã nhận tiền mặt"
            icon="payments"
            iconPosition="leading"
            style={styles.primaryAction}
            loading={cash.isPending}
            loadingLabel="Đang ghi nhận…"
            onPress={() => { if (ride) setConfirmation({ rideId: ride.id, amount: cashToCollect }); }}
          />
        </>
      ) : model && !model.terminal ? (
        <Button
          label="Tiếp tục thực hiện chuyến"
          style={styles.primaryAction}
          onPress={() => router.replace("/ride/in-progress")}
        />
      ) : undefined}
      loading={q.isLoading}
      error={!valid ? "Thiếu mã chuyến đi." : q.error?.message || cash.error?.message}
      retry={valid ? q.refetch : undefined}
    >
      {ride && model ? (
        !model.terminal ? (
          <>
            <RideStatusBanner banner={model.notice} />
            <RideRouteCard ride={ride} />
          </>
        ) : (
          <>
            {receivedStars != null && Number.isFinite(receivedStars) && receivedStars > 0 ? (
              <Card style={themed_s.card}>
                <Text accessibilityRole="header" style={themed_s.title}>
                  Đánh giá ẩn danh từ khách hàng ({receivedStars}/5 sao)
                </Text>
                <Text style={[typography.sectionTitle, { color: colors.onWarningContainer }]}>
                  {"★".repeat(Math.min(5, Math.max(1, Math.round(receivedStars))))}
                  {"☆".repeat(Math.max(0, 5 - Math.min(5, Math.max(1, Math.round(receivedStars)))))}
                </Text>
                {receivedComment ? (
                  <Text style={themed_s.text}>Chú thích: “{receivedComment}”</Text>
                ) : (
                  <Text style={themed_s.label}>Khách hàng không để lại chú thích thêm.</Text>
                )}
                {receivedTags.length > 0 ? (
                  <Text style={themed_s.label}>Thẻ: {receivedTags.join(" · ")}</Text>
                ) : null}
              </Card>
            ) : null}
            <Card style={[styles.receiptCard, { backgroundColor: colors.rideSurface }]}>
              <View style={styles.summaryHeader}>
                <Text style={[typography.label, { color: colors.onSurfaceVariant }]}>Biên lai chuyến #{ride.id}</Text>
                <StatusBadge kind="ride" value={ride.status} contextLabel="Trạng thái chuyến" />
              </View>

              {ride.status === "COMPLETED" ? (
                <View style={styles.heroAmount}>
                  <Text style={[typography.label, { color: colors.onSurfaceVariant }]}>
                    {earnings ? "Thu nhập sau chiết khấu" : ride.finalFare === null ? "Cước dự kiến" : "Cước chuyến đi"}
                  </Text>
                  <MoneyText
                    value={earnings ? earnings.netAmount : (ride.finalFare ?? ride.payableFare ?? ride.estimatedFare)}
                    variant="display"
                    color={earnings ? colors.primary : colors.onSurface}
                    style={styles.price}
                  />
                  {payment ? (
                    <StatusBadge kind="payment" value={payment.status} contextLabel="Thanh toán" />
                  ) : null}
                </View>
              ) : (
                <Text style={[typography.bodySecondary, { color: colors.onSurfaceVariant }]}>
                  Chuyến đã hủy · Không phát sinh thu cước hay thanh toán.
                </Text>
              )}

              <Divider style={{ backgroundColor: colors.outlineVariant }} />

              <View style={styles.receiptRows}>
                {ride.status === "CANCELLED" ? (
                  <ReceiptRow
                    label="Giá dự kiến ban đầu (không thu)"
                    value={formatMoney(ride.estimatedFare, { nonBreaking: true })}
                    valueColor={colors.onSurfaceVariant}
                  />
                ) : (
                  <>
                    {(ride.discountAmount ?? 0) > 0 ? (
                      <>
                        <ReceiptRow
                          label="Giá cước gốc"
                          value={formatMoney(ride.estimatedFare, { nonBreaking: true })}
                        />
                        <ReceiptRow
                          label="Ưu đãi khách dùng"
                          value={`-${formatMoney(ride.discountAmount ?? 0, { nonBreaking: true })}`}
                        />
                      </>
                    ) : null}
                    <ReceiptRow
                      label={(ride.discountAmount ?? 0) > 0 ? "Khách thanh toán" : ride.finalFare === null ? "Cước khách trả dự kiến" : "Tổng cước chuyến"}
                      value={formatMoney(ride.finalFare ?? ride.payableFare ?? ride.estimatedFare, { nonBreaking: true })}
                      strong
                    />
                  </>
                )}
                {earnings && ride.status === "COMPLETED" ? (
                  <ReceiptRow label="Chiết khấu" value={`-${formatMoney(earnings.commissionAmount, { nonBreaking: true })}`} />
                ) : null}
                {ride.distanceKm !== null ? (
                  <ReceiptRow label="Quãng đường" value={formatDistance(ride.distanceKm)} />
                ) : null}
                {vehicleSummary ? (
                  <ReceiptRow label="Phương tiện" value={vehicleSummary} />
                ) : null}
                {payment ? (
                  <ReceiptRow
                    label="Phương thức"
                    value={payment.method === "WALLET" ? "Ví ứng dụng" : "Tiền mặt"}
                  />
                ) : null}
                {payment?.paidAt ? (
                  <ReceiptRow label="Thời gian thanh toán" value={new Date(payment.paidAt).toLocaleString("vi-VN")} />
                ) : null}
              </View>

              {ride.status === "COMPLETED" ? (
                <>
                  {model.paymentBanner ? <RideStatusBanner banner={model.paymentBanner} /> : null}
                  {earnings ? (
                    <Text style={[typography.label, { color: colors.onSurfaceVariant }]}>
                      {earnings.creditedToCash
                        ? payment?.method === "CASH" && !earnings.paid
                          ? "Khoản bù voucher đã cộng vào ví; vui lòng thu phần tiền mặt còn lại từ khách."
                          : payment?.method === "CASH"
                            ? "Tiền chuyến và khoản bù voucher đã được quyết toán."
                            : "Đã cộng vào ví ứng dụng."
                        : earnings.paid
                          ? "Tiền khách đã trả trực tiếp; chiết khấu đã trừ từ ví tín dụng."
                          : "Chờ thu tiền khách. Chiết khấu đã trừ từ ví tín dụng."}
                    </Text>
                  ) : (
                    <Text style={themed_s.text}>Chưa có dữ liệu quyết toán cho chuyến này.</Text>
                  )}
                </>
              ) : null}

              {ride.status === "CANCELLED" ? (
                <>
                  <Divider style={{ backgroundColor: colors.outlineVariant }} />
                  <Text style={themed_s.label}>
                    {ride.cancelledByRole === "CUSTOMER"
                      ? "Khách hủy"
                      : ride.cancelledByRole === "DRIVER"
                        ? "Tài xế hủy"
                        : ride.cancelledByRole === "SYSTEM"
                          ? "Hệ thống hủy"
                          : "Chuyến đã hủy"}
                  </Text>
                  {ride.cancelReason ? <Text>{ride.cancelReason}</Text> : null}
                </>
              ) : null}
            </Card>

            {ride.status === "COMPLETED" && (typeof ride.driverHasRatedCustomer === "boolean" || typeof ride.hasRated === "boolean" || myRating) ? (
              <RideCustomerRating
                key={ride.id}
                rideId={ride.id}
                rated={Boolean(ride.driverHasRatedCustomer || ride.hasRated || myRating)}
                existingRating={myRating}
              />
            ) : null}
            <RideRouteCard ride={ride} />
            {ride.handoverReports.map((report) => (
              <HandoverSummary key={report.id} report={report} collapsiblePhotos />
            ))}
            {ride.statusHistory.length ? (
              <View>
                <SectionHeading title="Mốc chuyến đi" />
                <Card>
                  {ride.statusHistory.map((entry, index) => {
                    const current = entry.id === currentEventId;
                    const label = statusLabel("ride", entry.toStatus).label;
                    return (
                      <View key={entry.id} style={styles.historyItem}>
                        {index < ride.statusHistory.length - 1 ? (
                          <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                        ) : null}
                        <View style={[styles.timelineDot, { backgroundColor: current ? colors.primary : colors.outline }]} />
                        <View style={styles.historyText}>
                          <Text
                            style={[themed_s.text, current && styles.currentStatus]}
                            accessibilityLabel={current ? `Trạng thái hiện tại: ${label}` : label}
                          >
                            {label}
                          </Text>
                          <Text style={themed_s.label}>{new Date(entry.createdAt).toLocaleString("vi-VN")}</Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </View>
            ) : null}
            <GroupedList title="Tra cứu và hỗ trợ">
              <SettingsListItem
                title="Trợ giúp về chuyến này"
                icon="help-outline"
                onPress={() => router.push({ pathname: "/support", params: { rideId: String(ride.id) } })}
              />
            </GroupedList>
            <DriverConfirmationDialog
              visible={confirming || (cash.isPending && confirmation?.rideId === ride.id)}
              busy={cash.isPending}
              destructive={false}
              disabled={!canConfirmCash}
              title="Xác nhận đã nhận tiền mặt?"
              description={cashToCollect === undefined
                ? "Chuyến không còn chờ thu tiền mặt."
                : `Xác nhận bạn đã nhận ${formatMoney(cashToCollect)} tiền mặt từ khách.`}
              confirmLabel="Đã nhận tiền"
              dismissLabel="Quay lại"
              error={cash.error?.message}
              onDismiss={() => setConfirmation(null)}
              onConfirm={() => { if (confirming) confirmCash(() => setConfirmation(null)); }}
            />
          </>
        )
      ) : null}
      {!ride && !q.isLoading ? (
        <Button variant="ghost" label="Về trang chủ" onPress={() => router.replace("/(tabs)/home")} />
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  receiptCard: { padding: spacing.spaceMd, gap: spacing.px3 },
  heroAmount: { gap: spacing.spaceXs },
  receiptRows: { gap: spacing.spaceSm },
  collection: { alignItems: "center", gap: spacing.xxs },
  summaryHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  price: { ...typography.moneyDisplay },
  primaryAction: { minHeight: 52, justifyContent: "center" },
  historyItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.px3 },
  historyText: { flex: 1, paddingBottom: spacing.px3 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  timelineLine: { position: "absolute", left: 3, top: 12, bottom: -12, width: 2 },
  currentStatus: { ...typography.label },
});
