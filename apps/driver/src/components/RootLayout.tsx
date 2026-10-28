import { validateEnv } from '@/config/env';
import '@/lib/auth';
import '@/lib/logger';
import { queryClient } from '@/lib/queryClient';
import { MaterialIcons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DriverRealtimeBridge } from './DriverRealtimeBridge';

export default function RootLayout() {
  validateEnv();
  const [loaded,error] = useFonts(MaterialIcons.font);
  if (!loaded && !error) return null;
  return <QueryClientProvider client={queryClient}><DriverRealtimeBridge /><Stack screenOptions={{headerShown:false}} /></QueryClientProvider>;
}
