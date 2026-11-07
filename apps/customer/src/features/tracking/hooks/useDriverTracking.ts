import { useCustomerRideCancellation } from '@/lib/useCustomerRideCancellation';
import { translate as i18nT } from '@datxe/shared';
import { useSessionStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getCustomerVehicles } from '../api';
import { useRideQuery } from './useRideQuery';
import { useLiveDriverLocation } from './useLiveDriverLocation';
export function useDriverTracking() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const query = useRideQuery(rideId, true);
const ride = query.data;
const valid = Number.isSafeInteger(rideId) && rideId > 0;
const error = !valid ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đi.") : '');
const refresh = query.refetch;
const cancellation = useCustomerRideCancellation(ride, refresh);
const live = useLiveDriverLocation(rideId, Boolean(ride && !['COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED', 'FAILED_SYSTEM'].includes(ride.status)), refresh, Boolean(ride?.driverId));
const vehiclesQuery = useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles,enabled:Boolean(ride?.vehicleId)});
const vehicle = vehiclesQuery.data?.find(item=>item.id===ride?.vehicleId) ?? null;
useEffect(() => { if (ride) useSessionStore.getState().setActiveRide(ride); }, [ride]);
useEffect(() => { if (ride?.status === 'SEARCHING') router.replace({pathname:'/ride/find-driver',params:{rideId:String(ride.id)}}); }, [ride?.id, ride?.status, router]);
const pendingPickup = ride?.handoverReports.find((report) => report.phase === 'PICKUP' && !report.confirmedByCustomer);
const pendingDropoff = ride?.handoverReports.find((report) => report.phase === 'DROPOFF' && !report.confirmedByCustomer);
return { router, params, rideId, ride, vehicle, error, cancellation, refresh, pendingPickup, pendingDropoff, live };
}
