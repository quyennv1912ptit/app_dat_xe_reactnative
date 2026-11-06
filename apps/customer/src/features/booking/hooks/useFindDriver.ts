import { useCustomerRideCancellation } from '@/lib/useCustomerRideCancellation';
import { translate as i18nT } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect,useRef } from 'react';
import { getActiveCustomerRide,getCustomerRide } from '../api';
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
const error=query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đang hoạt động trong tài khoản.") : '');
const moved=useRef(false);
const refresh = query.refetch;
const cancellation = useCustomerRideCancellation(ride, refresh);
useEffect(()=>{
 if(!ride || moved.current || cancellation.visible)return;
 if(['DRIVER_ASSIGNED','DRIVER_ARRIVING','DRIVER_ARRIVED','VEHICLE_HANDOVER','IN_PROGRESS','ARRIVED_DESTINATION','VEHICLE_RETURNED'].includes(ride.status)) {
  moved.current=true;router.replace({pathname:'/ride/tracking',params:{rideId:String(ride.id)}});
 } else if(ride.status==='COMPLETED') {moved.current=true;router.replace({pathname:'/ride/completed',params:{rideId:String(ride.id)}});}
},[ride,router,cancellation.visible]);
return { router, ride, error, cancellation, refresh };
}
