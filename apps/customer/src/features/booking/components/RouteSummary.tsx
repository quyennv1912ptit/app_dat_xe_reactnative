import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemedStyles, useThemeColor } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { BookingPlace } from '../types';
import { bookingStyles as base_s } from './bookingStyles';
export function RouteSummary({ pickup, dropoff, onPickup, onDropoff }: { pickup: BookingPlace | null; dropoff: BookingPlace | null; onPickup?: () => void; onDropoff?: () => void }) {
 useLanguage();

 const s=useThemedStyles(base_s);
 const themeColor=useThemeColor();

  return <View style={s.card}>{([{ place: pickup, label: 'ĐIỂM ĐÓN', color: themeColor("#12B76A","color"), onPress: onPickup }, { place: dropoff, label: 'ĐIỂM ĐẾN', color: themeColor("#F04438","color"), onPress: onDropoff }]).map((item, index) => <View key={item.label}>{index ? <View style={[s.divider, { marginLeft: 34 }]} /> : null}<Pressable disabled={!item.onPress} accessibilityRole={item.onPress ? 'button' : undefined} onPress={item.onPress} style={[s.row, { paddingVertical: 4 }]}><MaterialIcons name={index ? 'place' : 'radio-button-checked'} size={22} color={item.color} /><View style={s.flex}><Text style={s.label}>{i18nT(item.label)}</Text><Text style={s.text} numberOfLines={2}>{item.place?.address ?? i18nT('Chưa chọn địa điểm')}</Text></View>{item.onPress ? <MaterialIcons name="edit" size={18} color={themeColor("#667085","color")} /> : null}</Pressable></View>)}</View>;
}
