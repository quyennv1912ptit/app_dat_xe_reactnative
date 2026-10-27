import { useLocalSearchParams,useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { rateCustomerRide } from '../api';
import { useRideQuery } from './useRideQuery';
export function useTripCompleted() {
const router = useRouter();
const params = useLocalSearchParams<{ rideId?: string }>();
const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
const query = useRideQuery(rideId);
const ride = query.data;
const [stars, setStars] = useState(5);
const [comment, setComment] = useState('');
const [saving, setSaving] = useState(false);
const error = !rideId ? 'Không có mã chuyến để tải hóa đơn và gửi đánh giá.' : query.error?.message ?? '';
const finish = async (skipRating = false) => {
    if (saving) return;
    if (!rideId) {
      if (skipRating) router.replace('/(tabs)/home');
      return;
    }
    setSaving(true);
    try {
      if (!skipRating) await rateCustomerRide(rideId, { stars, comment: comment.trim() || null, tags: null, tip: 0 });
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Chưa gửi được đánh giá', err instanceof Error ? err.message : 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };
return { router, ride, stars, setStars, comment, setComment, saving, error, finish };
}
