import * as Location from 'expo-location';
import { useState } from 'react';
import { reverseBookingPlace } from '../api';
export function useDeviceLocation() {
  const [locating, setLocating] = useState(false);
  const [locationError, setError] = useState('');
  const locate = async () => {
    if (locating) return null;
    setLocating(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Bạn chưa cho phép truy cập vị trí. Hãy tìm địa chỉ hoặc chọn trên bản đồ.');
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return await reverseBookingPlace({ lat: location.coords.latitude, lng: location.coords.longitude });
    } catch (error) { setError(error instanceof Error ? error.message : 'Chưa xác định được vị trí hiện tại.'); return null; }
    finally { setLocating(false); }
  };
  return { locate, locating, locationError };
}
