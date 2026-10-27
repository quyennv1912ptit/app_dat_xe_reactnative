import { useSessionStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { Alert } from 'react-native';
import { cancelCustomerRide,getCustomerVehicles } from '../api';
import { useRideQuery } from './useRideQuery';
export function useDriverTracking() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const query = useRideQuery(rideId, true);
const ride = query.data;
const error = !rideId ? 'Thiếu mã chuyến.' : query.error?.message ?? '';
const [cancelling, setCancelling] = useState(false);
const refresh = () => query.refetch();
const vehiclesQuery = useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles,enabled:Boolean(ride?.vehicleId)});
const vehicle = vehiclesQuery.data?.find(item=>item.id===ride?.vehicleId) ?? null;
useEffect(() => { if (ride) useSessionStore.getState().setActiveRide(ride); }, [ride]);
useEffect(() => { if (ride?.status === 'COMPLETED') router.replace({pathname:'/ride/completed',params:{rideId:String(ride.id)}}); }, [ride?.id, ride?.status, router]);
const pendingPickup = ride?.handoverReports.find((report) => report.phase === 'PICKUP' && !report.confirmedByCustomer);
const pendingDropoff = ride?.handoverReports.find((report) => report.phase === 'DROPOFF' && !report.confirmedByCustomer);
const cancel = () => Alert.alert('Hủy chuyến', 'Bạn có muốn hủy chuyến này?', [
    { text: 'Đóng', style: 'cancel' },
    { text: 'Hủy chuyến', style: 'destructive', onPress: () => { void (async () => {
      if (!ride || cancelling) return;
      setCancelling(true);
      try { await cancelCustomerRide(ride.id, 'Khách hàng hủy chuyến'); router.replace('/(tabs)/home'); }
      catch (err) { Alert.alert('Không thể hủy chuyến', err instanceof Error ? err.message : 'Vui lòng thử lại.'); }
      finally { setCancelling(false); }
    })(); } },
  ]);
return { router, params, rideId, ride, vehicle, error, cancelling, refresh, pendingPickup, pendingDropoff, cancel };
}
