import { useQuery } from '@tanstack/react-query';
import { getCustomerRide } from '../api';
const terminal = new Set(['COMPLETED','CANCELLED','NO_DRIVER_FOUND','EXPIRED','FAILED_SYSTEM']);
export function useRideQuery(rideId: number, poll = false) {
 return useQuery({ queryKey:['customer','getCustomerRide',rideId],queryFn:()=>getCustomerRide(rideId),
   enabled:Number.isSafeInteger(rideId)&&rideId>0, refetchOnMount:'always', refetchOnWindowFocus:'always',
   refetchInterval: query => {
     const ride = query.state.data;
     if (ride?.status === 'COMPLETED' && ride.payment?.status === 'PENDING') return 5000;
     return poll && !terminal.has(ride?.status ?? '') ? 6000 : false;
   } });
}
