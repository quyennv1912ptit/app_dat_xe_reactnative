import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatStatuses,styles } from '../components/CustomerSupportScreenParts';
import { useCustomerSupport } from '../hooks/useCustomerSupport';
export default function CustomerSupportScreen() {
const { router, isSafety, ride, loading } = useCustomerSupport();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader title={isSafety ? 'An toàn chuyến đi' : 'Trợ giúp'} onBack={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.notice}><MaterialIcons name={isSafety ? 'shield' : 'support-agent'} size={32} color={colors.primary} /><Text style={styles.heading}>{isSafety ? 'Công cụ an toàn' : 'Trung tâm trợ giúp'}</Text><Text style={styles.body}>{isSafety ? 'Bạn có thể mở theo dõi để xem trạng thái và biên bản chuyến hiện tại.' : 'Bạn có thể tra cứu chuyến, trạng thái và lịch sử trực tiếp từ dữ liệu tài khoản.'}</Text></View>
      {loading ? <ActivityIndicator color={colors.primary} /> : ride ? <>
        <Pressable onPress={() => router.push({ pathname: '/ride/tracking', params: { rideId: String(ride.id) } })} style={styles.ride}><Text style={styles.label}>CHUYẾN ĐANG HOẠT ĐỘNG</Text><Text style={styles.body}>#{ride.id} · {ride.status}</Text><Text style={styles.meta}>{ride.pickupAddress || 'Điểm đón'} → {ride.dropoffAddress || 'Điểm đến'}</Text></Pressable>
        {ride.driverId && chatStatuses.includes(ride.status) ? <Pressable onPress={() => router.push({ pathname: '/chat', params: { rideId: String(ride.id) } } as never)} style={styles.chat}><MaterialIcons name="chat" size={20} color={colors.primary} /><Text style={styles.chatText}>Nhắn tin với tài xế</Text></Pressable> : null}
      </> : <Text style={styles.meta}>Hiện không có chuyến đang hoạt động.</Text>}
      <View style={styles.card}><Text style={styles.section}>Lưu ý về liên hệ hỗ trợ</Text><Text style={styles.body}>Backend hiện chưa cung cấp hotline hoặc API gửi SOS cho khách hàng. Màn hình này không gửi cảnh báo khẩn cấp và không hiển thị số điện thoại giả.</Text></View>
      <View style={styles.card}><Text style={styles.section}>Quản lý chuyến</Text><Text style={styles.body}>Mở Lịch sử để xem chi tiết, trạng thái, giá và biên bản bàn giao của chuyến.</Text><Pressable onPress={() => router.push('/(tabs)/history')} style={styles.link}><Text style={styles.linkText}>Mở lịch sử chuyến đi</Text><MaterialIcons name="chevron-right" size={22} color={colors.primary} /></Pressable></View>
    </ScrollView>
  </SafeAreaView>;
}
