import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/TripCompletedScreenParts';
import { useTripCompleted } from '../hooks/useTripCompleted';
export default function TripCompletedScreen() {
const { router, ride, stars, setStars, comment, setComment, saving, error, finish } = useTripCompleted();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader title="Hoàn thành chuyến" backIcon="home" backAccessibilityLabel="Về trang chủ" onBack={() => router.replace('/(tabs)/home')} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.success}><MaterialIcons name="check-circle" size={54} color={colors.primary} /><Text style={styles.heading}>Chuyến đi đã hoàn thành</Text><Text style={styles.meta}>Thông tin hóa đơn và trạng thái được tải từ backend.</Text></View>
      {ride ? <View style={styles.card}><Text style={styles.section}>Chuyến #{ride.id}</Text><Text style={styles.meta}>{new Date(ride.completedAt ?? ride.updatedAt).toLocaleString('vi-VN')}</Text><Text style={styles.body}>Điểm đón: {ride.pickupAddress || '—'}</Text><Text style={styles.body}>Điểm đến: {ride.dropoffAddress || '—'}</Text><View style={styles.divider} /><View style={styles.priceRow}><Text style={styles.section}>Tổng thanh toán</Text><Text style={styles.price}>{new Intl.NumberFormat('vi-VN').format(ride.finalFare ?? ride.estimatedFare)} đ</Text></View></View> : error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.primary} />}
      <View style={styles.card}><Text style={styles.section}>Đánh giá chuyến đi</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityLabel={`${value} sao`} onPress={() => setStars(value)}><MaterialIcons name={value <= stars ? 'star' : 'star-border'} size={34} color={colors.tertiary} /></Pressable>)}</View><TextInput multiline value={comment} onChangeText={setComment} placeholder="Nhận xét (không bắt buộc)" style={styles.input} maxLength={2000} /><Text style={styles.counter}>{comment.length}/2000</Text></View>
      {ride && ride.status !== 'COMPLETED' ? <Text style={styles.error}>Chỉ có thể đánh giá chuyến đã hoàn thành.</Text> : null}
      <Pressable disabled={saving || !ride || ride.status !== 'COMPLETED' || !ride.driverId} onPress={() => void finish()} style={[styles.primary, (saving || !ride || ride.status !== 'COMPLETED' || !ride.driverId) && styles.disabled]}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Gửi đánh giá</Text>}</Pressable>
      <Pressable disabled={saving} onPress={() => void finish(true)} style={styles.skip}><Text style={styles.skipText}>Bỏ qua và về trang chủ</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
