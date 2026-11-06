import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { dismissOfferNotifications } from '@datxe/shared';
import { useEffect, useState } from 'react';
import { offerRemainingMs } from '../offerTiming';
import { acceptDriverOffer, getPendingOffer, rejectDriverOffer } from '../api';
export function useAccept() {
  const router = useRouter(); const client = useQueryClient();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const expectedId = rideId === undefined ? null : Number(rideId);
  const query = useQuery({ queryKey: ['driver', 'pendingOffer'], queryFn: getPendingOffer, staleTime: 0, refetchOnMount: 'always' });
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const offer = expectedId === null || query.data?.rideId === expectedId ? query.data : null;
  const mismatch = Boolean(expectedId !== null && query.isSuccess && !offer);
  // Use the server's remaining window relative to receipt time; a skewed device
  // clock must not grant more time. Server still validates the authoritative deadline.
  const secondsLeft = offer ? Math.ceil(offerRemainingMs(offer, query.dataUpdatedAt, now) / 1000) : 0;
  const dismiss = () => { if (offer) void dismissOfferNotifications(offer.rideId).catch(() => {}); };
  const accept = useMutation({ mutationFn: async () => { if (!offer || offerRemainingMs(offer, query.dataUpdatedAt, Date.now()) <= 0) throw new Error('Yêu cầu đã hết hạn.'); return acceptDriverOffer(offer.rideId, offer.offerId); }, onSuccess: async () => { dismiss(); await client.invalidateQueries({ queryKey: ['driver'] }); router.replace('/ride/in-progress'); } });
  const reject = useMutation({ mutationFn: async () => { if (offer) await rejectDriverOffer(offer.rideId, offer.offerId); }, onSuccess: async () => { dismiss(); await client.invalidateQueries({ queryKey: ['driver'] }); if (router.canGoBack()) router.back(); else router.replace('/(tabs)/home'); } });
  return { router, offer, secondsLeft, loading: query.isLoading, error: query.error?.message || accept.error?.message || reject.error?.message || (mismatch ? 'Yêu cầu chuyến này đã hết hạn hoặc không còn khả dụng.' : ''), busy: accept.isPending || reject.isPending, accept: () => accept.mutate(), reject: () => reject.mutate(), refresh: query.refetch };
}
