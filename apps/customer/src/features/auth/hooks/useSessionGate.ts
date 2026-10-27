import { useSessionStore } from '@/lib/store';
import { AuthApiError,authenticateWithBackend } from '@datxe/shared';
import { getAuth,onAuthStateChanged,type User } from '@react-native-firebase/auth';
import { useEffect,useState } from 'react';
export function useSessionGate() {
const [destination, setDestination] = useState<string | null>(null);
useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user: User | null) => {
      if (!user) {
        setDestination('/(auth)/login');
        return;
      }
      if (!user.phoneNumber) {
        setDestination('/(auth)/add-phone-number');
        return;
      }

      void authenticateWithBackend('customer', user)
        .then((profile) => {
          useSessionStore.getState().setUser(profile);
          if (profile.role !== 'CUSTOMER') {
            setDestination('/(auth)/login');
          } else {
            setDestination(profile.phoneNumber ? '/(tabs)/home' : '/(auth)/add-phone-number');
          }
        })
        .catch((error: unknown) => {
          if (error instanceof AuthApiError && error.code === 'ACCOUNT_NOT_FOUND') {
            setDestination('/(auth)/register');
          } else {
            setDestination('/(auth)/login');
          }
        });
    });
    return unsubscribe;
  }, []);

return { destination };
}
