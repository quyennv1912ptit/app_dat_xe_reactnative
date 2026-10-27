import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function useComplete() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [searchState, setSearchState] = useState<'idle' | 'searching' | 'ready'>('idle');
const handleNextRide = () => {
    if (searchState === 'ready') {
      router.replace('/(tabs)/home' as never);
      return;
    }
    if (searchState === 'searching') return;
    setSearchState('searching');
    setTimeout(() => setSearchState('ready'), 1500);
  };
const ctaLabel =
    searchState === 'searching'
      ? 'Đang tìm cuốc xe mới...'
      : searchState === 'ready'
        ? 'Đã sẵn sàng nhận cuốc'
        : 'Hoàn thành & Nhận cuốc tiếp';
return { router, insets, searchState, handleNextRide, ctaLabel };
}
