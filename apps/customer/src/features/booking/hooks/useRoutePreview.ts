import { useQuery } from '@tanstack/react-query';
import { getBookingRoute } from '../api';
import type { BookingPlace } from '../types';
export function useRoutePreview(pickup: BookingPlace | null, dropoff: BookingPlace | null) {
  return useQuery({ queryKey: ['customer', 'bookingRoute', pickup?.coordinate.lat, pickup?.coordinate.lng, dropoff?.coordinate.lat, dropoff?.coordinate.lng], queryFn: ({ signal }) => getBookingRoute(pickup!.coordinate, dropoff!.coordinate, signal), enabled: Boolean(pickup && dropoff), staleTime: 120000, retry: false });
}
