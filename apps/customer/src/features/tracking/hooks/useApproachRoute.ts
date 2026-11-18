import { env } from '@/config/env';
import { validLocationUpdate } from '@datxe/shared';
import { request } from '@/lib/api';
import type { CustomerRideDetail, MapDirections, RideCoordinates } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';

export function resolveLiveEtaTarget(ride: CustomerRideDetail | null | undefined) {
  if (!ride) return null;
  if (ride.status === 'DRIVER_ASSIGNED' || ride.status === 'DRIVER_ARRIVING') {
    if (ride.pickup.lat == null || ride.pickup.lng == null) return null;
    return { phase: 'pickup' as const, destination: { lat: ride.pickup.lat, lng: ride.pickup.lng } };
  }
  if (ride.status === 'IN_PROGRESS') {
    if (ride.dropoff.lat == null || ride.dropoff.lng == null) return null;
    return { phase: 'dropoff' as const, destination: { lat: ride.dropoff.lat, lng: ride.dropoff.lng } };
  }
  return null;
}

export function useApproachRoute(ride: CustomerRideDetail | null | undefined, origin: RideCoordinates | undefined, now: number) {
  const target = resolveLiveEtaTarget(ride);
  const approaching = target?.phase === 'pickup';
  const vehicleType = ride?.vehicleType;
  const snapshot = useQuery({
    queryKey: ['customer', 'approachLocation', ride?.id, ride?.driverId],
    enabled: Boolean(approaching && ride?.driverId && !origin),
    queryFn: ({ signal }) => request<unknown>(`/customer/rides/${ride?.id}/approach-location`, { signal, allowNull: true }),
    retry: false,
    refetchInterval: approaching && !origin ? 5000 : false,
  });
  const fix = snapshot.data;
  const start = origin ?? (approaching && validLocationUpdate(fix) && now - Date.parse(fix.timestamp) < env.locationStaleMs
    ? fix.location : undefined);
  const originBucket = start ? `${start.lat.toFixed(3)},${start.lng.toFixed(3)}` : undefined;
  const enabled = Boolean(target && ride?.driverId && start && (vehicleType === 'CAR' || vehicleType === 'MOTORCYCLE'));
  const query = useQuery({
    queryKey: ['customer', 'driverApproach', ride?.id, ride?.driverId, target?.phase, originBucket, target?.destination.lat, target?.destination.lng, vehicleType],
    enabled,
    retry: false,
    refetchInterval: enabled ? 15000 : false,
    queryFn: async ({ signal }) => {
      if (!start || !target) throw new Error('Thiếu tọa độ chỉ đường.');
      const params = new URLSearchParams({
        origin: `${start.lng},${start.lat}`,
        destination: `${target.destination.lng},${target.destination.lat}`,
        vehicleType: String(vehicleType),
      });
      const route = await request<MapDirections>(`/location/directions?${params}`, { signal });
      if (!route || !Number.isFinite(route.distance) || route.distance < 0
        || !Number.isFinite(route.duration) || route.duration < 0 || !Array.isArray(route.coordinates) || route.coordinates.length < 2) {
        throw new Error('Chưa có tuyến đường Goong hợp lệ.');
      }
      return route;
    },
  });
  return {
    phase: target?.phase ?? null,
    location: target ? start : undefined,
    route: enabled && !query.isError ? query.data : undefined,
    unavailable: enabled && query.isError,
  };
}
