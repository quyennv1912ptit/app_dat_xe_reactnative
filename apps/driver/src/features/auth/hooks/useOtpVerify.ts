import { useLocalSearchParams,useRouter } from 'expo-router';
import { useEffect } from 'react';
export function useOtpVerify() {
const router = useRouter();
const { phone } = useLocalSearchParams<{ phone?: string }>();
useEffect(() => {
    if (!phone) router.replace('/(auth)/login' as never);
  }, [phone, router]);

return { phone, router };
}
