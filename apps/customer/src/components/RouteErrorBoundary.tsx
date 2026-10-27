import { logError } from '@/lib/logger';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Button,Text,View } from 'react-native';
export function RouteErrorBoundary({error,retry}: ErrorBoundaryProps) {
  useEffect(() => { logError(error); }, [error]);
  return <View style={{flex:1,justifyContent:'center',padding:24}}><Text>Đã xảy ra lỗi. Vui lòng thử lại.</Text><Button title="Thử lại" onPress={retry} /></View>;
}
