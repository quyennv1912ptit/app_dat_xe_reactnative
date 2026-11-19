import { ActivityIndicator } from "react-native-paper";
import { CustomerRideCancellationDialog } from "@/components/CustomerRideCancellationDialog";
import { CustomerNotice, customerType, RideEndpoints } from "@/components/CustomerRideUI";
import { BookingMap } from "@/components/map/BookingMap";
import { getCustomerRideStatusLabel } from "@/lib/customerRidePresentation";
import { navigateHomeClean } from "@/lib/rideNavigation";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { SearchRadar } from "../components/SearchRadar";
import { getLocale, translate as t } from "@datxe/shared";
import { Button, Card, Typography as Text, useLanguage, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useFindDriver } from "../hooks/useFindDriver";

export default function FindDriverScreen() {
  useLanguage();
  const c = useThemeColors();
  const { router, ride, error, cancellation, refresh, progress, retrying, retrySearch, editAndRetry } = useFindDriver();
  const goHome = () => navigateHomeClean(router);
  const scheduled = ride?.type === "SCHEDULED" && ride.status === "PENDING";
  const searching = ride?.status === "SEARCHING" || (ride?.status === "PENDING" && !scheduled);
  const failedRetryable = Boolean(ride && ["NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"].includes(ride.status));
  const cancelled = ride?.status === "CANCELLED";
  const ended = failedRetryable || cancelled;
  const pickup = ride?.pickup.lat != null && ride.pickup.lng != null
    ? { coordinate: { lat: ride.pickup.lat, lng: ride.pickup.lng } } : null;
  const dropoff = ride?.dropoff.lat != null && ride.dropoff.lng != null
    ? { coordinate: { lat: ride.dropoff.lat, lng: ride.dropoff.lng } } : null;
  const canCancel = ride && ["PENDING", "SEARCHING"].includes(ride.status);
  return (
    <>
      <MapSheetLayout title={t("Tìm tài xế")} onBack={goHome} backAccessibilityLabel={t("Về trang chủ")}
        initialSnap={0}
        renderMap={viewport => (
          <>
            <BookingMap center={pickup?.coordinate ?? dropoff?.coordinate ?? { lat: 21.0285, lng: 105.8542 }}
              pickup={pickup} viewport={viewport} interactive={!searching} />
            {searching && pickup ? <SearchRadar top={viewport.top} bottom={viewport.bottom}
              fraction={progress ? progress.radiusKm / progress.maxRadiusKm : 0.6} /> : null}
          </>
        )}
        footer={(
          <>
            <View style={styles.header}>
              {searching ? <ActivityIndicator color={c.primary} /> : <MaterialIcons name={ended ? "info-outline" : "schedule"} size={24}
                color={ended ? c.error : c.onSurfaceVariant} />}
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[customerType.heading, styles.title]}>
                {t(ride ? getCustomerRideStatusLabel(ride) : "Đang tải trạng thái chuyến")}
              </Text>
            </View>
            {searching ? (
              <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>
                {progress
                  ? t("Đang mở rộng tìm tài xế trong khu vực ({0} km)", { 0: progress.radiusKm.toLocaleString(getLocale()) })
                  : t("Hệ thống đang kết nối với tài xế gần điểm đón nhất…")}
              </Text>
            ) : null}
            {failedRetryable ? (
              <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>
                {t("Thông tin điểm đón, điểm trả và xe của bạn vẫn được giữ nguyên để thử tìm lại.")}
              </Text>
            ) : null}
            {error ? <CustomerNotice onRetry={() => void refresh()}>{t(error)}</CustomerNotice> : null}
            {canCancel ? <Button variant="ghost" contentColor={c.error} label="Hủy yêu cầu"
              onPress={cancellation.open} loading={cancellation.busy} /> : null}
            {failedRetryable ? (
              <View style={styles.endActions}>
                <Button label="Thử tìm lại" loading={retrying} disabled={retrying} onPress={() => void retrySearch()} />
                <View style={styles.endSecondaryRow}>
                  <Button variant="secondary" label="Chỉnh sửa chuyến" disabled={retrying} onPress={editAndRetry} style={styles.halfAction} />
                  <Button variant="ghost" label="Về trang chủ" disabled={retrying} onPress={goHome} style={styles.halfAction} />
                </View>
              </View>
            ) : cancelled ? (
              <View style={styles.endActions}>
                <Button label="Đặt lại chuyến này" disabled={retrying} onPress={editAndRetry} />
                <Button variant="ghost" label="Về trang chủ" disabled={retrying} onPress={goHome} />
              </View>
            ) : null}
          </>
        )}
      >
        {cancellation.error && !cancellation.visible ? <CustomerNotice>{t(cancellation.error)}</CustomerNotice> : null}
        {ride ? (
          <Card style={styles.card}>
            {ride.scheduledAt ? (
              <Text style={[customerType.meta, { color: c.onSurfaceVariant }]}>
                {t("Đón lúc {0}", { "0": new Date(ride.scheduledAt).toLocaleString(getLocale()) })}
              </Text>
            ) : null}
            <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
          </Card>
        ) : null}
      </MapSheetLayout>
      <CustomerRideCancellationDialog cancellation={cancellation} searching />
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1 },
  endActions: { gap: 8 },
  endSecondaryRow: { flexDirection: "row", gap: 8 },
  halfAction: { flex: 1 },
});
