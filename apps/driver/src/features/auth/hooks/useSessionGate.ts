import { useSessionStore } from '@/lib/store';
import { AuthApiError,authenticateWithBackend } from '@datxe/shared';
import { getAuth,onAuthStateChanged } from '@react-native-firebase/auth';
import { useEffect,useState } from 'react';
export function useSessionGate() {
const [destination, setDestination] = useState<string | null>(null);
useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        setDestination('/(auth)/login');
        return;
      }

      void authenticateWithBackend('driver', user)
        .then((profile) => {
          useSessionStore.getState().setUser(profile);
          setDestination(profile.role === 'DRIVER' ? '/(tabs)/home' : '/(auth)/login');
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
