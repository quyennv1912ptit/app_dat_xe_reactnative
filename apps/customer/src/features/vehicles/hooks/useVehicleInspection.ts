import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { confirmCustomerHandover,getCustomerRide } from '../api';
export function useVehicleInspection() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string; phase?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const phase = (Array.isArray(params.phase) ? params.phase[0] : params.phase) === 'dropoff' ? 'DROPOFF' : 'PICKUP';
const query = useQuery({queryKey:['customer','getCustomerRide',rideId],queryFn:()=>getCustomerRide(rideId),enabled:rideId>0});
const ride = query.data;
const loading = query.isLoading;
const error = !rideId ? 'Thiếu mã chuyến.' : query.error?.message ?? '';
const [saving,setSaving] = useState(false);
const report = ride?.handoverReports.find(item=>item.phase===phase);
const refresh = () => query.refetch();
const confirm = async () => {
    if (!rideId || !report || report.confirmedByCustomer || saving) return;
    setSaving(true);
    try {
      await confirmCustomerHandover(rideId, phase === 'PICKUP' ? 'pickup' : 'dropoff');
      await refresh();
      Alert.alert('Đã xác nhận', 'Xác nhận bàn giao đã được ghi nhận trên chuyến đi.', [{ text: 'Đóng', onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert('Không thể xác nhận', err instanceof Error ? err.message : 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };
return { router, phase, ride, loading, saving, error, report, confirm };
}
