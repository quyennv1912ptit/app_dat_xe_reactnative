import { request } from '@/lib/api';
import { useSessionStore } from '@/lib/store';
import { DriverReviews, type DriverReviewSummary } from '@datxe/ui';
import { useQuery } from '@tanstack/react-query';

export function RideDriverReviews({ rideId, driverId }: { rideId: number; driverId: number }) {
  const userId = useSessionStore(state => state.user?.id);
  const reviews = useQuery({
    queryKey: ['customer', 'driverReviews', userId, rideId, driverId],
    queryFn: () => request<DriverReviewSummary>(`/customer/rides/${rideId}/driver-reviews`),
    enabled: Boolean(userId),
  });
  return <DriverReviews data={reviews.data} loading={reviews.isLoading} error={reviews.isError} retry={() => void reviews.refetch()} />;
}
