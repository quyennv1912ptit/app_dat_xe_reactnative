import { driverApi } from "@/lib/driverApi";
import { rideStyles } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import { Typography as Text, useThemedStyles } from "@datxe/ui";
import { useQuery } from "@tanstack/react-query";

export function RideEarnings({ rideId }: { rideId: number }) {
  const s = useThemedStyles(rideStyles);
  const wallet = useQuery({ queryKey: ["driver", "wallet"], queryFn: driverApi.wallet });
  const recorded = wallet.data?.wallet_transactions.find((item) =>
    item.ride_id === rideId && item.type === "TRIP_EARNING" && Number.isFinite(item.amount)
  );
  return (
    <>
      <Text style={s.label}>Thu nhập tài xế</Text>
      {recorded ? (
        <Text style={s.amount}>{formatMoney(recorded.amount)}</Text>
      ) : (
        <Text style={s.text}>
          {wallet.isLoading ? "Đang kiểm tra ví…" : wallet.isError ? "Chưa tải được thu nhập." : "Chưa có số tiền cho chuyến này trong dữ liệu ví."}
        </Text>
      )}
    </>
  );
}
