import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles, useThemeColor  } from '@datxe/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';
import { BookingMap } from '@/components/map/BookingMap';
import { bookingStyles as base_s } from '../components/bookingStyles';
import { RouteSummary } from '../components/RouteSummary';
import { useVehicleSelection } from '../hooks/useVehicleSelection';
export default function VehicleSelectionScreen() {
 useLanguage();

 const colors=useThemeColors();

 const s=useThemedStyles(base_s);
 const themeColor=useThemeColor();

  const h = useVehicleSelection();
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <ScreenHeader title={i18nT("Chọn phương tiện")} onBack={() => h.router.back()} />
    <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={{ height: 190, overflow: 'hidden' }}><BookingMap key={`${h.draft.pickup?.id}-${h.draft.dropoff?.id}`} center={h.draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER} pickup={h.draft.pickup} dropoff={h.draft.dropoff} interactive={false} /></View>
      <View style={s.page}>
        <Text style={s.label}>{i18nT("BƯỚC 3/4 · PHƯƠNG TIỆN CỦA BẠN")}</Text>
        <RouteSummary pickup={h.draft.pickup} dropoff={h.draft.dropoff} onPickup={() => h.router.push('/ride/pickup')} onDropoff={() => h.router.push('/ride/destination')} />
        <View style={s.between}><View style={s.flex}><Text style={s.section}>{i18nT("Tài xế sẽ lái xe nào?")}</Text><Text style={s.muted}>{i18nT("Chọn phương tiện bạn cần được lái hộ.")}</Text></View><Pressable onPress={() => h.router.push('/add-vehicle')} hitSlop={8}><Text style={s.link}>{i18nT("+ Thêm xe")}</Text></Pressable></View>
        {h.loading ? <ActivityIndicator color={colors.primary} /> : null}
        {h.error ? <View style={s.errorBox}><Text style={s.error}>{i18nT(h.error)}</Text><Pressable onPress={h.refresh}><Text style={s.link}>{i18nT("Thử lại")}</Text></Pressable></View> : null}
        {h.activeRide ? <View style={s.errorBox}><Text style={s.text}>{i18nT("Bạn đang có một chuyến chưa hoàn tất.")}</Text><Pressable onPress={() => h.router.push({ pathname: '/ride/tracking', params: { rideId: String(h.activeRide!.id) } })}><Text style={s.link}>{i18nT("Xem chuyến đang diễn ra")}</Text></Pressable></View> : null}
        {!h.draft.pickup || !h.draft.dropoff ? <View style={s.errorBox}><Text style={s.error}>{i18nT("Hãy chọn đủ điểm đón và điểm đến để tiếp tục.")}</Text><Pressable onPress={() => h.router.push(h.draft.pickup ? '/ride/destination' : '/ride/pickup')}><Text style={s.link}>{i18nT("Chọn địa điểm")}</Text></Pressable></View> : null}
        {h.vehicles.map(vehicle => <Pressable key={vehicle.id} onPress={() => h.setSelectedId(vehicle.id)} style={[s.card, s.row, h.selected?.id === vehicle.id && s.selected]} accessibilityRole="radio" accessibilityState={{ selected: h.selected?.id === vehicle.id }}>
          <View style={[s.icon, { width: 56, height: 56 }]}><MaterialIcons name={vehicle.vehicle_type === 'MOTORCYCLE' ? 'two-wheeler' : 'directions-car'} size={32} color={colors.primary} /></View>
          <View style={s.flex}><Text style={[s.text, { fontWeight: '700' }]}>{i18nT([vehicle.brand, vehicle.model].filter(Boolean).join(' ') || (vehicle.vehicle_type === 'MOTORCYCLE' ? 'Xe máy' : 'Ô tô'))}</Text><Text style={[s.text, { letterSpacing: 1 }]}>{vehicle.plate_number || i18nT('Chưa có biển số')}</Text><Text style={s.muted}>{i18nT(vehicle.transmission_type === 'AUTO' ? 'Số tự động' : vehicle.transmission_type === 'MANUAL' ? 'Số sàn' : 'Chưa rõ hộp số')}{i18nT(vehicle.color ? ` · ${vehicle.color}` : '')}</Text></View>
          <MaterialIcons name={h.selected?.id === vehicle.id ? 'radio-button-checked' : 'radio-button-unchecked'} size={23} color={h.selected?.id === vehicle.id ? colors.primary : '#98A2B3'} />
        </Pressable>)}
        {!h.loading && !h.error && !h.vehicles.length ? <View style={[s.card, s.empty]}><MaterialIcons name="add-road" size={42} color={themeColor("#98A2B3","color")} /><Text style={s.section}>{i18nT("Bạn chưa thêm phương tiện")}</Text><Text style={s.muted}>{i18nT("Thêm xe của bạn để xem giá chuyến lái hộ.")}</Text><Pressable onPress={() => h.router.push('/add-vehicle')}><Text style={s.link}>{i18nT("Thêm phương tiện đầu tiên")}</Text></Pressable></View> : null}
      </View>
    </ScrollView>
    <View style={s.footer}><Pressable disabled={!h.canContinue} onPress={h.continueBooking} style={[s.primary, !h.canContinue && s.disabled]}><Text style={s.primaryText}>{i18nT("Tiếp tục · Xem giá chuyến")}</Text><MaterialIcons name="arrow-forward" size={20} color={themeColor("#FFFFFF","color")} /></Pressable></View>
  </SafeAreaView>;
}
