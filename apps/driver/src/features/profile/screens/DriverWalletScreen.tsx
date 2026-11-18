import { useCallback } from 'react';
import { DriverPage } from '@/components/DriverPage';
import { useDriverCredit } from '@/lib/useDriverCredit';
import { useWalletHistory, useWalletOverview } from '@/lib/useWallet';
import { walletBalance, formatMoney, type WalletEntry } from '@datxe/shared';
import { Button, Card, FilterChip, Typography as Text, WalletBalanceCard, WalletEntryCard, WalletLoadState, borderRadius, spacing, typography, useThemeColors } from '@datxe/ui';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

const filterOptions = [
  { kind: undefined, label: 'Tất cả ví' },
  { kind: 'CREDIT' as const, label: 'Tín dụng' },
  { kind: 'CASH' as const, label: 'Tiền mặt' },
];

export default function DriverWalletScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const overview = useWalletOverview();
  const history = useWalletHistory();
  const credit = useDriverCredit();
  const refreshAll = useCallback(
    () => Promise.all([overview.refetch(), history.refetch(), credit.refetch()]),
    [credit, history, overview],
  );
  const openRide = useCallback(
    (id: number) => router.push({ pathname: '/ride/complete', params: { rideId: String(id) } }),
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: WalletEntry }) => <WalletEntryCard item={item} onOpenRide={openRide} />,
    [openRide],
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.balanceGrid}>
        <WalletBalanceCard
          accent="primary"
          style={styles.balanceTile}
          title="Ví tín dụng"
          balance={walletBalance(overview.data, 'CREDIT')}
          description={
            credit.data
              ? `Hạn mức ${formatMoney(credit.data.minimumCredit)}${credit.data.shortfall > 0 ? ` · Thiếu ${formatMoney(credit.data.shortfall)}` : ' · Đủ điều kiện'}`
              : 'Dùng trừ chiết khấu chuyến.'
          }
        >
          <Button label="Nạp tiền" icon="add" iconPosition="leading" onPress={() => router.push('/profile/top-up')} />
        </WalletBalanceCard>
        <WalletBalanceCard
          accent="neutral"
          style={styles.balanceTile}
          title="Ví tiền mặt"
          balance={walletBalance(overview.data, 'CASH')}
          description="Thu nhập chuyến trả ví khả dụng (đã trừ khoản chờ duyệt rút)."
        >
          <Button variant="secondary" label="Rút tiền" onPress={() => router.push('/profile/withdraw')} />
        </WalletBalanceCard>
      </View>
      <WalletLoadState loading={overview.isLoading} error={overview.error?.message} onRetry={() => void overview.refetch()} />
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={typography.titleLg}>Lịch sử giao dịch</Text>
      </View>
      <View style={styles.chips}>
        {filterOptions.map(item => (
          <FilterChip
            key={item.label}
            label={item.label}
            selected={history.filter === item.kind}
            onPress={() => history.setFilter(item.kind)}
            style={styles.chip}
          />
        ))}
      </View>
      <WalletLoadState loading={history.isLoading} error={history.error?.message} onRetry={() => void history.refetch()} />
    </View>
  );

  const empty = !history.isLoading && !history.error ? (
    <Card style={styles.emptyCard}>
      <Text>Chưa có giao dịch. Các khoản nạp, thanh toán và hoàn tiền sẽ hiển thị tại đây.</Text>
    </Card>
  ) : null;

  const footer = history.hasNextPage ? (
    <Button
      variant="secondary"
      label="Xem thêm giao dịch"
      loading={history.isFetchingNextPage}
      onPress={() => void history.fetchNextPage()}
    />
  ) : history.items.length && !history.error ? (
    <Text style={{ color: colors.onSurfaceVariant }}>Đã hiển thị toàn bộ giao dịch.</Text>
  ) : null;

  return (
    <DriverPage title="Ví tài xế" scroll={false}>
      <FlatList
        data={history.items}
        keyExtractor={item => String(item.transactionId)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ?? undefined}
        ListFooterComponent={footer ?? undefined}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={(overview.isRefetching || history.isRefetching) && !history.isFetchingNextPage}
            onRefresh={() => void refreshAll()}
          />
        }
      />
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.spaceMd, gap: spacing.px3, paddingBottom: spacing.spaceXl },
  header: { gap: spacing.px3 },
  balanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.px3 },
  balanceTile: { flex: 1, minWidth: 220 },
  sectionHeader: { paddingTop: spacing.spaceXs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.spaceSm },
  chip: { minHeight: 48, justifyContent: 'center' },
  emptyCard: { padding: spacing.spaceLg, gap: spacing.px3, borderRadius: borderRadius.default },
});
