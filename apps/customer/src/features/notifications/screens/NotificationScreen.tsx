import { CustomerTabBar } from '@/components/CustomerTabBar';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { HEADER_ACTION_GROUP_WIDTH,HeaderActionGroup,HeaderIconButton,HeaderLabeledIconButton,ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bodyFor,category,styles,titleFor } from '../components/NotificationScreenParts';
import { useNotification } from '../hooks/useNotification';
export default function NotificationScreen() {
const { router, filter, setFilter, items, unreadCount, loading, error, refresh, markAll, openNotification, visible } = useNotification();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader
      title="Thông báo"
      largeTitle
      sideSlotWidth={HEADER_ACTION_GROUP_WIDTH}
      rightContent={<HeaderActionGroup>
        <HeaderIconButton icon="refresh" accessibilityLabel="Tải lại thông báo" onPress={() => void refresh()} compact />
        <HeaderLabeledIconButton icon="shield" label="An toàn" accessibilityLabel="An toàn chuyến đi" onPress={() => router.push({ pathname: '/support', params: { topic: 'safety' } })} />
      </HeaderActionGroup>}
    />
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.summary}><View><Text style={styles.heading}>Hộp thư thông báo</Text><Text style={styles.meta}>{unreadCount} thông báo chưa đọc</Text></View><Pressable disabled={unreadCount === 0} onPress={() => void markAll()}><Text style={[styles.markAll, unreadCount === 0 && styles.dim]}>Đọc tất cả</Text></Pressable></View>
      <View style={styles.filters}>{([['all', 'Tất cả'], ['trip', 'Chuyến đi'], ['promo', 'Ưu đãi'], ['vehicle', 'Xe']] as const).map(([key, label]) => <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filter, filter === key && styles.filterActive]}><Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text></Pressable>)}</View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && !visible.length ? (
        <EmptyStateCard
          icon="notifications-none"
          title={items.length === 0 ? 'Chưa có thông báo' : 'Không có thông báo trong mục này'}
          description={items.length === 0
            ? 'Thông báo về chuyến đi và ưu đãi sẽ xuất hiện tại đây.'
            : 'Thử xem tất cả thông báo để tìm nội dung khác.'}
          actionLabel={items.length === 0 ? 'Đặt chuyến đầu tiên' : 'Xem tất cả thông báo'}
          onAction={() => items.length === 0 ? router.push('/ride/route-selection') : setFilter('all')}
        />
      ) : null}
      {visible.map((item) => {
        const unread = !item.readAt;
        return <Pressable key={item.id} onPress={() => void openNotification(item)} style={[styles.item, unread && styles.itemUnread]}>
          <View style={[styles.icon, unread && styles.iconUnread]}><MaterialIcons name={category(item.type) === 'vehicle' ? 'directions-car' : category(item.type) === 'promo' ? 'local-offer' : 'notifications'} size={22} color={unread ? colors.primary : colors.onSurfaceVariant} /></View>
          <View style={styles.copy}><View style={styles.itemHeader}><Text style={[styles.itemTitle, unread && styles.itemTitleUnread]}>{titleFor(item.type)}</Text>{unread ? <View style={styles.dot} /> : null}</View><Text style={styles.body}>{bodyFor(item.payload)}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text></View>
        </Pressable>;
      })}
    </ScrollView>
    <CustomerTabBar active="notifications" unreadCount={unreadCount} />
  </SafeAreaView>;
}
