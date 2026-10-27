import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/RouteSelectionScreenParts';
import { useRouteSelection } from '../hooks/useRouteSelection';
export default function RouteSelectionScreen() {
const { refreshVehicles, router, params, vehicles, activeRide, vehicleId, setVehicleId, pickupAddress, setPickupAddress, dropoffAddress, setDropoffAddress, loading, checkingRide, rideCheckError, resolving, vehicleError, continueToEstimate } = useRouteSelection();
return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Điểm đi và xe" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Nhập địa chỉ chính xác để hệ thống tính quãng đường và giá chuyến.</Text>
        {checkingRide ? <ActivityIndicator color={colors.primary} /> : null}
        {rideCheckError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>Không kiểm tra được chuyến đang hoạt động: {rideCheckError}</Text>
            <Pressable onPress={() => router.replace('/(tabs)/home')}><Text style={styles.link}>Về trang chủ và thử lại</Text></Pressable>
          </View>
        ) : null}
        {activeRide ? (
          <View style={styles.activeRideBox}>
            <Text style={styles.activeRideTitle}>Bạn đang có chuyến #{activeRide.id} hoạt động</Text>
            <Text style={styles.subtitle}>Theo dõi chuyến hiện tại trước khi đặt chuyến mới.</Text>
            <Pressable onPress={() => router.push({ pathname: '/ride/tracking', params: { rideId: String(activeRide.id) } })} style={styles.activeRideButton}>
              <Text style={styles.activeRideButtonText}>Theo dõi chuyến</Text>
            </Pressable>
          </View>
        ) : null}
        {params.voucherCode ? <Text style={styles.voucherTag}>Mã ưu đãi đã chọn: {Array.isArray(params.voucherCode) ? params.voucherCode[0] : params.voucherCode}</Text> : null}
        <View style={styles.addressCard}>
          <Text style={styles.label}>ĐIỂM ĐÓN</Text>
          <TextInput accessibilityLabel="Địa chỉ điểm đón" value={pickupAddress} onChangeText={setPickupAddress} placeholder="Số nhà, đường, phường, quận" maxLength={255} style={styles.input} />
          <View style={styles.divider} />
          <Text style={styles.label}>ĐIỂM ĐẾN</Text>
          <TextInput accessibilityLabel="Địa chỉ điểm đến" value={dropoffAddress} onChangeText={setDropoffAddress} placeholder="Số nhà, đường, phường, quận" maxLength={255} style={styles.input} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chọn xe của bạn</Text>
          <Pressable onPress={() => router.push('/add-vehicle')}><Text style={styles.link}>+ Thêm xe</Text></Pressable>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {vehicleError ? <View style={styles.errorBox}><Text style={styles.error}>{vehicleError}</Text><Pressable onPress={() => void refreshVehicles()}><Text style={styles.link}>Thử lại</Text></Pressable></View> : null}
        {!loading && vehicles.length === 0 ? <Text style={styles.empty}>Tài khoản chưa có xe. Thêm xe để tiếp tục.</Text> : null}
        {vehicles.map((vehicle) => {
          const selected = vehicle.id === vehicleId;
          return (
            <Pressable key={vehicle.id} onPress={() => setVehicleId(vehicle.id)} style={[styles.vehicle, selected && styles.vehicleSelected]}>
              <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={22} color={selected ? colors.primary : colors.outline} />
              <View style={styles.vehicleText}>
                <Text style={styles.vehicleName}>{[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicle.vehicle_type || 'Xe'}</Text>
                <Text style={styles.vehicleMeta}>{vehicle.plate_number || 'Chưa có biển số'} · {vehicle.transmission_type || 'Chưa rõ hộp số'} · {vehicle.vehicle_type || 'Chưa rõ loại xe'}</Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable disabled={resolving || loading || checkingRide || Boolean(rideCheckError) || Boolean(activeRide)} onPress={continueToEstimate} style={[styles.primaryButton, (resolving || loading || checkingRide || Boolean(rideCheckError) || Boolean(activeRide)) && styles.disabled]}>
          {resolving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Xác định lộ trình và giá</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
