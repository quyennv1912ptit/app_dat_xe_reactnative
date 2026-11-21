import type { CustomerRideDetail } from '@datxe/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { stopDriverBackgroundLocation } from '@/lib/backgroundLocation';
import { getDriverActiveRide, getDriverRide, progressDriverRide } from '../api';
import { isTerminalRideStatus, ridePresentation } from '../ridePresentation';

const activeKey = ['driver', 'activeRide'] as const;

export function useInProgress() {
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({ queryKey: activeKey, queryFn: getDriverActiveRide });
  const ride = query.data;
  const model = ridePresentation(ride, !query.isError && !query.isPaused);
  const submitting = useRef(false);
  const [lastRideId, setLastRideId] = useState<number | null>(null);
  if (ride?.id && ride.id !== lastRideId) setLastRideId(ride.id);

  const endedQuery = useQuery({
    queryKey: ['driver', 'ride', lastRideId],
    queryFn: () => getDriverRide(lastRideId!),
    enabled: Boolean(lastRideId && query.isSuccess && ride === null),
    staleTime: 10_000,
  });

  const endedDetail = query.isSuccess && ride === null ? endedQuery.data : null;

  useEffect(() => {
    if (endedDetail?.status === 'COMPLETED') {
      router.replace({ pathname: '/ride/complete', params: { rideId: String(endedDetail.id) } });
    }
  }, [endedDetail, router]);

  const progress = useMutation({
    mutationFn: async ({ id, endpoint }: { id: number; endpoint: string }) => {
      const latest = client.getQueryState<CustomerRideDetail | null>(activeKey);
      const action = ridePresentation(
        latest?.data,
        latest?.status === 'success' && latest.fetchStatus !== 'paused',
      )?.action;
      if (latest?.data?.id !== id || action?.kind !== 'progress' || action.endpoint !== endpoint) {
        throw new Error('Chuyến đã đổi trạng thái. Hãy cập nhật rồi thử lại.');
      }
      await progressDriverRide(id, endpoint);
    },
    onSuccess: async (_, { id, endpoint }) => {
      await client.invalidateQueries({ queryKey: ['driver'] });
      if (endpoint === 'complete') {
        // Tắt GPS nền ngay lúc bấm kết thúc, không chờ query activeRide trả về null.
        void stopDriverBackgroundLocation().catch(() => {});
        router.replace({ pathname: '/ride/complete', params: { rideId: String(id) } });
      }
    },
    onError: () => { void query.refetch(); },
    onSettled: () => { submitting.current = false; },
  });

  const advance = () => {
    if (!ride || model?.action?.kind !== 'progress' || submitting.current) return;
    submitting.current = true;
    progress.mutate({ id: ride.id, endpoint: model.action.endpoint });
  };

  const endedRide = endedDetail && isTerminalRideStatus(endedDetail.status) && endedDetail.status !== 'COMPLETED'
    ? endedDetail
    : null;

  return { router, query, ride, model, endedRide, progress, advance };
}
