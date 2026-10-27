import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HOME_TABS,HomeTab } from '../components/HomeScreenParts';
export function useHome() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [isOnline, setIsOnline] = useState(true);
const [autoAccept, setAutoAccept] = useState(true);
const [heatMapEnabled, setHeatMapEnabled] = useState(true);
const [isLocating, setIsLocating] = useState(false);
const [locationLabel, setLocationLabel] = useState('Ngã Tư Sở, Đống Đa');
const [priorityRegion, setPriorityRegion] = useState(
    'Hoàn Kiếm • Ba Đình • Cầu Giấy (10km)',
  );
const callSupport = async () => {
    try {
      await Linking.openURL('tel:19006868');
    } catch {
      Alert.alert('Không thể thực hiện cuộc gọi', 'Vui lòng gọi tổng đài 1900 6868.');
    }
  };
const locateDriver = async () => {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Chưa có quyền vị trí',
          'Cho phép DriveMate sử dụng vị trí khi dùng ứng dụng để cập nhật vị trí của bạn.',
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setLocationLabel(
        `${current.coords.latitude.toFixed(4)}, ${current.coords.longitude.toFixed(4)}`,
      );
    } catch {
      Alert.alert(
        'Chưa thể định vị',
        'Hãy bật dịch vụ vị trí trên thiết bị rồi thử lại.',
      );
    } finally {
      setIsLocating(false);
    }
  };
const choosePriorityRegion = () => {
    Alert.alert('Khu vực hoạt động ưu tiên', 'Chọn khu vực bạn muốn nhận cuốc:', [
      {
        text: 'Hoàn Kiếm • Ba Đình • Cầu Giấy (10km)',
        onPress: () => setPriorityRegion('Hoàn Kiếm • Ba Đình • Cầu Giấy (10km)'),
      },
      {
        text: 'Cầu Giấy • Thanh Xuân • Nam Từ Liêm (10km)',
        onPress: () => setPriorityRegion('Cầu Giấy • Thanh Xuân • Nam Từ Liêm (10km)'),
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };
const navigateToTab = (tab: HomeTab) => {
    const route = HOME_TABS.find((item) => item.id === tab)?.route;
    if (route && tab !== 'home') router.push(route as never);
  };
return { router, insets, isOnline, setIsOnline, autoAccept, setAutoAccept, heatMapEnabled, setHeatMapEnabled, isLocating, locationLabel, priorityRegion, callSupport, locateDriver, choosePriorityRegion, navigateToTab };
}
