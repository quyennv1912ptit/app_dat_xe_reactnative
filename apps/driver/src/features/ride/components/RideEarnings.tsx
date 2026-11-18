import { rideStyles } from "@/components/rideStyles";
import { formatMoney, type CustomerRideDetail } from "@datxe/shared";
import { MoneyText, Typography as Text, useThemedStyles } from "@datxe/ui";

export function RideEarnings({ earnings }: { earnings: CustomerRideDetail['driverEarnings'] }) {
  const s = useThemedStyles(rideStyles);
  return <>
    <Text style={s.label}>Thu nhập sau chiết khấu</Text>
    {earnings ? <>
      <MoneyText value={earnings.netAmount} variant="display" style={s.amount} />
      <Text style={s.text}>Chiết khấu: {formatMoney(earnings.commissionAmount, { nonBreaking: true })}</Text>
      <Text style={s.label}>{earnings.creditedToCash ? 'Đã cộng vào ví tiền mặt.' : earnings.paid ? 'Tiền khách đã trả trực tiếp; chiết khấu đã trừ từ ví tín dụng.' : 'Chờ thu tiền khách. Chiết khấu đã trừ từ ví tín dụng.'}</Text>
    </> : <Text style={s.text}>Chưa có dữ liệu quyết toán cho chuyến này.</Text>}
  </>;
}
