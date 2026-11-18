import { customerRidePresentation } from '@/lib/customerRidePresentation';
import { useCustomerRideCancellation } from '@/lib/useCustomerRideCancellation';
import { translate as i18nT } from '@datxe/shared';
import { useSessionStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const synchronized = !query.isError;
  const refresh = query.refetch;
  const cancellation = useCustomerRideCancellation(ride, refresh);
  const presentation = customerRidePresentation(ride, synchronized);
  const live = useLiveDriverLocation(rideId, Boolean(ride && !presentation?.ended), refresh, ride?.driverId);
  const vehiclesQuery = useQuery({ queryKey: ['customer', 'getCustomerVehicles'], queryFn: getCustomerVehicles, enabled: Boolean(ride?.vehicleId) });
  const vehicle = vehiclesQuery.data?.find(item => item.id === ride?.vehicleId) ?? null;
  useEffect(() => { if (ride) useSessionStore.getState().setActiveRide(ride); }, [ride]);
  useEffect(() => {
    if (ride?.status === 'SEARCHING' || ride?.status === 'PENDING') {
      router.replace({ pathname: '/ride/find-driver', params: { rideId: String(ride.id) } });
    }
  }, [ride?.id, ride?.status, router]);
  return { router, params, rideId, ride, vehicle, error, synchronized, presentation, cancellation, refresh, live };
}
