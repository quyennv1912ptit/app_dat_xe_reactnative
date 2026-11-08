import { useWalletOverview, useWalletTopUp } from '@/lib/useWallet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { walletBalance } from '@datxe/shared';
import { Button, Card, ScreenWrapper, Typography as Text, WalletBalanceCard, WalletLoadState, WalletMoneyForm } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
export default function WalletTopUpScreen() {
  const router = useRouter();
  const overview = useWalletOverview();
  const submit = useWalletTopUp();
  return <ScreenWrapper>
    <ScreenHeader title="Nạp tiền vào ví" onBack={() => router.back()} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 20 }}>
      <WalletBalanceCard title="Số dư ví ứng dụng" balance={walletBalance(overview.data, 'CUSTOMER')} description="Tiền nạp dùng để thanh toán chuyến đi." />
      <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
      {overview.data && !overview.isError ? overview.data.mockTopUpEnabled ? <WalletMoneyForm mode="topup" maxAmount={overview.data.maxTopUpAmount} onSubmit={submit} onDone={() => router.back()} /> : <Card style={{ gap: 16 }}>
        <Text>Hiện chưa có cổng nạp tiền trực tuyến. Liên hệ hỗ trợ để được hướng dẫn; số dư chỉ cập nhật khi giao dịch được ghi nhận.</Text>
        <Button label="Liên hệ hỗ trợ nạp tiền" onPress={() => router.push('/support')} />
      </Card> : null}
    </ScrollView>
  </ScreenWrapper>;
}
