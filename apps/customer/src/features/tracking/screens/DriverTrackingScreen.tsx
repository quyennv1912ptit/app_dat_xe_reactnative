import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action,cancellableStatuses,chatStatuses,rideStatusLabel,styles } from '../components/DriverTrackingScreenParts';
import { useDriverTracking } from '../hooks/useDriverTracking';
import { BookingMap } from '@/components/map/BookingMap';
export default function DriverTrackingScreen() {
const { router, ride, vehicle, error, cancelling, refresh, pendingPickup, pendingDropoff, cancel, live } = useDriverTracking();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Theo dõi chuyến" backAccessibilityLabel="Mở chi tiết chuyến" onBack={() => ride && router.replace({ pathname: '/ride/[id]', params: { id: String(ride.id), rideId: String(ride.id), returnTo: 'home' } })} />
      <ScrollView contentContainerStyle={styles.content}>
        {!ride ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.meta}>Đang tải chuyến…</Text></View> : <>
          {ride.pickup.lat !== null && ride.pickup.lng !== null && ride.dropoff.lat !== null && ride.dropoff.lng !== null ? <View style={{ height: 300, borderRadius: 20, overflow: 'hidden' }}><BookingMap center={{ lat: ride.pickup.lat, lng: ride.pickup.lng }} pickup={{ coordinate: { lat: ride.pickup.lat, lng: ride.pickup.lng } }} dropoff={{ coordinate: { lat: ride.dropoff.lat, lng: ride.dropoff.lng } }} route={ride.route?.coordinates} driver={live.sample?.location} /></View> : null}
          {ride.driverId ? <View style={styles.card}><Text accessibilityRole="alert" style={[styles.body, live.signalLost && { color: '#B42318' }]}>{live.signalLost ? 'Mất tín hiệu vị trí tài xế' : live.sample ? 'Vị trí tài xế đang cập nhật trực tiếp' : 'Đang chờ vị trí tài xế…'}</Text>{live.sample ? <Text style={styles.meta}>GPS ±{Math.round(live.sample.accuracy)} m · Cập nhật {new Date(live.sample.timestamp).toLocaleTimeString('vi-VN')}</Text> : null}</View> : null}
          <View style={styles.statusCard}><MaterialIcons name="directions-car" size={30} color={colors.primary} /><Text style={styles.status}>{rideStatusLabel[ride.status] ?? ride.status}</Text><Text style={styles.meta}>Mã chuyến #{ride.id} · Cập nhật {new Date(ride.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>{ride.type === 'SCHEDULED' && ride.scheduledAt ? <Text style={styles.meta}>Giờ hẹn: {new Date(ride.scheduledAt).toLocaleString('vi-VN')}</Text> : null}</View>
          <View style={styles.card}>
            <Text style={styles.section}>Thông tin tài xế</Text>
            <Text style={styles.body}>{ride.driverId ? `Tài xế #${ride.driverId} đã được phân công.` : 'Backend chưa phân công tài xế cho chuyến này.'}</Text>
            <Text style={styles.note}>Chấm xanh trên bản đồ là vị trí gần nhất tài xế gửi trong chuyến này.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Xe của bạn</Text>
            <Text style={styles.body}>{vehicle ? [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicle.vehicle_type || 'Xe' : `Phương tiện #${ride.vehicleId}`}</Text>
            <Text style={styles.meta}>{vehicle?.plate_number || 'Chưa có biển số'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Lộ trình</Text>
            <Text style={styles.label}>ĐIỂM ĐÓN</Text><Text style={styles.body}>{ride.pickupAddress || 'Không có địa chỉ'}</Text>
            <View style={styles.divider} /><Text style={styles.label}>ĐIỂM ĐẾN</Text><Text style={styles.body}>{ride.dropoffAddress || 'Không có địa chỉ'}</Text>
            <Text style={styles.meta}>Giá dự kiến: {new Intl.NumberFormat('vi-VN').format(ride.estimatedFare)} đ</Text>
          </View>
          {ride.driverId && chatStatuses.includes(ride.status) ? <Action
            label={ride.unreadChatCount > 0 ? `Nhắn tin với tài xế · ${ride.unreadChatCount} tin chưa đọc` : 'Nhắn tin với tài xế'}
            onPress={() => router.push({ pathname: '/chat', params: { rideId: String(ride.id) } } as never)}
          /> : null}
          {pendingPickup ? <Action label="Xem và xác nhận bàn giao lúc đón" onPress={() => router.push({ pathname: '/vehicle-inspection', params: { rideId: String(ride.id), phase: 'pickup' } })} /> : null}
          {pendingDropoff ? <Action label="Xem và xác nhận hoàn trả xe" onPress={() => router.push({ pathname: '/vehicle-inspection', params: { rideId: String(ride.id), phase: 'dropoff' } })} /> : null}
          {['CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED'].includes(ride.status) ? <Action label="Về trang chủ" onPress={() => router.replace('/(tabs)/home')} /> : null}
          <Pressable onPress={() => void refresh()} style={styles.secondary}><Text style={styles.secondaryText}>Làm mới trạng thái</Text></Pressable>
          {cancellableStatuses.includes(ride.status) ? <Pressable disabled={cancelling} onPress={cancel} style={styles.cancel}>{cancelling ? <ActivityIndicator color={colors.error} /> : <Text style={styles.cancelText}>Hủy chuyến</Text>}</Pressable> : null}
        </>}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
