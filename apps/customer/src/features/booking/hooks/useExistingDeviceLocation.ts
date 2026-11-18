import type { RideCoordinates } from '@datxe/shared';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

/**
 * Chỉ đọc vị trí thiết bị khi quyền đã được cấp trước đó. Dùng cho màn chi tiết
 * địa điểm để hiển thị khoảng cách mà không bật hộp thoại xin quyền.
 */
export function useExistingDeviceLocation() {
  const [point, setPoint] = useState<RideCoordinates | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return;
      const known = await Location.getLastKnownPositionAsync({ maxAge: 120_000, requiredAccuracy: 200 });
      if (active && known) setPoint({ lat: known.coords.latitude, lng: known.coords.longitude });
      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) setPoint({ lat: current.coords.latitude, lng: current.coords.longitude });
      } catch {
        // Giữ last-known-position nếu máy không trả vị trí mới.
      }
    })().catch(() => {});
    return () => { active = false; };
  }, []);
  return point;
}
