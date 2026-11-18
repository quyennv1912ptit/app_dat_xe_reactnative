import { env } from "@/config/env";
import { GoongMap, mapBounds, type GoongMapMarker } from "@datxe/ui/goong-map";
import { Appbar, Divider, ProgressBar } from "react-native-paper";
import { DriverPage } from "@/components/DriverPage";
import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { useSessionStore } from "@/lib/store";
import { formatScheduledPickup } from "@/lib/scheduledPickup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { CustomerRideDetail } from "@datxe/shared";
import { cancelDriverRide } from "../api";
import { rideStyles as s } from "@/components/rideStyles";
import { RideCustomerCard } from "../components/RideCustomerCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RideRouteCard } from "../components/RideRouteCard";
import { RideStatusBanner } from "../components/RideStatusBanner";
import { StyleSheet, View } from "react-native";
import { formatDistance, formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  GroupedList,
  MoneyText,
  PaperTextInput as TextInput,
  SettingsListItem,
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";

import { useInProgress } from "../hooks/useInProgress";
import { ridePresentation, type RideStop } from "../ridePresentation";

export default function InProgressRideScreen() {
  useLanguage();
  const themed_s = useThemedStyles(s);
  const colors = useThemeColors();

  const {
    router,
    query,
    ride,
    model,
    endedRide,
    progress,
    advance,
  } = useInProgress();
  const pickupTime = formatScheduledPickup(ride?.scheduledAt);
  const client = useQueryClient();
  const [confirmation, setConfirmation] = useState<{ rideId: number; userId: number } | null>(null);
  const [reason, setReason] = useState("");
  const canCancel = model?.canCancel === true;

  const cancel = useMutation({
    mutationFn: async ({ rideId, userId, reason }: { rideId: number; userId: number; reason: string }) => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error("Phiên đăng nhập đã thay đổi.");
      const latest = client.getQueryState<CustomerRideDetail | null>(["driver", "activeRide"]);
      if (
        latest?.data?.id !== rideId ||
        !ridePresentation(latest.data, latest.status === "success" && latest.fetchStatus !== "paused")?.canCancel
      ) {
        throw new Error("Chuyến đã đổi trạng thái và không thể hủy.");
      }
      return cancelDriverRide(rideId, reason);
    },
    onSuccess: (_, { rideId, userId }) => {
      const store = useSessionStore.getState();
      if (store.user?.id !== userId) return;
      client.setQueryData<CustomerRideDetail | null>(["driver", "activeRide"], (previous) =>
        previous?.id === rideId ? null : previous,
      );
      if (store.activeRide?.id === rideId) store.setActiveRide(null);
      void client.invalidateQueries({ queryKey: ["driver"] });
      setConfirmation(null);
      router.replace("/(tabs)/home");
    },
    onError: () => { void query.refetch(); },
  });

  const markers: GoongMapMarker[] = [];
  if (ride) {
    for (const stop of ["pickup", "dropoff"] as const) {
      const { lat, lng } = ride[stop];
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        markers.push({ id: stop, coordinate: { lat, lng }, kind: stop });
      }
    }
  }

  const action = model?.action;
  const driverNetEarning = ride?.driverEarnings?.netAmount ?? ride?.driverExpectedEarning;
  const customerFare = ride ? (ride.finalFare ?? ride.payableFare ?? ride.estimatedFare) : 0;
  const inspection = (stop: RideStop) => {
    if (ride) router.push({ pathname: "/ride/vehicle-inspection", params: { rideId: String(ride.id), stop } });
  };
  const viewableHandovers = model?.handovers.filter((item) => item.canView) ?? [];

  const footerContent = action ? (
    <Button
      label={action.label}
      style={styles.primaryAction}
      loading={progress.isPending}
      loadingLabel="Đang cập nhật…"
      disabled={cancel.isPending || progress.isPending}
      onPress={() => (action.kind === "inspection" ? inspection(action.stop) : advance())}
    />
  ) : model?.disabledPrimaryReason ? (
    <View style={styles.waitingFooter}>
      <Text style={themed_s.label} accessibilityLiveRegion="polite">
        {model.disabledPrimaryReason}
      </Text>
      <Button
        variant="secondary"
        label={model.waitingForCustomer ? "Kiểm tra xác nhận của khách" : "Làm mới trạng thái chuyến"}
        loading={query.isFetching}
        onPress={() => void query.refetch()}
      />
    </View>
  ) : undefined;

  return (
    <DriverPage
      title={model?.title ?? (endedRide ? "Chuyến đã kết thúc" : "Chuyến hiện tại")}
      appearance="ride"
      loading={query.isLoading}
      headerAction={ride ? (
        <Appbar.Action
          icon="shield-outline"
          style={styles.headerAction}
          accessibilityLabel="An toàn chuyến đi"
          onPress={() => router.push("/safety")}
        />
      ) : undefined}
      headerContent={model ? (
        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <Text style={[themed_s.label, styles.step]}>Bước {model.step}/4</Text>
          </View>
          <ProgressBar
            progress={model.step / 4}
            color={colors.primary}
            style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHigh }]}
            accessibilityLabel={`Bước ${model.step} trên 4`}
          />
        </View>
      ) : undefined}
      error={query.error?.message || progress.error?.message}
      retry={query.error ? query.refetch : undefined}
      scrollResetKey={
        ride
          ? `${ride.id}:${ride.status}:${String(model?.waitingForCustomer ?? false)}`
          : endedRide
            ? `ended:${endedRide.id}`
            : undefined
      }
      footer={footerContent}
    >
      {ride && model ? (
        <>
          <View style={styles.tripHeader}>
            <Text style={themed_s.label}>Chuyến #{ride.id}</Text>
            <StatusBadge kind="ride" value={ride.status} contextLabel="Trạng thái chuyến" />
          </View>

          <RideStatusBanner banner={model.statusBanner} />

          {model.showMap && markers[0] ? (
            <View style={styles.map}>
              <GoongMap
                mapKey={env.goongMapKey}
                center={markers[0].coordinate}
                bounds={mapBounds([...markers.map((marker) => marker.coordinate), ...(ride.route?.coordinates ?? [])])}
                markers={markers}
                route={ride.route?.coordinates}
                interactive={false}
              />
            </View>
          ) : null}

          {pickupTime ? <Text style={themed_s.text}>{pickupTime}</Text> : null}

          <RideRouteCard ride={ride} navigationStop={model.navigation} routeMode={model.routeMode}>
            <Divider style={{ backgroundColor: colors.outlineVariant }} />
            <View style={styles.routeSummary}>
              <View style={styles.fare}>
                {driverNetEarning != null ? (
                  <>
                    <Text style={themed_s.label}>Thu nhập dự kiến</Text>
                    <MoneyText value={driverNetEarning} variant="headline" style={styles.fareAmount} />
                    <Text style={themed_s.label}>
                      Khách trả: {formatMoney(customerFare, { nonBreaking: true })}
                      {ride.paymentMethod ? ` · ${ride.paymentMethod === "WALLET" ? "Thanh toán qua ví" : "Tiền mặt"}` : ""}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={themed_s.label}>Cước dự kiến</Text>
                    <MoneyText value={customerFare} variant="headline" style={styles.fareAmount} />
                    {ride.paymentMethod ? (
                      <Text style={themed_s.label}>
                        {ride.paymentMethod === "WALLET" ? "Thanh toán qua ví" : "Tiền mặt"}
                      </Text>
                    ) : null}
                  </>
                )}
                {model.vehicleSummary ? (
                  <Text style={themed_s.label}>{model.vehicleSummary}</Text>
                ) : null}
              </View>
              {ride.route ? (
                <Text style={[themed_s.metric, styles.routeMetrics]}>
                  {Math.ceil(ride.route.durationSeconds / 60)} phút · {formatDistance(ride.route.distanceMeters / 1000)}
                </Text>
              ) : null}
            </View>
          </RideRouteCard>

          <RideCustomerCard key={ride.id} ride={ride} />

          <GroupedList title="Thao tác chuyến đi">
            {viewableHandovers.map((item) => (
              <SettingsListItem
                key={item.stop}
                title={item.stop === "pickup" ? "Xem biên bản nhận xe" : "Xem biên bản trả xe"}
                icon="assignment"
                onPress={() => inspection(item.stop)}
              />
            ))}
            <SettingsListItem
              title="Làm mới trạng thái chuyến"
              icon="refresh"
              disabled={query.isFetching}
              onPress={() => void query.refetch()}
            />
            <SettingsListItem
              title="Trợ giúp về chuyến này"
              icon="help-outline"
              onPress={() => router.push({ pathname: "/support", params: { rideId: String(ride.id) } })}
            />
            {canCancel ? (
              <SettingsListItem
                title="Hủy chuyến"
                icon="cancel"
                destructive
                disabled={progress.isPending || cancel.isPending}
                onPress={() => {
                  const userId = useSessionStore.getState().user?.id;
                  if (!userId) return;
                  cancel.reset();
                  setReason("");
                  setConfirmation({ rideId: ride.id, userId });
                }}
              />
            ) : null}
          </GroupedList>
        </>
      ) : query.isSuccess ? (
        <Card style={themed_s.card}>
          {endedRide ? (
            <>
              <View style={styles.tripHeader}>
                <Text style={themed_s.title}>Chuyến #{endedRide.id} đã kết thúc</Text>
                <StatusBadge kind="ride" value={endedRide.status} contextLabel="Trạng thái chuyến" />
              </View>
              <Text style={themed_s.text}>
                {endedRide.cancelledByRole === "CUSTOMER"
                  ? "Khách hàng đã hủy chuyến này."
                  : endedRide.cancelledByRole === "SYSTEM"
                    ? "Hệ thống đã kết thúc chuyến này."
                    : "Chuyến đi đã được đóng."}
                {endedRide.cancelReason ? ` Lý do: ${endedRide.cancelReason}` : ""}
              </Text>
              <Button
                label="Xem chi tiết chuyến"
                onPress={() => router.replace({ pathname: "/ride/complete", params: { rideId: String(endedRide.id) } })}
              />
              <Button variant="secondary" label="Về trang chủ" onPress={() => router.replace("/(tabs)/home")} />
            </>
          ) : (
            <>
              <Text>Bạn chưa có chuyến đang hoạt động.</Text>
              <Button variant="secondary" label="Về trang chủ" onPress={() => router.replace("/(tabs)/home")} />
            </>
          )}
        </Card>
      ) : null}

      <DriverConfirmationDialog
        visible={Boolean(confirmation)}
        busy={cancel.isPending}
        title="Hủy chuyến đã nhận?"
        description="Khách sẽ được thông báo. Nếu còn lượt tìm lại trước khi tới điểm đón, hệ thống sẽ tìm tài xế khác."
        confirmLabel="Xác nhận hủy chuyến"
        dismissLabel="Tiếp tục chuyến"
        disabled={!reason.trim() || !canCancel || ride?.id !== confirmation?.rideId}
        error={cancel.error?.message}
        onDismiss={() => setConfirmation(null)}
        onConfirm={() => { if (confirmation) cancel.mutate({ ...confirmation, reason: reason.trim() }); }}
      >
        <TextInput
          label="Lý do hủy"
          mode="flat"
          underlineColor={colors.transparent}
          multiline
          maxLength={255}
          draftValue={reason}
          onChangeText={setReason}
          editable={!cancel.isPending}
        />
        <Text style={themed_s.label}>{reason.length}/255 ký tự</Text>
      </DriverConfirmationDialog>
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  map: { height: 200, borderRadius: borderRadius.default, overflow: "hidden" },
  headerAction: { width: 48, height: 48, borderRadius: 24, margin: 0 },
  progress: { paddingHorizontal: spacing.spaceMd, paddingTop: spacing.spaceXs, paddingBottom: spacing.spaceSm, gap: spacing.spaceSm },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.px3 },
  step: { ...typography.label },
  progressBar: { height: 3, borderRadius: borderRadius.full },
  tripHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  routeSummary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  fare: { gap: spacing.xxs, flex: 1, minWidth: 160 },
  fareAmount: { ...typography.moneyDisplay },
  routeMetrics: { flexShrink: 1 },
  primaryAction: { minHeight: 52, justifyContent: "center" },
  waitingFooter: { gap: spacing.spaceSm },
});
