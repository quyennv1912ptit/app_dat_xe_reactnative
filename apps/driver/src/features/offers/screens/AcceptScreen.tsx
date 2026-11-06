import { DriverPage } from "@/components/DriverPage";
import { rideStyles } from "@/components/rideStyles";
import { openExternalDirections } from "@/lib/navigation";
import { vehicleTypeLabel, transmissionLabel } from "@/lib/displayLabels";
import { formatMoney } from "@datxe/shared";
import { Button, Card, Typography as Text, useThemedStyles } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { useAccept } from "../hooks/useAccept";

export default function AcceptRideScreen() {
  const s = useThemedStyles(rideStyles);
  const h = useAccept();
  const offer = h.offer;
  const available = Boolean(offer && h.secondsLeft > 0);
  const goHome = () => h.router.replace("/(tabs)/home");

  return (
    <DriverPage
      title="Yêu cầu chuyến đi"
      loading={h.loading}
      error={offer ? h.error : undefined}
      footer={available || h.busy ? (
        <>
          <Button label={`Nhận chuyến · ${h.secondsLeft}s`} disabled={!available} loading={h.busy}
            loadingLabel="Đang xử lý…" onPress={h.accept} />
          <Button variant="ghost" disabled={h.busy} label="Bỏ qua yêu cầu" onPress={h.reject} />
        </>
      ) : undefined}
    >
      {offer && (available || h.busy) ? (
        <>
          <Card style={s.card}>
            <Text style={s.label}>Thu nhập dự kiến</Text>
            <Text style={s.title}>{offer.driverEarning != null ? formatMoney(offer.driverEarning) : "Chưa có thông tin"}</Text>
            <Text style={s.text}>Cước khách trả dự kiến · {formatMoney(offer.fareEstimate)}</Text>
          </Card>
          <Card style={s.card}>
            <Text style={s.title}>Lộ trình dự kiến</Text>
            <Text style={s.label}>Khách · {offer.customer.displayName}</Text>
            <View style={styles.leg}>
              <Text style={s.label}>Từ vị trí của bạn đến điểm đón</Text>
              <Text style={s.text}>
                {offer.distanceToPickupKm != null && offer.etaToPickupMin != null
                  ? `Khoảng ${offer.distanceToPickupKm} km · ${offer.etaToPickupMin} phút`
                  : "Chưa có ước tính đến điểm đón"}
              </Text>
              <Text style={s.text}>{offer.pickup.address}</Text>
              {offer.pickupNote ? <Text style={s.label}>Ghi chú đón · {offer.pickupNote}</Text> : null}
            </View>
            <View style={styles.leg}>
              <Text style={s.label}>Từ điểm đón đến điểm trả</Text>
              <Text style={s.text}>Khoảng {offer.tripDistanceKm} km · {offer.estDurationMin} phút</Text>
              <Text style={s.text}>{offer.dropoff.address}</Text>
            </View>
            <Text style={s.label}>{vehicleTypeLabel(offer.vehicle.type)} · {transmissionLabel(offer.vehicle.transmission)}</Text>
            {offer.note ? <Text style={s.text}>{offer.note}</Text> : null}
            <Button variant="ghost" icon="directions" iconPosition="leading" label="Mở chỉ đường tới điểm đón"
              onPress={() => void openExternalDirections(offer.pickup)} />
          </Card>
        </>
      ) : !h.loading ? (
        <Card style={s.card}>
          <Text style={s.title}>Yêu cầu chưa khả dụng</Text>
          <Text style={s.text}>{h.error || (offer ? "Thời gian nhận chuyến đã hết." : "Hiện chưa có yêu cầu chuyến đi đang chờ.")}</Text>
          {!offer && h.error ? <Button variant="secondary" label="Kiểm tra lại" onPress={() => void h.refresh()} /> : null}
          <Button label="Về trang chủ" onPress={goHome} />
        </Card>
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({ leg: { gap: 4, paddingVertical: 4 } });
