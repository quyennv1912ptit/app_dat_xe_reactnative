import { HeaderIconButton,ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator,Image,Pressable,ScrollView,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/CustomerVehiclesScreenParts';
import { useCustomerVehicles } from '../hooks/useCustomerVehicles';
export default function CustomerVehiclesScreen() {
const { router, vehicles, loading, error, deletingId, remove } = useCustomerVehicles();
return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScreenHeader title="Xe của tôi" onBack={() => router.back()} rightContent={<HeaderIconButton icon="add" accessibilityLabel="Thêm xe" onPress={() => router.push('/add-vehicle')} tone="primary" />} />
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && vehicles.length === 0 ? <View style={styles.empty}><MaterialIcons name="directions-car" size={38} color={colors.primary} /><Text style={styles.heading}>Chưa có phương tiện</Text><Text style={styles.meta}>Thêm xe để chọn khi tạo chuyến đi.</Text></View> : null}
      {vehicles.map((vehicle) => <View key={vehicle.id} style={styles.vehicle}>
        {vehicle.images[0]?.secure_url ? <Image source={{ uri: vehicle.images[0].secure_url }} style={styles.image} /> : <View style={styles.imagePlaceholder}><MaterialIcons name="directions-car" size={28} color={colors.primary} /></View>}
        <Pressable onPress={() => router.push({ pathname: '/add-vehicle', params: { vehicleId: String(vehicle.id) } })} style={styles.details}><Text style={styles.name}>{[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicle.vehicle_type || 'Phương tiện'}</Text><Text style={styles.plate}>{vehicle.plate_number || 'Chưa có biển số'}</Text><Text style={styles.meta}>{vehicle.vehicle_type || '—'} · {vehicle.transmission_type || '—'}{vehicle.color ? ` · ${vehicle.color}` : ''}{vehicle.engine_cc ? ` · ${vehicle.engine_cc} cc` : ''}</Text></Pressable>
        <Pressable accessibilityLabel={`Xóa ${vehicle.plate_number || 'xe'}`} disabled={deletingId === vehicle.id} onPress={() => remove(vehicle)} style={styles.delete}>{deletingId === vehicle.id ? <ActivityIndicator color={colors.error} /> : <MaterialIcons name="delete-outline" size={23} color={colors.error} />}</Pressable>
      </View>)}
      <Pressable onPress={() => router.push('/add-vehicle')} style={styles.add}><MaterialIcons name="add" size={20} color={colors.onPrimary} /><Text style={styles.addText}>Thêm xe mới</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
