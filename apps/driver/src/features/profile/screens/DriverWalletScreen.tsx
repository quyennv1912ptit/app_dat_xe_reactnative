import { DriverPage } from "@/components/DriverPage";
import { rideStyles } from "@/components/rideStyles";
import { driverApi } from "@/lib/driverApi";
import { walletTransactionLabel } from "@/lib/displayLabels";
import { useRefreshOnFocus } from "@/lib/useRefreshOnFocus";
import { formatMoney } from "@datxe/shared";
import { Card, GroupedList, SettingsListItem, Typography as Text, useThemeColors, useThemedStyles } from "@datxe/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { List, RadioButton } from "react-native-paper";

export default function DriverWalletScreen() {
  const s = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const wallet = useQuery({ queryKey: ["driver", "wallet"], queryFn: driverApi.wallet });
  useRefreshOnFocus(wallet.refetch);
  const [period, setPeriod] = useState("all");
  const [kind, setKind] = useState("all");
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);
  const transactions = wallet.data?.wallet_transactions.filter((item) =>
    (period === "all" || new Date(item.created_at) >= cutoff)
    && (kind === "all" || (kind === "credit" ? item.amount > 0 : item.amount < 0))
  ) ?? [];

  return (
    <DriverPage title="Thu nhập" loading={wallet.isLoading} error={wallet.error?.message} retry={wallet.refetch}>
      {wallet.data ? (
        <>
          <Card style={s.card}>
            <Text style={s.label}>Số dư thu nhập</Text>
            <Text style={s.title}>{formatMoney(wallet.data.income_balance)}</Text>
            <Text style={s.text}>Hiển thị tối đa 100 giao dịch gần nhất đã ghi nhận vào ví.</Text>
          </Card>
          <GroupedList>
            <List.Accordion theme={{ colors: { background: colors.transparent } }} title="Lọc giao dịch">
              <RadioButton.Group value={period} onValueChange={setPeriod}>
                <RadioButton.Item value="all" label="Mọi thời điểm" />
                <RadioButton.Item value="week" label="7 ngày gần nhất" />
              </RadioButton.Group>
              <RadioButton.Group value={kind} onValueChange={setKind}>
                <RadioButton.Item value="all" label="Mọi giao dịch" />
                <RadioButton.Item value="credit" label="Tiền vào" />
                <RadioButton.Item value="debit" label="Tiền ra" />
              </RadioButton.Group>
            </List.Accordion>
          </GroupedList>
          <GroupedList title="Giao dịch">
            {transactions.map((item) => (
              <SettingsListItem key={item.id} icon="receipt-long"
                title={`${walletTransactionLabel(item.type)} · ${item.amount > 0 ? "+" : ""}${formatMoney(item.amount)}`}
                description={[
                  new Date(item.created_at).toLocaleString("vi-VN"),
                  item.ride_id ? `Chuyến #${item.ride_id}` : null,
                  item.description !== item.type ? item.description : null,
                ].filter(Boolean).join(" · ")}
                onPress={item.ride_id ? () => router.push({ pathname: "/ride/complete", params: { rideId: String(item.ride_id) } }) : undefined} />
            ))}
            {!transactions.length ? <Text>Chưa có giao dịch phù hợp.</Text> : null}
          </GroupedList>
        </>
      ) : null}
    </DriverPage>
  );
}
