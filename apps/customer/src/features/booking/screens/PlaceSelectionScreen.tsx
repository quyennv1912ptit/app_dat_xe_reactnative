import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingStyles as s } from '../components/bookingStyles';
import { usePlaceSelection } from '../hooks/usePlaceSelection';
import type { PlaceKind } from '../types';

export default function PlaceSelectionScreen({ kind }: { kind: PlaceKind }) {
  const h = usePlaceSelection(kind);
  const isPickup = kind === 'pickup';
  return <SafeAreaView style={[s.safe, s.white]} edges={['top', 'bottom']}>
    <ScreenHeader title={isPickup ? 'Chọn điểm đón' : 'Bạn muốn đến đâu?'} onBack={() => h.router.back()} />
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.page, { paddingBottom: 12 }]}>
        <Text style={s.label}>BƯỚC {isPickup ? '1' : '2'}/4 · {isPickup ? 'ĐIỂM ĐÓN' : 'ĐIỂM ĐẾN'}</Text>
        {!isPickup && h.pickup ? <View style={s.row}><MaterialIcons name="radio-button-checked" size={14} color="#12B76A" /><Text style={[s.muted, s.flex]} numberOfLines={1}>Từ {h.pickup.address}</Text></View> : null}
        <View style={s.searchBox}><MaterialIcons name="search" size={23} color={colors.primary} /><TextInput accessibilityLabel={isPickup ? 'Tìm điểm đón' : 'Tìm điểm đến'} autoFocus value={h.text} onChangeText={h.setText} placeholder="Tìm tên đường, địa chỉ, địa điểm…" maxLength={255} style={s.search} returnKeyType="search" />{h.text ? <Pressable accessibilityLabel="Xóa tìm kiếm" hitSlop={12} onPress={() => h.setText('')}><MaterialIcons name="cancel" size={20} color="#98A2B3" /></Pressable> : null}</View>
        <Pressable onPress={h.openMap} style={[s.row, { paddingVertical: 8 }]}><MaterialIcons name="map" size={23} color={colors.primary} /><Text style={s.link}>Chọn vị trí trên bản đồ</Text><MaterialIcons name="chevron-right" size={21} color={colors.primary} /></Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={s.flex}>
        {!h.text.trim() ? <>
          {isPickup ? <Pressable disabled={h.locating} onPress={() => void h.useCurrentLocation()} style={s.listItem}><View style={[s.icon, { backgroundColor: '#ECFDF3' }]}>{h.locating ? <ActivityIndicator /> : <MaterialIcons name="my-location" size={23} color="#039855" />}</View><View style={s.flex}><Text style={[s.text, { fontWeight: '600' }]}>Dùng vị trí hiện tại</Text><Text style={s.muted}>Xác định điểm đón bằng GPS</Text></View></Pressable> : null}
          {h.selected ? <Pressable onPress={() => h.select(h.selected!)} style={s.listItem}><MaterialIcons name="check-circle" size={24} color={colors.primary} /><View style={s.flex}><Text style={s.label}>ĐỊA ĐIỂM ĐÃ CHỌN</Text><Text style={s.text}>{h.selected.address}</Text></View><MaterialIcons name="chevron-right" size={22} color="#667085" /></Pressable> : null}
          {h.recentAddresses.length ? <Text style={[s.label, { margin: 20, marginBottom: 4 }]}>ĐỊA ĐIỂM GẦN ĐÂY</Text> : null}
          {h.recentAddresses.map(address => <Pressable key={address} onPress={() => h.setText(address)} style={s.listItem}><View style={s.icon}><MaterialIcons name="history" size={22} color="#667085" /></View><Text style={[s.text, s.flex]} numberOfLines={2}>{address}</Text></Pressable>)}
          {!h.recentAddresses.length && !h.selected ? <View style={s.empty}><MaterialIcons name="travel-explore" size={42} color="#98A2B3" /><Text style={s.muted}>Tìm địa chỉ hoặc chọn một vị trí trên bản đồ để tiếp tục.</Text></View> : null}
        </> : null}
        {h.loading ? <View style={s.empty}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>Đang tìm địa điểm…</Text></View> : null}
        {h.text.trim().length === 1 ? <Text style={[s.muted, { padding: 20 }]}>Nhập ít nhất 2 ký tự để tìm địa điểm.</Text> : null}
        {h.error || h.locationError ? <View style={[s.errorBox, { margin: 20 }]}><Text accessibilityRole="alert" style={s.error}>{h.error || h.locationError}</Text></View> : null}
        {!h.loading ? h.results.map(place => <Pressable key={place.id} accessibilityRole="button" disabled={h.selectingId !== null} onPress={() => void h.select(place)} style={s.listItem}><View style={s.icon}><MaterialIcons name="place" size={23} color={isPickup ? '#039855' : '#D92D20'} /></View><View style={s.flex}><Text style={[s.text, { fontWeight: '600' }]}>{place.name}</Text><Text style={s.muted}>{place.address}</Text>{place.secondaryAddress ? <Text style={s.muted}>Địa chỉ trước đây: {place.secondaryAddress}</Text> : null}{h.selectingId === place.id ? <Text style={s.link}>Đang xác định vị trí chính xác…</Text> : null}</View>{h.selectingId === place.id ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="north-west" size={19} color="#98A2B3" />}</Pressable>) : null}
        {h.limitedCoverage && !h.loading && !h.error && h.results.length > 0 ? <Text style={[s.muted, { padding: 20 }]}>Chưa thấy đúng địa chỉ? Nhập thêm số nhà, ngõ/ngách, quận hoặc chọn vị trí trên bản đồ.</Text> : null}
        {h.text.trim().length >= 2 && !h.loading && !h.error && !h.results.length ? <View style={s.empty}><MaterialIcons name="search-off" size={36} color="#98A2B3" /><Text style={s.section}>Chưa tìm thấy địa điểm</Text><Text style={s.muted}>Thử thêm tên đường, quận hoặc thành phố, hoặc chọn trên bản đồ.</Text></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
