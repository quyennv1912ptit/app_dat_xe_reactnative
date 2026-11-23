import { env } from '@/config/env';
import '@/lib/auth';
import { createApiClient, signOutFirebase } from '@datxe/shared';
import { router } from 'expo-router';
import { queryClient } from './queryClient';
import { useSessionStore } from './store';

export const request = createApiClient(
  env.apiUrl,
  'CUSTOMER',
  () => {
    queryClient.clear();
    useSessionStore.getState().reset();
    router.replace('/(auth)/login');
  },
  (message) => {
    queryClient.clear();
    useSessionStore.getState().reset();
    void signOutFirebase().catch(() => {});
    router.replace({ pathname: '/(auth)/account-locked', params: { reason: message } } as never);
  },
);
