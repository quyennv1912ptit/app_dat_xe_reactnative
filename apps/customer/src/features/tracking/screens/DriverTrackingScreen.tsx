import { CustomerRideCancellationDialog } from "@/components/CustomerRideCancellationDialog";
import { CustomerNotice, customerType, MoneyText, RideEndpoints } from "@/components/CustomerRideUI";
import { HeaderIconButton } from "@/components/ScreenHeader";
import { BookingMap } from "@/components/map/BookingMap";
import { MapSheetLayout } from "@datxe/ui/goong-map";
import { navigateHomeClean } from "@/lib/rideNavigation";
import { formatRemainingMeters, getLocale, translate as t } from "@datxe/shared";
import { Button, Card, Typography as Text, typography, useLanguage, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Share, StyleSheet, View } from "react-native";
import { useState } from "react";
import { ActivityIndicator } from "react-native-paper";
import { DriverProfileCard } from "../components/DriverProfileCard";
import { RideDriverReviews } from "../components/RideDriverReviews";
import { assignedDriver } from "../driverProfile";
import { useApproachRoute } from "../hooks/useApproachRoute";
import { useDriverTracking } from "../hooks/useDriverTracking";

const fallbackCenter = { lat: 21.0285, lng: 105.8542 };

export default function DriverTrackingScreen() {
  useLanguage();
  const colors = useThemeColors();
  const { router, ride, vehicle, error, presentation, cancellation, refresh, live } = useDriverTracking();
  const [shareError, setShareError] = useState(false);
  const driver = ride ? assignedDriver(ride) : null;
  const ended = Boolean(presentation?.ended);
  const pickup = ride?.pickup.lat != null && ride.pickup.lng != null
    ? { coordinate: { lat: ride.pickup.lat, lng: ride.pickup.lng } } : null;
  const dropoff = ride?.dropoff.lat != null && ride.dropoff.lng != null
    ? { coordinate: { lat: ride.dropoff.lat, lng: ride.dropoff.lng } } : null;
  const approaching = Boolean(presentation?.approaching);
  const driverLocation = !ended && !live.signalLost ? live.sample?.location : undefined;
  const approach = useApproachRoute(ride, driverLocation, live.now);
  const goHome = () => navigateHomeClean(router);
  const message = () => { if (ride) router.push({ pathname: "/chat", params: { rideId: String(ride.id) } }); };
  const canChat = Boolean(presentation?.canChat);
  const banner = presentation?.statusBanner;
  const bannerStyle =
    banner?.tone === "error"
      ? { bg: colors.errorContainer, fg: colors.onErrorContainer, icon: "error-outline" as const }
      : banner?.tone === "warning"
        ? { bg: colors.warningContainer, fg: colors.onWarningContainer, icon: "warning-amber" as const }
        : banner?.tone === "success"
          ? { bg: colors.successContainer, fg: colors.onSuccessContainer, icon: "verified" as const }
          : { bg: colors.surfaceContainerHigh, fg: colors.onSurface, icon: "info-outline" as const };
  const primaryAction = presentation?.primaryAction;
  const secondaryHandover = presentation?.secondaryHandoverView;

  return (
    <>
      <MapSheetLayout
        title={t("Theo dõi chuyến")}
        backAccessibilityLabel={t("Về trang chủ")}
        onBack={goHome}
        topActions={<HeaderIconButton icon="shield" accessibilityLabel="An toàn chuyến đi"
          onPress={() => router.push({ pathname: "/support", params: { topic: "safety", rideId: ride ? String(ride.id) : undefined } })} />}
        renderMap={viewport => (
          <BookingMap center={pickup?.coordinate ?? dropoff?.coordinate ?? fallbackCenter}
            pickup={pickup} dropoff={approaching ? null : dropoff}
            route={approach.route?.coordinates ?? (approaching ? undefined : ride?.route?.coordinates)}
            driver={approaching ? approach.location : driverLocation}
            vehicleType={ride?.vehicleType ?? (vehicle?.vehicle_type === "MOTORCYCLE" ? "MOTORCYCLE" : vehicle?.vehicle_type === "CAR" ? "CAR" : null)}
            viewport={viewport} />
        )}
        footer={(
          <>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite"
              style={customerType.heading}
            >{t(presentation?.headline ?? "Theo dõi chuyến")}</Text>
            {approach.route ? (
              <Text style={customerType.address}>{t(
                approach.phase === "dropoff"
                  ? "Còn {0} · Dự kiến {1} phút đến điểm trả"
                  : "Còn {0} · Dự kiến {1} phút đến điểm đón",
                {
                  0: formatRemainingMeters(approach.route.distance, getLocale()),
                  1: Math.max(1, Math.ceil(approach.route.duration / 60)),
                },
              )}</Text>
            ) : approach.phase && approach.location ? (
              <Text style={customerType.meta}>{t(
                approach.unavailable
                  ? (approach.phase === "dropoff" ? "Chưa tải được tuyến đến điểm trả" : "Chưa tải được tuyến đến điểm đón")
                  : (approach.phase === "dropoff" ? "Đang tính tuyến đến điểm trả…" : "Đang tính tuyến đến điểm đón…"),
              )}</Text>
            ) : null}
            {ride?.driverId && !ended && !approach.location ? (
              <Text style={[customerType.meta, { color: live.signalLost ? colors.error : colors.onSurfaceVariant }]}>
                {t(live.signalLost ? "Mất tín hiệu vị trí tài xế"
                  : live.sample ? "Vị trí tài xế đã cập nhật" : "Đang chờ vị trí tài xế…")}
              </Text>
            ) : null}
            {ride && primaryAction?.kind === "review_handover" ? (
              <Button label={primaryAction.label}
                onPress={() => router.push({ pathname: "/vehicle-inspection", params: { rideId: String(ride.id), phase: primaryAction.phase } })} />
            ) : primaryAction?.kind === "view_completed" && ride ? (
              <Button label={primaryAction.label} onPress={() => router.replace({
                pathname: "/ride/completed", params: { rideId: String(ride.id) },
              })} />
            ) : primaryAction?.kind === "go_home" ? (
              <Button label={primaryAction.label} onPress={goHome} />
            ) : null}
          </>
        )}
      >
        {!ride && !error ? <ActivityIndicator color={colors.primary} accessibilityLabel={t("Đang tải chuyến…")} /> : null}
        {error ? <CustomerNotice onRetry={() => void refresh()}>{t(error)}</CustomerNotice> : null}
        {ride ? (
          <>
            {banner ? (
              <Card style={[styles.card, { backgroundColor: bannerStyle.bg }]}>
                <View style={styles.bannerHeader}>
                  <MaterialIcons name={bannerStyle.icon} size={20} color={bannerStyle.fg} />
                  <Text style={[customerType.address, styles.bannerTitle, { color: bannerStyle.fg }]}>
                    {t(banner.title)}
                  </Text>
                </View>
                <Text style={[customerType.meta, { color: bannerStyle.fg }]}>{t(banner.message)}</Text>
                {secondaryHandover ? (
                  <Button
                    variant="secondary"
                    label={secondaryHandover.label}
                    onPress={() => router.push({
                      pathname: "/vehicle-inspection",
                      params: { rideId: String(ride.id), phase: secondaryHandover.phase },
                    })}
                  />
                ) : null}
              </Card>
            ) : null}
            {ride.scheduledAt ? (
              <Text style={[customerType.meta, { color: colors.onSurfaceVariant }]}>
                {t("Đón lúc {0}", { 0: new Date(ride.scheduledAt).toLocaleString(getLocale()) })}
              </Text>
            ) : null}
            {driver ? (
              <DriverProfileCard key={`${ride.id}:${driver.id}`} driver={driver} contactEnabled={canChat}
                unreadCount={ride.unreadChatCount} onMessage={message}
                reviews={<RideDriverReviews rideId={ride.id} driverId={driver.id} />} />
            ) : (
              <Card style={styles.card}>
                <Text style={customerType.address}>{t(ride.driverId ? "Chưa tải được hồ sơ tài xế." : "Chuyến này đang chờ tài xế nhận.")}</Text>
                {ride.driverId ? <Button variant="secondary" label="Tải lại hồ sơ tài xế" onPress={() => void refresh()} /> : null}
              </Card>
            )}
            {ride.driverId && !driver && canChat ? <Button variant="secondary" icon="chat"
              label="Nhắn tin với tài xế" onPress={message} /> : null}
            <View style={styles.actions}>
              <Button style={styles.action} variant="secondary" icon="receipt-long" label="Chi tiết chuyến"
                onPress={() => router.push({ pathname: "/ride/[id]", params: { id: String(ride.id) } })} />
              {!ended ? <Button style={styles.action} variant="secondary" icon="share" label="Chia sẻ chuyến"
                onPress={() => {
                  setShareError(false);
                  void Share.share({ message: [t("PtitGo"), t(presentation?.headline ?? "Đang cập nhật trạng thái")].join("\n") })
                    .catch(() => setShareError(true));
                }} /> : null}
            </View>
            {shareError ? <Text accessibilityRole="alert">{t("Chưa mở được bảng chia sẻ.")}</Text> : null}
            <Card style={styles.card}>
              <Text accessibilityRole="header" style={customerType.heading}>{t("Lộ trình")}</Text>
              <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
              <Text style={[customerType.meta, { color: colors.onSurfaceVariant }]}>
                {[vehicle?.brand, vehicle?.model, ride.licensePlate || vehicle?.plate_number].filter(Boolean).join(" · ")
                  || t("Phương tiện của bạn")}
              </Text>
              {!ended ? (
                <View style={styles.price}>
                  <Text style={[customerType.meta, { color: colors.onSurfaceVariant }]}>
                    {t(ride.finalFare != null
                      ? "Cước chuyến đi"
                      : ride.payableFare != null && ride.payableFare !== ride.estimatedFare
                        ? "Cần thanh toán"
                        : "Giá dự kiến")}
                  </Text>
                  <MoneyText value={ride.finalFare ?? ride.payableFare ?? ride.estimatedFare} style={styles.compactAmount} />
                </View>
              ) : null}
            </Card>
            {!error ? <Button variant="secondary" label="Làm mới trạng thái" onPress={() => void refresh()} /> : null}
            {presentation?.canCancel ? <Button variant="ghost" contentColor={colors.error} label="Hủy chuyến"
              onPress={cancellation.open} loading={cancellation.busy} /> : null}
          </>
        ) : null}
      </MapSheetLayout>
      <CustomerRideCancellationDialog cancellation={cancellation} />
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { flexGrow: 1, flexBasis: 136, width: "auto" },
  bannerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  bannerTitle: { ...typography.cardTitle, flex: 1 },
  card: { padding: 16, gap: 12 },
  price: { gap: 2 },
  compactAmount: { ...typography.moneyDisplay },
});
