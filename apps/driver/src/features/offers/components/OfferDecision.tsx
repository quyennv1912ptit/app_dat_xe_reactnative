import { transmissionLabel, vehicleTypeLabel } from '@/lib/displayLabels';
import type { DriverOffer } from '@/lib/driverOffer';
import { formatScheduledPickup } from '@/lib/scheduledPickup';
import { formatDistance, formatMoney } from '@datxe/shared';
import { offerPalette as palette, typography, Typography as Text, useLanguage } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

const EARNING_DISPLAY_STEP_VND = 500;

function validEstimate(value?: number | null): value is number {
  return value != null && Number.isFinite(value) && value >= 0;
}

function legEstimate(km?: number | null, minutes?: number | null) {
  const metrics = [];
  if (validEstimate(km)) metrics.push(formatDistance(km));
  if (validEstimate(minutes)) metrics.push(`${Math.round(minutes)} phút`);
  return metrics.join(' • ') || 'Chưa có ước tính';
}

function Stop({ kind, address, km, minutes }: {
  kind: 'pickup' | 'dropoff';
  address: string;
  km?: number | null;
  minutes?: number | null;
}) {
  const pickup = kind === 'pickup';
  const label = pickup ? 'Điểm đón' : 'Điểm trả';
  const estimate = legEstimate(km, minutes);
  return (
    <View accessible accessibilityLabel={`${label}, ${address || 'Chưa có địa chỉ'}, ${estimate}`} style={styles.stop}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: pickup ? palette.red : palette.emerald }]} />
        {pickup ? (
          <View style={styles.connector}>
            {[0, 1, 2, 3, 4].map(dash => <View key={dash} style={styles.dash} />)}
          </View>
        ) : null}
      </View>
      <View style={styles.stopText}>
        <Text style={styles.estimate}>{label}</Text>
        <Text style={styles.address}>{address || "Chưa có địa chỉ"}</Text>
        <Text style={styles.estimate}>{estimate}</Text>
      </View>
    </View>
  );
}

export const OfferDecision = memo(function OfferDecision({ offer }: { offer: DriverOffer }) {
  useLanguage();
  const pickupTime = formatScheduledPickup(offer.scheduledAt);
  const totalKm = validEstimate(offer.distanceToPickupKm) && validEstimate(offer.tripDistanceKm)
    ? formatDistance(offer.distanceToPickupKm + offer.tripDistanceKm) : null;
  const totalMinutes = validEstimate(offer.etaToPickupMin) && validEstimate(offer.estDurationMin)
    ? `${Math.round(offer.etaToPickupMin + offer.estDurationMin)} phút` : null;
  const total = [totalMinutes, totalKm].filter(Boolean).join(' • ');
  const earning = offer.driverEarning;
  const roundedEarning = Math.round(earning / EARNING_DISPLAY_STEP_VND) * EARNING_DISPLAY_STEP_VND;
  const payment = offer.paymentMethod === 'CASH'
    ? { icon: 'payments' as const, label: 'Thu tiền mặt' }
    : offer.paymentMethod === 'WALLET'
      ? {
          icon: 'account-balance-wallet' as const,
          label: offer.paymentStatus === 'PAID' ? 'Đã trả qua ví' : 'Thanh toán qua ví',
        }
      : null;

  return (
    <>
      <View style={styles.header}>
        <View style={styles.earnings}>
          <Text style={styles.caption}>Thu nhập dự kiến</Text>
          {validEstimate(earning) ? (
            <Text accessibilityRole="header" textBreakStrategy="simple" style={styles.amount}>
              {roundedEarning !== earning ? '≈\u00A0' : ''}{formatMoney(roundedEarning, { nonBreaking: true })}
            </Text>
          ) : <Text style={styles.summary}>Chưa có thông tin</Text>}
        </View>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.vehicle}>{vehicleTypeLabel(offer.vehicle.type)}</Text>
            <Text style={styles.transmission}>{transmissionLabel(offer.vehicle.transmission)}</Text>
          </View>
          {payment ? (
            <View style={styles.paymentChip}>
              <MaterialIcons name={payment.icon} size={15} color={palette.emerald} importantForAccessibility="no" />
              <Text style={styles.paymentText}>{payment.label}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {pickupTime ? <Text style={styles.pickupTime}>{pickupTime}</Text> : null}
      <Text style={styles.summary}>{total ? `Tổng cộng: ${total}` : 'Chưa đủ dữ liệu tổng hành trình'}</Text>
      <Text style={styles.summary}>Khách hàng: {offer.customer.displayName} · {offer.customer.rating == null ? 'Chưa có đánh giá' : `${offer.customer.rating.toFixed(1)}/5`}</Text>
      <View style={styles.timeline}>
        <Stop kind="pickup" address={offer.pickup.address} km={offer.distanceToPickupKm} minutes={offer.etaToPickupMin} />
        <Stop kind="dropoff" address={offer.dropoff.address} km={offer.tripDistanceKm} minutes={offer.estDurationMin} />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  header: { gap: 8 },
  earnings: { flexShrink: 1 },
  caption: { ...typography.caption, color: palette.muted },
  amount: { ...typography.moneyDisplay, color: palette.emerald },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, backgroundColor: palette.badge, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  vehicle: { ...typography.label, color: palette.text },
  transmission: { ...typography.caption, color: palette.muted },
  pickupTime: { ...typography.label, color: palette.text },
  paymentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: palette.badge, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  paymentText: { ...typography.badge, color: palette.text },
  summary: { ...typography.body, color: palette.muted, fontVariant: ['tabular-nums'] },
  timeline: { gap: 2 },
  stop: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center', paddingTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  connector: { flex: 1, width: 1, gap: 3, marginTop: 4 },
  dash: { flex: 1, backgroundColor: palette.muted },
  stopText: { flex: 1, gap: 2, paddingBottom: 8 },
  address: { ...typography.cardTitle, color: palette.text },
  estimate: { ...typography.bodySecondary, color: palette.muted, fontVariant: ['tabular-nums'] },
});
