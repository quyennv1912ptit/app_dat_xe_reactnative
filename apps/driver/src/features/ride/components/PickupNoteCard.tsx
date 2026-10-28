import { rideStyles as s } from '@/components/rideStyles';
import { openExternalDirections } from '@/lib/navigation';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { getDriverActiveRide } from '../api';
export function PickupNoteCard() {
  const query = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getDriverActiveRide });
  const ride = query.data;
  if (!ride) return null;
  return <View style={s.card}><Text style={s.label}>ĐIỂM ĐÓN · #{ride.id}</Text><Text style={s.text}>{ride.pickupAddress}</Text><Text style={s.label}>GHI CHÚ ĐIỂM ĐÓN</Text><Text style={s.text}>{ride.pickupNote || 'Khách chưa thêm ghi chú điểm đón.'}</Text><Pressable onPress={() => void openExternalDirections(ride.pickup)}><Text style={s.link}>Mở chỉ đường tới điểm đón ↗</Text></Pressable></View>;
}
