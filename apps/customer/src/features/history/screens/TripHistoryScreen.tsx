import { CustomerTabBar } from '@/components/CustomerTabBar';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { HEADER_ACTION_GROUP_WIDTH,HeaderActionGroup,HeaderIconButton,HeaderLabeledIconButton,ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { labelForStatus,money,styles } from '../components/TripHistoryScreenParts';
import { useTripHistory } from '../hooks/useTripHistory';
export default function TripHistoryScreen() {
const { router, filter, setFilter, rides, total, page, hasNext, loading, loadingMore, error, unreadCount, load } = useTripHistory();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Lịch sử"
        largeTitle
        sideSlotWidth={HEADER_ACTION_GROUP_WIDTH}
        rightContent={<HeaderActionGroup>
          <HeaderIconButton icon="refresh" accessibilityLabel="Tải lại lịch sử" onPress={() => void load()} compact />
          <HeaderLabeledIconButton icon="shield" label="An toàn" accessibilityLabel="An toàn chuyến đi" onPress={() => router.push({ pathname: '/support', params: { topic: 'safety' } })} />
        </HeaderActionGroup>}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.summary}><Text style={styles.summaryCount}>{total}</Text><Text style={styles.summaryText}>chuyến trong tài khoản</Text></View>
        <View style={styles.filters}>{([['all', 'Tất cả'], ['completed', 'Hoàn thành'], ['cancelled', 'Đã hủy']] as const).map(([key, label]) => <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filter, filter === key && styles.filterActive]}><Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text></Pressable>)}</View>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && rides.length === 0 ? (
          <EmptyStateCard
            icon="history"
            title={filter === 'all' ? 'Chưa có chuyến đi nào' : 'Chưa có chuyến phù hợp'}
            description={filter === 'all' ? 'Các chuyến đi của bạn sẽ xuất hiện ở đây.' : 'Thử xem tất cả chuyến đi để tìm chuyến bạn cần.'}
            actionLabel={filter === 'all' ? 'Đặt chuyến đầu tiên' : 'Xem tất cả chuyến'}
            onAction={() => filter === 'all' ? router.push('/ride/route-selection') : setFilter('all')}
          />
        ) : null}
        {rides.map((ride) => <Pressable key={ride.id} onPress={() => router.push({ pathname: '/ride/[id]', params: { id: String(ride.id), rideId: String(ride.id), returnTo: 'history' } })} style={styles.ride}>
          <View style={styles.rideHeader}><View style={styles.rideTitleRow}><MaterialIcons name="directions-car" size={22} color={colors.primary} /><Text style={styles.rideTitle}>Chuyến #{ride.id}</Text></View><Text style={[styles.status, ride.status === 'CANCELLED' && styles.statusCancelled]}>{labelForStatus[ride.status] ?? ride.status}</Text></View>
          <Text style={styles.meta}>{new Date(ride.createdAt).toLocaleString('vi-VN')} · {ride.type === 'INSTANT' ? 'Đặt ngay' : `Đón lúc ${ride.scheduledAt ? new Date(ride.scheduledAt).toLocaleString('vi-VN') : 'theo lịch'}`}</Text>
          <Text style={styles.address}><Text style={styles.pin}>Đón: </Text>{ride.pickupAddress || 'Chưa có địa chỉ'}</Text>
          <Text style={styles.address}><Text style={styles.pin}>Đến: </Text>{ride.dropoffAddress || 'Chưa có địa chỉ'}</Text>
          <View style={styles.rideFooter}><Text style={styles.fare}>{money(ride.finalFare ?? ride.estimatedFare)}</Text><MaterialIcons name="chevron-right" size={23} color={colors.onSurfaceVariant} /></View>
        </Pressable>)}
        {hasNext ? <Pressable disabled={loadingMore} onPress={() => void load(page + 1, true)} style={styles.more}>{loadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.moreText}>Tải thêm chuyến</Text>}</Pressable> : null}
      </ScrollView>
      <CustomerTabBar active="history" unreadCount={unreadCount} />
    </SafeAreaView>
  );
}
