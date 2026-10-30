import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles, useThemeColor  } from '@datxe/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingStyles as base_s } from '../components/bookingStyles';
import { usePlaceSelection } from '../hooks/usePlaceSelection';
import type { PlaceKind } from '../types';

export default function PlaceSelectionScreen({ kind }: { kind: PlaceKind }) {
 useLanguage();

 const colors=useThemeColors();

 const s=useThemedStyles(base_s);
 const themeColor=useThemeColor();

  const h = usePlaceSelection(kind);
  const isPickup = kind === 'pickup';
  return <SafeAreaView style={[s.safe, s.white]} edges={['top', 'bottom']}>
    <ScreenHeader title={i18nT(isPickup ? 'Chọn điểm đón' : 'Bạn muốn đến đâu?')} onBack={() => h.router.back()} />
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.page, { paddingBottom: 12 }]}>
        <Text style={s.label}>{i18nT("BƯỚC")}{' '}{i18nT(isPickup ? '1' : '2')}/4 · {i18nT(isPickup ? 'ĐIỂM ĐÓN' : 'ĐIỂM ĐẾN')}</Text>
        {!isPickup && h.pickup ? <View style={s.row}><MaterialIcons name="radio-button-checked" size={14} color={themeColor("#12B76A","color")} /><Text style={[s.muted, s.flex]} numberOfLines={1}>{i18nT("Từ")}{' '}{h.pickup.address}</Text></View> : null}
        <View style={s.searchBox}><MaterialIcons name="search" size={23} color={colors.primary} /><TextInput accessibilityLabel={i18nT(isPickup ? 'Tìm điểm đón' : 'Tìm điểm đến')} autoFocus value={h.text} onChangeText={h.setText} placeholder={i18nT("Tìm tên đường, địa chỉ, địa điểm…")} maxLength={255} style={s.search} returnKeyType="search" />{h.text ? <Pressable accessibilityLabel={i18nT("Xóa tìm kiếm")} hitSlop={12} onPress={() => h.setText('')}><MaterialIcons name="cancel" size={20} color={themeColor("#98A2B3","color")} /></Pressable> : null}</View>
        <Pressable onPress={h.openMap} style={[s.row, { paddingVertical: 8 }]}><MaterialIcons name="map" size={23} color={colors.primary} /><Text style={s.link}>{i18nT("Chọn vị trí trên bản đồ")}</Text><MaterialIcons name="chevron-right" size={21} color={colors.primary} /></Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={s.flex}>
        {!h.text.trim() ? <>
 {h.savedPlaces.map(place=><Pressable key={place.id} onPress={()=>void h.select(place)} style={s.listItem}><MaterialIcons name={place.name==='Nhà'?'home':place.name==='Cơ quan'?'work':'star'} size={24} color={colors.primary}/><View style={s.flex}><Text style={s.text}>{i18nT(place.name)}</Text><Text style={s.muted}>{place.address}</Text></View></Pressable>)}

          {isPickup ? <Pressable disabled={h.locating} onPress={() => void h.useCurrentLocation()} style={s.listItem}><View style={[s.icon, { backgroundColor: themeColor("#ECFDF3","backgroundColor") }]}>{h.locating ? <ActivityIndicator /> : <MaterialIcons name="my-location" size={23} color={themeColor("#039855","color")} />}</View><View style={s.flex}><Text style={[s.text, { fontWeight: '600' }]}>{i18nT("Dùng vị trí hiện tại")}</Text><Text style={s.muted}>{i18nT("Xác định điểm đón bằng GPS")}</Text></View></Pressable> : null}
          {h.selected ? <Pressable onPress={() => h.select(h.selected!)} style={s.listItem}><MaterialIcons name="check-circle" size={24} color={colors.primary} /><View style={s.flex}><Text style={s.label}>{i18nT("ĐỊA ĐIỂM ĐÃ CHỌN")}</Text><Text style={s.text}>{h.selected.address}</Text></View><MaterialIcons name="chevron-right" size={22} color={themeColor("#667085","color")} /></Pressable> : null}
          {h.recentAddresses.length ? <Text style={[s.label, { margin: 20, marginBottom: 4 }]}>{i18nT("ĐỊA ĐIỂM GẦN ĐÂY")}</Text> : null}
          {h.recentAddresses.map(address => <Pressable key={address} onPress={() => h.setText(address)} style={s.listItem}><View style={s.icon}><MaterialIcons name="history" size={22} color={themeColor("#667085","color")} /></View><Text style={[s.text, s.flex]} numberOfLines={2}>{address}</Text></Pressable>)}
          {!h.recentAddresses.length && !h.selected ? <View style={s.empty}><MaterialIcons name="travel-explore" size={42} color={themeColor("#98A2B3","color")} /><Text style={s.muted}>{i18nT("Tìm địa chỉ hoặc chọn một vị trí trên bản đồ để tiếp tục.")}</Text></View> : null}
        </> : null}
        {h.loading ? <View style={s.empty}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>{i18nT("Đang tìm địa điểm…")}</Text></View> : null}
        {h.text.trim().length === 1 ? <Text style={[s.muted, { padding: 20 }]}>{i18nT("Nhập ít nhất 2 ký tự để tìm địa điểm.")}</Text> : null}
        {h.error || h.locationError ? <View style={[s.errorBox, { margin: 20 }]}><Text accessibilityRole="alert" style={s.error}>{i18nT(h.error || h.locationError)}</Text></View> : null}
        {!h.loading ? h.results.map(place => <Pressable key={place.id} accessibilityRole="button" disabled={h.selectingId !== null} onPress={() => void h.select(place)} style={s.listItem}><View style={s.icon}><MaterialIcons name="place" size={23} color={isPickup ? '#039855' : '#D92D20'} /></View><View style={s.flex}><Text style={[s.text, { fontWeight: '600' }]}>{place.name}</Text><Text style={s.muted}>{place.address}</Text>{place.secondaryAddress ? <Text style={s.muted}>{i18nT("Địa chỉ trước đây:")}{' '}{place.secondaryAddress}</Text> : null}{h.selectingId === place.id ? <Text style={s.link}>{i18nT("Đang xác định vị trí chính xác…")}</Text> : null}</View>{h.selectingId === place.id ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="north-west" size={19} color={themeColor("#98A2B3","color")} />}</Pressable>) : null}
        {h.limitedCoverage && !h.loading && !h.error && h.results.length > 0 ? <Text style={[s.muted, { padding: 20 }]}>{i18nT("Chưa thấy đúng địa chỉ? Nhập thêm số nhà, ngõ/ngách, quận hoặc chọn vị trí trên bản đồ.")}</Text> : null}
        {h.text.trim().length >= 2 && !h.loading && !h.error && !h.results.length ? <View style={s.empty}><MaterialIcons name="search-off" size={36} color={themeColor("#98A2B3","color")} /><Text style={s.section}>{i18nT("Chưa tìm thấy địa điểm")}</Text><Text style={s.muted}>{i18nT("Thử thêm tên đường, quận hoặc thành phố, hoặc chọn trên bản đồ.")}</Text></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
