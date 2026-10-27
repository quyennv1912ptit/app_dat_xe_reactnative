import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApprovalState } from '../components/ApprovalStatusScreenParts';
export function useApprovalStatus() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [activeState, setActiveState] = useState<ApprovalState>('pending');
const callSupport = async () => {
    try {
      await Linking.openURL('tel:19006868');
    } catch {
      Alert.alert('Không thể thực hiện cuộc gọi', 'Vui lòng gọi tổng đài 1900 6868.');
    }
  };
const openLicenseUpload = () => {
    router.push('/(auth)/license-upload' as never);
  };
const openDriverApp = () => {
    router.replace('/(tabs)/home' as never);
  };
return { router, insets, activeState, setActiveState, callSupport, openLicenseUpload, openDriverApp };
}
