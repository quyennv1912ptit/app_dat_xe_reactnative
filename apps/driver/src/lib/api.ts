import { env } from '@/config/env';
import '@/lib/auth';
import { createApiClient } from '@datxe/shared';
import { router } from 'expo-router';
import { queryClient } from './queryClient';
import { useSessionStore } from './store';

export const request = createApiClient(env.apiUrl, 'DRIVER', () => {
  queryClient.clear(); useSessionStore.getState().reset(); router.replace('/(auth)/login');
});
