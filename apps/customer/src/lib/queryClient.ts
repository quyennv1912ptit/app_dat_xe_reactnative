import { focusManager,QueryClient } from '@tanstack/react-query';
import { AppState,Platform } from 'react-native';
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15000 }, mutations: { retry: false } } });
focusManager.setEventListener(handleFocus => {
  if (Platform.OS === 'web') { const onFocus = () => handleFocus(document.visibilityState === 'visible'); document.addEventListener('visibilitychange', onFocus); return () => document.removeEventListener('visibilitychange', onFocus); }
  const subscription = AppState.addEventListener('change', state => handleFocus(state === 'active'));
  return () => subscription.remove();
});
