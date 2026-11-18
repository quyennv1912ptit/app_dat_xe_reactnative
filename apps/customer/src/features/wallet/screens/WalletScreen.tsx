import { useWalletHistory, useWalletOverview } from '@/lib/useWallet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { walletBalance, type WalletEntry } from '@datxe/shared';
import {
  Button,
  Card,
  ScreenWrapper,
  Typography as Text,
  WalletBalanceCard,
  WalletEntryCard,
  WalletLoadState,
  typography,
  useThemeColors,
} from '@datxe/ui';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';

export default function WalletScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const overview = useWalletOverview();
  const history = useWalletHistory();
  const refresh = () => Promise.all([overview.refetch(), history.refetch()]);

  const openRide = useCallback(
    (id: number) => router.push({ pathname: '/ride/[id]', params: { id: String(id) } }),
    [router],
  );

  const renderEntry = useCallback<ListRenderItem<WalletEntry>>(
    ({ item }) => <WalletEntryCard item={item} onOpenRide={openRide} />,
    [openRide],
  );

  const listHeader = (
    <View style={styles.stack}>
      <WalletBalanceCard
        title="Ví ứng dụng"
        balance={walletBalance(overview.data, 'CUSTOMER')}
        description="Số dư dùng để thanh toán các chuyến đi trong ứng dụng."
      >
        <Button label="Nạp tiền" icon="add" onPress={() => router.push('/wallet/top-up')} />
        <Button variant="secondary" label="Phương thức thanh toán" onPress={() => router.push('/payment-methods')} />
      </WalletBalanceCard>
      <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
      <Text accessibilityRole="header" style={typography.titleLg}>Lịch sử giao dịch</Text>
      <WalletLoadState loading={history.isLoading} error={history.error?.message} onRetry={() => void history.refetch()} />
      {!history.isLoading && !history.error && !history.items.length ? (
        <Card style={styles.card}>
          <Text>Chưa có giao dịch. Các khoản nạp, thanh toán và hoàn tiền sẽ hiển thị tại đây.</Text>
        </Card>
      ) : null}
    </View>
  );

  return (
    <ScreenWrapper>
      <ScreenHeader title="Ví của tôi" onBack={() => router.back()} />
      <FlatList
        data={history.items}
        keyExtractor={(item) => String(item.transactionId)}
        renderItem={renderEntry}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          history.hasNextPage ? (
            <Button variant="secondary" label="Xem thêm giao dịch" loading={history.isFetchingNextPage} onPress={() => void history.fetchNextPage()} />
          ) : history.items.length && !history.error ? (
            <Text style={{ color: colors.onSurfaceVariant }}>Đã hiển thị toàn bộ giao dịch.</Text>
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (history.hasNextPage && !history.isFetchingNextPage && !history.isLoading) {
            void history.fetchNextPage();
          }
        }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={overview.isRefetching} onRefresh={() => void refresh()} />}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  stack: { gap: 16 },
  card: { padding: 16, gap: 8 },
});
