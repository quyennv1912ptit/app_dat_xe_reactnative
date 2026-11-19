import { DriverPage } from '@/components/DriverPage';
import { useDriverCredit } from '@/lib/useDriverCredit';
import { useWalletOverview, useWalletTopUp } from '@/lib/useWallet';
import { walletBalance, formatMoney } from '@datxe/shared';
import { Button, Card, Typography as Text, WalletBalanceCard, WalletLoadState, WalletMoneyForm, spacing } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function DriverTopUpScreen() {
  const router = useRouter();
  const overview = useWalletOverview();
  const credit = useDriverCredit();
  const submit = useWalletTopUp();
  const shortfall = credit.data && credit.data.shortfall > 0 ? Math.ceil(credit.data.shortfall) : undefined;
  return (
    <DriverPage form title="Nạp ví tín dụng">
      <WalletBalanceCard
        accent="primary"
        title="Ví tín dụng"
        balance={walletBalance(overview.data, 'CREDIT')}
        description={
          credit.data
            ? `Hạn mức nhận chuyến ${formatMoney(credit.data.minimumCredit)}.${credit.data.shortfall > 0 ? ` Cần nạp thêm ${formatMoney(credit.data.shortfall)}.` : ' Đã đủ điều kiện nhận chuyến.'}`
            : 'Nạp tiền để duy trì điều kiện nhận chuyến.'
        }
      />
      <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
      {overview.data && !overview.isError ? overview.data.mockTopUpEnabled ? (
        <WalletMoneyForm
          mode="topup"
          maxAmount={overview.data.maxTopUpAmount}
          suggestedAmount={shortfall}
          suggestedLabel={shortfall ? `Đủ hạn mức (${formatMoney(shortfall)})` : undefined}
          onSubmit={submit}
          onDone={() => router.dismissTo('/profile/wallet')}
        />
      ) : (
        <Card style={styles.fallbackCard}>
          <Text>Hiện chưa có cổng nạp tiền trực tuyến. Vui lòng liên hệ hỗ trợ để được hướng dẫn nạp vào ví tín dụng.</Text>
          <Button label="Liên hệ hỗ trợ nạp tiền" onPress={() => router.push('/support')} />
        </Card>
      ) : null}
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  fallbackCard: { gap: spacing.spaceMd },
});
