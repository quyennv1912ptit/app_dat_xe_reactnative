import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useRef,useState } from 'react';
import { Alert } from 'react-native';
import { cancelCustomerRide,getActiveCustomerRide,getCustomerRide } from '../api';
export function useFindDriver() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const query = useQuery({queryKey:['customer','findDriver',rideId],queryFn:()=>rideId?getCustomerRide(rideId):getActiveCustomerRide(),refetchInterval:query=>{
  const ride=query.state.data;
  if(ride && !['PENDING','SEARCHING'].includes(ride.status)) return false;
  return ride?.type==='SCHEDULED' && ride.status==='PENDING' ? 30000 : 4000;
}});
const ride=query.data;
const error=query.error?.message ?? (query.isSuccess && !ride ? 'Không tìm thấy chuyến đang hoạt động trong tài khoản.' : '');
const [cancelling,setCancelling]=useState(false);
const moved=useRef(false);
const refresh=()=>query.refetch();
useEffect(()=>{
 if(!ride || moved.current)return;
 if(['DRIVER_ASSIGNED','DRIVER_ARRIVING','DRIVER_ARRIVED','VEHICLE_HANDOVER','IN_PROGRESS','ARRIVED_DESTINATION','VEHICLE_RETURNED'].includes(ride.status)) {
  moved.current=true;router.replace({pathname:'/ride/tracking',params:{rideId:String(ride.id)}});
 } else if(ride.status==='COMPLETED') {moved.current=true;router.replace({pathname:'/ride/completed',params:{rideId:String(ride.id)}});}
},[ride,router]);
const cancel = () => Alert.alert('Hủy chuyến', 'Bạn muốn hủy yêu cầu tìm tài xế?', [
    { text: 'Tiếp tục tìm', style: 'cancel' },
    { text: 'Hủy chuyến', style: 'destructive', onPress: () => void (async () => {
      if (!ride || cancelling) return;
      setCancelling(true);
      try {
        await cancelCustomerRide(ride.id, 'Khách hàng hủy yêu cầu');
        router.replace('/(tabs)/home');
      } catch (err) {
        Alert.alert('Không thể hủy chuyến', err instanceof Error ? err.message : 'Vui lòng thử lại.');
      } finally {
        setCancelling(false);
      }
    })() },
  ]);
return { router, ride, error, cancelling, refresh, cancel };
}
