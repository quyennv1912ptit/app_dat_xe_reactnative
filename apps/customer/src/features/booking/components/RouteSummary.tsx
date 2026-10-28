import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { BookingPlace } from '../types';
import { bookingStyles as s } from './bookingStyles';
export function RouteSummary({ pickup, dropoff, onPickup, onDropoff }: { pickup: BookingPlace | null; dropoff: BookingPlace | null; onPickup?: () => void; onDropoff?: () => void }) {
  return <View style={s.card}>{([{ place: pickup, label: 'ĐIỂM ĐÓN', color: '#12B76A', onPress: onPickup }, { place: dropoff, label: 'ĐIỂM ĐẾN', color: '#F04438', onPress: onDropoff }]).map((item, index) => <View key={item.label}>{index ? <View style={[s.divider, { marginLeft: 34 }]} /> : null}<Pressable disabled={!item.onPress} accessibilityRole={item.onPress ? 'button' : undefined} onPress={item.onPress} style={[s.row, { paddingVertical: 4 }]}><MaterialIcons name={index ? 'place' : 'radio-button-checked'} size={22} color={item.color} /><View style={s.flex}><Text style={s.label}>{item.label}</Text><Text style={s.text} numberOfLines={2}>{item.place?.address ?? 'Chưa chọn địa điểm'}</Text></View>{item.onPress ? <MaterialIcons name="edit" size={18} color="#667085" /> : null}</Pressable></View>)}</View>;
}
