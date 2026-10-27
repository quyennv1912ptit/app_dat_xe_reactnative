import { signOutFirebase } from '@datxe/shared';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function useProfile() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [autoAccept, setAutoAccept] = useState(true);
const [withdrawing, setWithdrawing] = useState(false);
const withdraw = () => {
    if (withdrawing) return;
    setWithdrawing(true);
    setTimeout(() => setWithdrawing(false), 1200);
  };
const callHotline = async () => {
    try {
      await Linking.openURL('tel:19008888');
    } catch {
      Alert.alert('Không thể gọi tổng đài', 'Vui lòng gọi hotline SOS: 1900 8888.');
    }
  };
const confirmLogout = () => {
    Alert.alert('Đăng xuất tài xế', 'Bạn có chắc muốn đăng xuất ca lái của tài xế Nguyễn Văn Tuấn?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Đăng xuất',
        onPress: () => {
          void signOutFirebase().then(() => router.replace('/(auth)/login' as never));
        },
      },
    ]);
  };
return { router, insets, autoAccept, setAutoAccept, withdrawing, withdraw, callHotline, confirmLogout };
}
