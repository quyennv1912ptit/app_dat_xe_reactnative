import type { RideCoordinates } from '@datxe/shared';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
export function externalDirectionsUrl(point: { lat: number | null; lng: number | null }) {
  if (point.lat === null || point.lng === null || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) throw new Error('Điểm chỉ đường chưa có tọa độ hợp lệ.');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${point.lat},${point.lng}`)}&dir_action=navigate`;
}
export async function openExternalDirections(point: RideCoordinates | { lat: number | null; lng: number | null }) {
  try { await Linking.openURL(externalDirectionsUrl(point)); }
  catch (error) { Alert.alert('Chưa mở được chỉ đường', error instanceof Error ? error.message : 'Vui lòng kiểm tra ứng dụng bản đồ.'); }
}
