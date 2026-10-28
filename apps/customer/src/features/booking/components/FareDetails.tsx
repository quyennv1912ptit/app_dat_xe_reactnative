import type { RideEstimate } from '@datxe/shared';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '@datxe/ui';
import { minimumFareAdjustment, money } from '../bookingUtils';
import { bookingStyles as s } from './bookingStyles';
function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <View style={s.between}><Text style={[s.text, s.flex, strong && { fontWeight: '700' }]}>{label}</Text><Text style={[s.text, strong && { fontWeight: '700', color: colors.primary }]}>{value}</Text></View>; }
export function FareDetails({ estimate, loading, error, retry }: { estimate?: RideEstimate; loading: boolean; error: string; retry: () => void }) {
  const adjustment = estimate ? minimumFareAdjustment(estimate) : 0;
  return <View style={s.card}><Text style={s.section}>Chi tiết giá</Text>{loading ? <View style={s.row}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>Đang cập nhật giá chuyến…</Text></View> : null}{error ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Pressable onPress={retry}><Text style={s.link}>Thử lấy giá lại</Text></Pressable></View> : null}{estimate && !error ? <>
    <Text style={s.muted}>{estimate.distanceKm.toFixed(1)} km · Khoảng {estimate.estimatedDurationMinutes} phút</Text>
    <PriceRow label="Giá mở đầu" value={money(estimate.baseFare)} /><PriceRow label="Cước quãng đường" value={money(estimate.distanceFare)} />
    {estimate.waitingFare > 0 ? <PriceRow label="Phí chờ" value={money(estimate.waitingFare)} /> : null}
    {estimate.nightSurcharge > 0 ? <PriceRow label="Phụ phí ban đêm" value={money(estimate.nightSurcharge)} /> : null}
    {estimate.returnFee > 0 ? <PriceRow label="Phí tài xế quay về" value={money(estimate.returnFee)} /> : null}
    {adjustment > 0 ? <PriceRow label="Điều chỉnh cước tối thiểu" value={money(adjustment)} /> : null}
    {estimate.discountAmount > 0 ? <PriceRow label="Ưu đãi" value={`−${money(estimate.discountAmount)}`} /> : null}
    <View style={s.divider} /><PriceRow label="Tổng thanh toán" value={money(estimate.payableFare)} strong />
  </> : null}<Text style={s.muted}>Giá được tính theo lộ trình và bảng giá đang áp dụng.</Text></View>;
}
