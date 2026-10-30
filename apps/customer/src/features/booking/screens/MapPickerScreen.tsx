import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles, useThemeColor  } from '@datxe/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingMap } from '@/components/map/BookingMap';
import { bookingStyles as base_s } from '../components/bookingStyles';
import { useMapPicker } from '../hooks/useMapPicker';
export default function MapPickerScreen() {
 useLanguage();

 const colors=useThemeColors();

 const s=useThemedStyles(base_s);
 const themeColor=useThemeColor();

  const h = useMapPicker();
  const pickup = h.kind === 'pickup';
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <ScreenHeader title={i18nT(pickup ? 'Đặt ghim điểm đón' : 'Đặt ghim điểm đến')} onBack={() => h.router.back()} />
    <View style={s.flex}>
      <BookingMap center={h.center} editablePin onCenterChange={h.movePin} onReadyChange={h.setMapReady} onMovingChange={h.setMapMoving} />
      {h.mapReady ? <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', width: 48, height: 48, marginLeft: -24, marginTop: -44 }}><MaterialIcons name="location-pin" size={48} color={pickup ? '#00AA5B' : '#F04438'} /></View> : null}
      <Pressable accessibilityLabel={i18nT("Đưa bản đồ về vị trí hiện tại")} onPress={() => void h.recenter()} style={[s.icon, { position: 'absolute', right: 20, bottom: 20, backgroundColor: themeColor("#FFFFFF","backgroundColor"), elevation: 4 }]}>{h.locating ? <ActivityIndicator /> : <MaterialIcons name="my-location" size={24} color={colors.primary} />}</Pressable>
      {h.mapReady ? <View pointerEvents="none" style={{ position: 'absolute', top: 16, alignSelf: 'center', backgroundColor: themeColor("#182230E6","backgroundColor"), borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9 }}><Text style={{ color: themeColor("#FFFFFF","color"), fontSize: 13 }}>{i18nT("Di chuyển bản đồ, thả tay để chọn vị trí")}</Text></View> : null}
    </View>
    <View style={[s.sheet, { height: 260 }]}><View style={s.handle} /><Text style={s.label}>{i18nT(pickup ? 'ĐIỂM ĐÓN ĐÃ GHIM' : 'ĐIỂM ĐẾN ĐÃ GHIM')}</Text>{h.resolving ? <View style={s.row}><ActivityIndicator /><Text style={s.muted}>{i18nT("Đang xác định địa chỉ…")}</Text></View> : <><Text numberOfLines={1} style={s.section}>{i18nT(h.place?.name ?? 'Chọn vị trí trên bản đồ')}</Text><Text numberOfLines={2} style={s.muted}>{h.place?.address ?? i18nT('Địa chỉ sẽ hiện khi bạn đặt ghim.')}</Text></>}{h.error ? <Text accessibilityRole="alert" style={s.error}>{i18nT(h.error)}</Text> : null}<Pressable disabled={!h.canConfirm} onPress={h.confirm} style={[s.primary, !h.canConfirm && s.disabled]}><Text style={s.primaryText}>{i18nT("Xác nhận")}{' '}{i18nT(pickup ? 'điểm đón' : 'điểm đến')}</Text></Pressable><Pressable onPress={() => h.router.back()} style={{ alignItems: 'center', padding: 5 }}><Text style={s.link}>{i18nT("Tìm địa chỉ bằng tên")}</Text></Pressable></View>
  </SafeAreaView>;
}
