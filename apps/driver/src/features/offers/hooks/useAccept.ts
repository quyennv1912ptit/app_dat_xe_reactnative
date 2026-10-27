import { useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DispatchState,INITIAL_COUNTDOWN } from '../components/AcceptScreenParts';
export function useAccept() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN);
const [dispatchState, setDispatchState] = useState<DispatchState>('pending');
useEffect(() => {
    if (dispatchState !== 'pending' || secondsLeft === 0) return;

    const timeout = setTimeout(() => {
      if (secondsLeft === 1) {
        setSecondsLeft(0);
        setDispatchState('expired');
      } else {
        setSecondsLeft((seconds) => seconds - 1);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [dispatchState, secondsLeft]);
const acceptRide = () => {
    if (dispatchState !== 'pending' || secondsLeft === 0) return;
    setDispatchState('accepted');
    router.replace('/ride/in-progress' as never);
  };
const declineRide = () => {
    if (dispatchState === 'accepted' || dispatchState === 'declined') return;
    setDispatchState('declined');
  };
const acceptLabel =
    dispatchState === 'accepted'
      ? 'Đang điều hướng điểm đón...'
      : dispatchState === 'expired'
        ? 'Đã hết thời gian'
        : dispatchState === 'declined'
          ? 'Cuốc đã đóng'
          : `NHẬN CUỐC NGAY (${secondsLeft}s)`;
const statusMessage =
    dispatchState === 'accepted'
      ? 'Đã nhận cuốc. Đang chuẩn bị thông tin điểm đón.'
      : dispatchState === 'declined'
        ? 'Bạn đã bỏ qua yêu cầu chuyến xe này.'
        : dispatchState === 'expired'
          ? 'Yêu cầu chuyến xe đã hết thời gian phản hồi.'
          : '';
return { router, insets, secondsLeft, dispatchState, acceptRide, declineRide, acceptLabel, statusMessage };
}
