import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Image,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Metric,styles } from '../components/VehicleInspectionScreenParts';
import { useVehicleInspection } from '../hooks/useVehicleInspection';
export default function VehicleInspectionScreen() {
const { router, phase, ride, loading, saving, error, report, confirm } = useVehicleInspection();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Biên bản bàn giao" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>{phase === 'PICKUP' ? 'Kiểm tra hiện trạng trước khi bắt đầu chuyến.' : 'Kiểm tra hiện trạng khi tài xế hoàn trả xe.'}</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {ride ? <View style={styles.card}>
          <Text style={styles.section}>Chuyến #{ride.id} · {phase === 'PICKUP' ? 'Bàn giao lúc đón' : 'Hoàn trả tại điểm đến'}</Text>
          <Text style={styles.meta}>Trạng thái: {ride.status}</Text>
          {report ? <>
            <View style={styles.metrics}>
              <Metric label="Odometer" value={`${report.odometer.toLocaleString('vi-VN')} km`} />
              {report.fuelLevel !== null ? <Metric label="Nhiên liệu" value={`${report.fuelLevel}%`} /> : null}
            </View>
            {report.notes ? <Text style={styles.body}>{report.notes}</Text> : null}
            <Text style={styles.label}>Ảnh do tài xế gửi ({report.photos.length})</Text>
            {report.photos.length ? <View style={styles.images}>{report.photos.map((photo) => <View key={photo.id} style={styles.imageCard}><Image source={{ uri: photo.fileUrl }} style={styles.image} /><Text style={styles.imageLabel}>{photo.angle}</Text></View>)}</View> : <Text style={styles.meta}>Biên bản không có ảnh.</Text>}
            {report.confirmedByCustomer ? <View style={styles.confirmed}><MaterialIcons name="verified" size={20} color={colors.primary} /><Text style={styles.confirmedText}>Bạn đã xác nhận biên bản này.</Text></View> : null}
          </> : <Text style={styles.error}>Tài xế chưa gửi biên bản {phase === 'PICKUP' ? 'nhận xe' : 'trả xe'} lên backend.</Text>}
        </View> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {report && !report.confirmedByCustomer ? <Pressable disabled={saving} onPress={() => void confirm()} style={[styles.primary, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Xác nhận tình trạng xe</Text>}
        </Pressable> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
