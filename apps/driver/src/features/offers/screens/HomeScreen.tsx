import { HomeDriverHeader } from "../components/HomeDriverHeader";
import { HomeOperationalStatus } from "../components/HomeOperationalStatus";
import { DriverPage } from "@/components/DriverPage";
import { MyDriverReviews } from "@/components/MyDriverReviews";
import { DriverChatButton } from "@/components/DriverChatButton";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useState } from "react";
import { useSessionStore } from "@/lib/store";
import { serverErrorCopy } from "@/lib/errorCopy";
import { useHome } from "../hooks/useHome";

export default function DriverHomeScreen() {
  const themed_s = useThemedStyles(s);
  const [vehicle, setVehicle] = useState<"CAR" | "MOTORCYCLE" | null>(null);
  const storedOnlineVehicle = useSessionStore((state) => state.onlineVehicleType);
  const h = useHome();
  const status = h.session.data?.status;
  const online = status === "ONLINE";
  const syncingRide = status === "BUSY" && !h.active.data;
  const approved = h.verification.data?.verification_status === "APPROVED";
  const vehicleTypes = h.capabilities.data?.acceptingVehicleTypes ?? [];
  const selected = vehicle && vehicleTypes.includes(vehicle) ? vehicle : vehicleTypes[0];
  const confirmedOnlineVehicle =
    h.session.data?.onlineVehicleType !== undefined
      ? h.session.data.onlineVehicleType
      : storedOnlineVehicle;
  const activeOnlineVehicle = online ? (confirmedOnlineVehicle ?? null) : null;
  const checking = !h.active.data && (h.availability.isPending || h.session.isLoading || h.active.isLoading
    || h.verification.isLoading || h.capabilities.isLoading || h.credit.isFetching);
  const retryConditions = () =>
    Promise.all([
      h.session.refetch(),
      h.verification.refetch(),
      h.active.refetch(),
      h.capabilities.refetch(),
      h.credit.refetch(),
    ]);
  const blocker = syncingRide
    ? { title: "Đang đồng bộ trạng thái chuyến", action: "Kiểm tra lại", onPress: () => void retryConditions() }
    : status === "BLOCKED"
    ? { title: "Tài khoản đang bị khóa nhận chuyến" }
    : !h.credit.data || h.credit.isError
    ? { title: "Chưa kiểm tra được số dư ví tín dụng", action: "Kiểm tra lại số dư", onPress: () => void h.credit.refetch() }
    : !h.credit.data.canReceive
      ? { title: "Số dư ví tín dụng không đủ", action: "Nạp tiền", onPress: () => h.router.push("/profile/top-up") }
    : !h.session.data || !h.verification.data || !h.capabilities.data
    || (h.active.isError && h.active.data === undefined)
    ? { title: "Chưa tải được điều kiện nhận chuyến", action: "Thử lại", onPress: () => { void retryConditions(); } }
    : !approved
      ? { title: "Hồ sơ chưa đủ điều kiện nhận chuyến", action: "Mở xác minh tài xế", onPress: () => h.router.push("/profile/verification") }
      : !vehicleTypes.length
        ? { title: "Chưa có loại xe đủ điều kiện đang bật", action: "Loại xe nhận lái hộ", onPress: () => h.router.push("/profile/capabilities") }
        : undefined;
  return (
    <DriverPage
      title="Trang chủ tài xế"
      tabs
      loading={h.session.isLoading || h.active.isLoading}
      error={serverErrorCopy(
        h.session.error?.message ||
        h.verification.error?.message ||
        h.active.error?.message ||
        h.offer.error?.message ||
        h.capabilities.error?.message ||
        h.availability.error?.message
      )}
      retry={() =>
        Promise.all([
          retryConditions(),
          h.offer.refetch(),
        ])
      }
    >
      {online && h.credit.allowed && h.offer.data && !h.active.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.title}>
            Yêu cầu chuyến #{h.offer.data.rideId}
          </Text>
          <Text style={themed_s.text}>
            {h.offer.data.pickup.address} → {h.offer.data.dropoff.address}
          </Text>
          <Button
            onPress={() => h.router.push({ pathname: "/ride/accept", params: { rideId: String(h.offer.data?.rideId) } })}
            style={themed_s.button}
            label={"Xem yêu cầu"}
            textStyle={themed_s.buttonText}
          />
        </Card>
      ) : null}

      {h.active.data ? (
        <Card radius={20} style={themed_s.card}>
          <Text style={themed_s.text}>
            Chuyến #{h.active.data.id}
          </Text>
          <StatusBadge
            kind="ride"
            value={h.active.data.status}
            contextLabel="Trạng thái chuyến"
          />
          <Text style={themed_s.label}>
            {["IN_PROGRESS", "ARRIVED_DESTINATION", "VEHICLE_RETURNED"].includes(h.active.data.status)
              ? "Điểm trả"
              : "Điểm đón"}
          </Text>
          <Text style={themed_s.text}>
            {["IN_PROGRESS", "ARRIVED_DESTINATION", "VEHICLE_RETURNED"].includes(h.active.data.status)
              ? h.active.data.dropoffAddress || "Chưa có địa chỉ điểm trả"
              : h.active.data.pickupAddress || "Chưa có địa chỉ điểm đón"}
          </Text>
          {h.active.data.licensePlate ? (
            <Text style={themed_s.label}>Biển số · {h.active.data.licensePlate}</Text>
          ) : null}
          <Button
            style={themed_s.button}
            onPress={() => h.router.push("/ride/in-progress")}
            label={"Tiếp tục chuyến"}
            textStyle={themed_s.buttonText}
          />
          <DriverChatButton ride={h.active.data} />
        </Card>
      ) : null}

      <HomeOperationalStatus
        online={online}
        active={Boolean(h.active.data)}
        loading={checking}
        onlineVehicle={activeOnlineVehicle}
        acceptedVehicleTypes={vehicleTypes}
        selectedVehicle={selected ?? null}
        onSelectVehicle={(value) => setVehicle(value)}
        vehicleDetail={null}
        blocker={blocker}
        onDiagnostics={() => h.router.push("/settings/reception")}
      >
        {!h.active.data && h.credit.data && !h.credit.data.canReceive ? (
          <Text style={themed_s.text}>Ví tín dụng: {formatMoney(h.credit.data.creditBalance)} · Hạn mức: {formatMoney(h.credit.data.minimumCredit)}. Cần nạp thêm {formatMoney(h.credit.data.shortfall)} để nhận chuyến.</Text>
        ) : null}
        {!h.active.data && online ? (
          <Button variant="secondary" label="Tạm ngừng nhận chuyến"
            onPress={() => h.availability.mutate({ online: false })} />
        ) : !h.active.data && status === "OFFLINE" && !blocker ? (
          <Button label="Bật nhận chuyến" disabled={!selected || !h.credit.allowed}
            onPress={() => { if (selected) h.availability.mutate({ online: true, vehicle_type: selected }); }} />
        ) : null}
      </HomeOperationalStatus>
      <HomeDriverHeader summary={h.summary.data} name={h.session.data?.fullName} loading={h.summary.isLoading} error={h.summary.isError} onRetry={() => void h.summary.refetch()} onProfile={() => h.router.navigate("/(tabs)/profile")} />
      <MyDriverReviews collapsible />
    </DriverPage>
  );
}
