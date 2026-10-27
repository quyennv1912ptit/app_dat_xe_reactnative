import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Image,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatStatuses,Row,statusLabel,styles } from '../components/RideDetailScreenParts';
import { useRideDetail } from '../hooks/useRideDetail';
export default function RideDetailScreen() {
const { router, ride, error, goBack } = useRideDetail();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader title="Chi tiết chuyến" onBack={goBack} />
    <ScrollView contentContainerStyle={styles.content}>
      {!ride && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {ride ? <>
        <View style={styles.card}><Text style={styles.heading}>Chuyến #{ride.id}</Text><Text style={styles.body}>Trạng thái: {statusLabel(ride.status)}</Text><Text style={styles.meta}>{ride.type === 'INSTANT' ? 'Chuyến ngay' : `Chuyến đặt lịch${ride.scheduledAt ? ` · ${new Date(ride.scheduledAt).toLocaleString('vi-VN')}` : ''}`} · {new Date(ride.createdAt).toLocaleString('vi-VN')}</Text></View>
        <View style={styles.card}><Text style={styles.section}>Lộ trình</Text><Text style={styles.label}>ĐIỂM ĐÓN</Text><Text style={styles.body}>{ride.pickupAddress || 'Không có địa chỉ'}</Text><View style={styles.divider} /><Text style={styles.label}>ĐIỂM ĐẾN</Text><Text style={styles.body}>{ride.dropoffAddress || 'Không có địa chỉ'}</Text><Text style={styles.meta}>{ride.distanceKm === null ? 'Khoảng cách chưa có' : `${ride.distanceKm} km`}</Text></View>
        <View style={styles.card}><Text style={styles.section}>Thanh toán</Text><Row label="Giá ước tính" value={`${ride.estimatedFare.toLocaleString('vi-VN')} đ`} />{ride.finalFare !== null ? <Row label="Giá cuối cùng" value={`${ride.finalFare.toLocaleString('vi-VN')} đ`} /> : null}{ride.discountAmount ? <Row label="Giảm giá" value={`${ride.discountAmount.toLocaleString('vi-VN')} đ`} /> : null}</View>
        <View style={styles.card}><Text style={styles.section}>Trạng thái chuyến</Text>{ride.statusHistory.map((entry) => <View key={entry.id} style={styles.historyRow}><View style={styles.historyDot} /><View style={styles.historyCopy}><Text style={styles.body}>{statusLabel(entry.toStatus)}</Text><Text style={styles.meta}>{new Date(entry.createdAt).toLocaleString('vi-VN')} · {entry.actorRole || 'SYSTEM'}{entry.note ? ` · ${entry.note}` : ''}</Text></View></View>)}</View>
        {ride.handoverReports.map((report) => <View key={report.id} style={styles.card}><Text style={styles.section}>Biên bản {report.phase === 'PICKUP' ? 'nhận xe' : 'trả xe'}</Text><Text style={styles.meta}>Odometer {report.odometer.toLocaleString('vi-VN')} km{report.fuelLevel === null ? '' : ` · Nhiên liệu ${report.fuelLevel}%`}</Text>{report.notes ? <Text style={styles.body}>{report.notes}</Text> : null}<Text style={styles.meta}>{report.confirmedByCustomer ? 'Đã được bạn xác nhận' : 'Chưa được bạn xác nhận'}</Text><View style={styles.images}>{report.photos.map((photo) => <Image key={photo.id} source={{ uri: photo.fileUrl }} style={styles.image} />)}</View></View>)}
        {!['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED'].includes(ride.status) ? <Pressable onPress={() => router.push({ pathname: '/ride/tracking', params: { rideId: String(ride.id) } })} style={styles.primary}><Text style={styles.primaryText}>Theo dõi chuyến</Text></Pressable> : null}
        {ride.driverId && chatStatuses.includes(ride.status) ? <Pressable onPress={() => router.push({ pathname: '/chat', params: { rideId: String(ride.id) } } as never)} style={styles.secondary}><MaterialIcons name="chat" size={20} color={colors.primary} /><Text style={styles.secondaryText}>{ride.unreadChatCount > 0 ? `Nhắn tài xế · ${ride.unreadChatCount} tin chưa đọc` : 'Nhắn tin với tài xế'}</Text></Pressable> : null}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}
