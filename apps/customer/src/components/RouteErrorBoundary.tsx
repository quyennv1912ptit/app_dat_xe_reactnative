import { translate as i18nT } from '@datxe/shared';
import { useLanguage } from '@datxe/ui';
import { logError } from '@/lib/logger';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Button,Text,View } from 'react-native';
export function RouteErrorBoundary({error,retry}: ErrorBoundaryProps) {
 useLanguage();

  useEffect(() => { logError(error); }, [error]);
  return <View style={{flex:1,justifyContent:'center',padding:24}}><Text>{i18nT("Đã xảy ra lỗi. Vui lòng thử lại.")}</Text><Button title={i18nT("Thử lại")} onPress={retry} /></View>;
}
