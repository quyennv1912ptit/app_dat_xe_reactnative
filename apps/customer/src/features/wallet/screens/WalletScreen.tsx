import { useWalletHistory, useWalletOverview } from '@/lib/useWallet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { walletBalance } from '@datxe/shared';
import { Button, ScreenWrapper, WalletBalanceCard, WalletHistorySection, WalletLoadState } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
export default function WalletScreen() {
  const router = useRouter();
  const overview = useWalletOverview();
  const history = useWalletHistory();
  const refresh = () => Promise.all([overview.refetch(), history.refetch()]);
  return <ScreenWrapper>
    <ScreenHeader title="Ví của tôi" onBack={() => router.back()} />
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} refreshControl={<RefreshControl refreshing={overview.isRefetching} onRefresh={() => void refresh()} />}>
      <WalletBalanceCard title="Ví ứng dụng" balance={walletBalance(overview.data, 'CUSTOMER')} description="Số dư dùng để thanh toán các chuyến đi trong ứng dụng.">
        <Button label="Nạp tiền" icon="add" onPress={() => router.push('/wallet/top-up')} />
        <Button variant="secondary" label="Phương thức thanh toán" onPress={() => router.push('/payment-methods')} />
      </WalletBalanceCard>
      <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
      <WalletHistorySection items={history.items} loading={history.isLoading} error={history.error?.message} hasMore={history.hasNextPage} loadingMore={history.isFetchingNextPage}
        onMore={() => void history.fetchNextPage()} onRetry={() => void history.refetch()} onOpenRide={id => router.push({ pathname: '/ride/[id]', params: { id: String(id) } })} />
    </ScrollView>
  </ScreenWrapper>;
}
