import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { statusText,styles } from '../components/FindDriverScreenParts';
import { useFindDriver } from '../hooks/useFindDriver';
export default function FindDriverScreen() {
const { router, ride, error, cancelling, refresh, cancel } = useFindDriver();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Tìm tài xế" backAccessibilityLabel="Về trang chủ" onBack={() => router.replace('/(tabs)/home')} />
      <View style={styles.content}>
        <View style={styles.icon}><MaterialIcons name="search" size={40} color={colors.primary} /></View>
        <Text style={styles.status}>{ride ? ride.type === 'SCHEDULED' && ride.status === 'PENDING' ? 'Đã đặt lịch, đang chờ đến giờ tìm tài xế' : statusText[ride.status] ?? ride.status : 'Đang tải trạng thái chuyến'}</Text>
        {ride ? <Text style={styles.meta}>Mã chuyến #{ride.id} · {ride.type === 'INSTANT' ? 'Chuyến ngay' : `Đón lúc ${ride.scheduledAt ? new Date(ride.scheduledAt).toLocaleString('vi-VN') : 'theo lịch đã đặt'}`}</Text> : <ActivityIndicator color={colors.primary} />}
        {ride ? <View style={styles.route}>
          <Text style={styles.label}>ĐIỂM ĐÓN</Text><Text style={styles.address}>{ride.pickupAddress || 'Backend chưa có địa chỉ điểm đón'}</Text>
          <View style={styles.divider} /><Text style={styles.label}>ĐIỂM ĐẾN</Text><Text style={styles.address}>{ride.dropoffAddress || 'Backend chưa có địa chỉ điểm đến'}</Text>
        </View> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={() => void refresh()} style={styles.secondary}><Text style={styles.secondaryText}>Cập nhật trạng thái</Text></Pressable>
        <Pressable disabled={!ride || cancelling || !['PENDING', 'SEARCHING'].includes(ride.status)} onPress={cancel} style={[styles.cancel, (!ride || cancelling || !['PENDING', 'SEARCHING'].includes(ride.status)) && styles.disabled]}>
          {cancelling ? <ActivityIndicator color={colors.error} /> : <Text style={styles.cancelText}>Hủy yêu cầu</Text>}
        </Pressable>
        {ride && ['NO_DRIVER_FOUND', 'EXPIRED', 'CANCELLED'].includes(ride.status) ? <Pressable onPress={() => router.replace('/(tabs)/home')} style={styles.secondary}><Text style={styles.secondaryText}>Về trang chủ</Text></Pressable> : null}
      </View>
    </SafeAreaView>
  );
}
