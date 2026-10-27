import type { CustomerRideDetail } from '@datxe/shared';
import { useFocusEffect,useLocalSearchParams,useRouter } from 'expo-router';
import { useCallback,useState } from 'react';
import { getActiveCustomerRide } from '../api';
export function useCustomerSupport() {
const router = useRouter();
const params = useLocalSearchParams<{ topic?: string }>();
const isSafety = (Array.isArray(params.topic) ? params.topic[0] : params.topic) === 'safety';
const [ride, setRide] = useState<CustomerRideDetail | null>(null);
const [loading, setLoading] = useState(true);
useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    getActiveCustomerRide().then((value) => { if (active) setRide(value); }).catch(() => { if (active) setRide(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));
return { router, params, isSafety, ride, loading };
}
