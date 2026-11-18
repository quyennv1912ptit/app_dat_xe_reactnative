import { localizedAlert } from '@datxe/ui';
import { AuthApiError, translate as i18nT } from '@datxe/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { getMyCustomerRideRating, rateCustomerRide } from '../api';
import { useRideQuery } from './useRideQuery';

export function useTripCompleted() {
  const router = useRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
  const query = useRideQuery(rideId);
  const ride = query.data;
  const valid = Number.isSafeInteger(rideId) && rideId > 0;

  const existingRatingQuery = useQuery({
    queryKey: ['customer', 'ride', rideId, 'my-rating'],
    queryFn: () => getMyCustomerRideRating(rideId),
    enabled: valid,
    retry: false,
  });

  const existingRating = existingRatingQuery.data;
  const [draftStars, setStars] = useState(5);
  const [draftComment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(false);
  const alreadyRated = Boolean(
    existingRating || ride?.customerHasRatedDriver === true || ride?.hasRated || submittedRating,
  );
  const lockedStars = existingRating?.stars ?? (ride?.hasRated ? ride.myRatingStars : null);
  const stars = alreadyRated && lockedStars ? lockedStars : draftStars;
  const comment = existingRating
    ? existingRating.comment ?? ''
    : ride?.hasRated && ride.myRatingStars
      ? ride.myRatingComment ?? ''
      : draftComment;

  const refresh = async () => {
    await Promise.all([query.refetch(), existingRatingQuery.refetch()]);
  };

  const error = !valid
    ? i18nT('Không có mã chuyến để tải hóa đơn và gửi đánh giá.')
    : query.error?.message ?? (query.isSuccess && !ride ? i18nT('Không tìm thấy chuyến đi.') : '');

  const finish = async (skipRating = false) => {
    if (saving) return;
    if (!rideId || skipRating || alreadyRated) {
      router.replace('/(tabs)/home');
      return;
    }
    setSaving(true);
    try {
      await rateCustomerRide(rideId, { stars, comment: comment.trim() || null, tags: null, tip: 0 });
      setSubmittedRating(true);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['customer'] }),
        existingRatingQuery.refetch(),
      ]);
      localizedAlert(i18nT('Cảm ơn bạn!'), i18nT('Đánh giá ẩn danh của bạn đã được ghi nhận.'));
      router.replace('/(tabs)/home');
    } catch (err) {
      if (err instanceof AuthApiError && err.code === 'RATING_ALREADY_EXISTS') {
        setSubmittedRating(true);
        await Promise.all([
          client.invalidateQueries({ queryKey: ['customer'] }),
          existingRatingQuery.refetch(),
        ]);
        localizedAlert(i18nT('Đánh giá chuyến đi'), i18nT('Bạn đã đánh giá chuyến đi này rồi.'));
        router.replace('/(tabs)/home');
        return;
      }
      localizedAlert(
        i18nT('Chưa gửi được đánh giá'),
        err instanceof Error ? err.message : i18nT('Vui lòng thử lại.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    router,
    ride,
    stars,
    setStars,
    comment,
    setComment,
    saving,
    alreadyRated,
    hasRatingDetail: Boolean(lockedStars),
    checkingRating: existingRatingQuery.isLoading,
    error,
    refresh,
    finish,
  };
}
