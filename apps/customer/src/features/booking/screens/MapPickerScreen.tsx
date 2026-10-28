import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingMap } from '@/components/map/BookingMap';
import { bookingStyles as s } from '../components/bookingStyles';
import { useMapPicker } from '../hooks/useMapPicker';
export default function MapPickerScreen() {
  const h = useMapPicker();
  const pickup = h.kind === 'pickup';
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <ScreenHeader title={pickup ? 'Đặt ghim điểm đón' : 'Đặt ghim điểm đến'} onBack={() => h.router.back()} />
    <View style={s.flex}>
      <BookingMap center={h.center} onCenterChange={h.movePin} onReadyChange={h.setMapReady} />
      {h.mapReady ? <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -22, marginTop: -44, alignItems: 'center' }}><MaterialIcons name="location-pin" size={44} color={pickup ? '#12B76A' : '#F04438'} /><View style={{ width: 8, height: 4, marginTop: -5, borderRadius: 4, backgroundColor: '#34405466' }} /></View> : null}
      <Pressable accessibilityLabel="Đưa bản đồ về vị trí hiện tại" onPress={() => void h.recenter()} style={[s.icon, { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#FFFFFF', elevation: 4 }]}>{h.locating ? <ActivityIndicator /> : <MaterialIcons name="my-location" size={24} color={colors.primary} />}</Pressable>
      {h.mapReady ? <View pointerEvents="none" style={{ position: 'absolute', top: 16, alignSelf: 'center', backgroundColor: '#182230E6', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9 }}><Text style={{ color: '#FFFFFF', fontSize: 13 }}>Di chuyển bản đồ để đặt ghim chính xác</Text></View> : null}
    </View>
    <View style={s.sheet}><View style={s.handle} /><Text style={s.label}>{pickup ? 'ĐIỂM ĐÓN ĐÃ GHIM' : 'ĐIỂM ĐẾN ĐÃ GHIM'}</Text>{h.resolving ? <View style={s.row}><ActivityIndicator /><Text style={s.muted}>Đang xác định địa chỉ…</Text></View> : <><Text style={s.section}>{h.place?.name ?? 'Chọn vị trí trên bản đồ'}</Text><Text style={s.muted}>{h.place?.address ?? 'Địa chỉ sẽ hiện khi bạn đặt ghim.'}</Text></>}{h.error ? <Text accessibilityRole="alert" style={s.error}>{h.error}</Text> : null}<Pressable disabled={!h.canConfirm} onPress={h.confirm} style={[s.primary, !h.canConfirm && s.disabled]}><Text style={s.primaryText}>Xác nhận {pickup ? 'điểm đón' : 'điểm đến'}</Text></Pressable><Pressable onPress={() => h.router.back()} style={{ alignItems: 'center', padding: 5 }}><Text style={s.link}>Tìm địa chỉ bằng tên</Text></Pressable></View>
  </SafeAreaView>;
}
