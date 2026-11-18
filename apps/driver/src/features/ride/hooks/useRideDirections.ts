import { request } from '@/lib/api';
import { driverApi } from '@/lib/driverApi';
import { directionsQuery, validDirectionsPoint } from '@/lib/navigation';
import { positiveId, type MapDirections } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { isTerminalRideStatus, ridePresentation } from '../ridePresentation';

async function readOrigin() {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Cấp quyền vị trí để lấy chỉ đường từ chỗ bạn.');
  const cached = await Location.getLastKnownPositionAsync({ maxAge: 15000, requiredAccuracy: 100 });
  const position = cached ?? await new Promise<Location.LocationObject>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chưa lấy được vị trí hiện tại. Hãy kiểm tra GPS.')), 12000);
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false })
      .then(resolve, reject).finally(() => clearTimeout(timer));
  });
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

export function useRideDirections() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string; stop?: string }>();
  const rideId = positiveId(params.rideId);
  const stop = params.stop === 'dropoff' ? 'dropoff' : params.stop === 'pickup' ? 'pickup' : null;
  const ride = useQuery({
    queryKey: ['driver', 'rideDirectionsDetail', rideId],
    queryFn: () => driverApi.ride(rideId!),
    enabled: Boolean(rideId && stop),
    refetchInterval: 10000,
  });
  const allowedStop = ridePresentation(ride.data, !ride.isError && !ride.isPaused)?.navigation;
  const point = stop && stop === allowedStop ? ride.data?.[stop] : null;
  const destination = point && validDirectionsPoint(point) ? point : null;
  const vehicleType = ride.data?.vehicleType ?? ride.data?.route?.vehicleType;
  const origin = useQuery({
    queryKey: ['driver', 'rideDirectionsOrigin', rideId, stop],
    queryFn: readOrigin,
    enabled: Boolean(destination && vehicleType),
    retry: false,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });
  const directions = useQuery({
    queryKey: ['driver', 'rideDirections', origin.data, destination, vehicleType],
    queryFn: ({ signal }) => request<MapDirections>(
      '/location/directions?' + directionsQuery(origin.data!, destination!, vehicleType!),
      { signal },
    ),
    enabled: Boolean(origin.data && destination && vehicleType),
    retry: false,
    staleTime: 300000,
  });
  const terminal = isTerminalRideStatus(ride.data?.status);
  const error = !rideId || !stop ? 'Thiếu thông tin chuyến để chỉ đường.'
    : ride.isPaused ? 'Chưa đồng bộ được tuyến đường. Kiểm tra kết nối rồi thử lại.'
    : ride.error?.message ?? origin.error?.message ?? directions.error?.message ??
      (ride.isSuccess && stop !== allowedStop
        ? terminal
          ? 'Chuyến đi đã kết thúc nên không còn chỉ đường.'
          : 'Chỉ đường không còn khả dụng ở giai đoạn này.'
        : ride.isSuccess && (!destination || !vehicleType)
          ? 'Chuyến chưa có tọa độ hoặc loại phương tiện hợp lệ.'
          : '');
  const fallback = terminal && ride.data
    ? { route: { pathname: '/ride/complete' as const, params: { rideId: String(ride.data.id) } }, label: 'Xem chi tiết chuyến' }
    : ride.data
      ? { route: '/ride/in-progress' as const, label: 'Về chuyến đang thực hiện' }
      : { route: '/(tabs)/home' as const, label: 'Về trang chủ' };
  const refresh = () => {
    if (ride.isError || !destination) { if (rideId && stop) void ride.refetch(); }
    else if (origin.isError || !origin.data) void origin.refetch();
    else if (directions.isError) void directions.refetch();
    else void origin.refetch();
  };
  return {
    router, stop, destination, origin: destination ? origin.data : undefined, directions: destination ? directions.data : undefined,
    address: stop === 'pickup' ? ride.data?.pickupAddress : ride.data?.dropoffAddress,
    loading: ride.isLoading || origin.isFetching || directions.isFetching,
    error, fallback, refresh,
  };
}
