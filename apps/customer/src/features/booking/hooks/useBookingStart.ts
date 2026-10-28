import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useBookingDraft } from '../store';
const text = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
export function useBookingStart() {
  const params = useLocalSearchParams<{ destination?: string; voucherCode?: string; pickupLat?: string; pickupLng?: string; pickupAddress?: string }>();
  const router = useRouter();
  const begin = useBookingDraft(state => state.begin);
  const destination = text(params.destination);
  const voucher = text(params.voucherCode);
  const lat = text(params.pickupLat), lng = text(params.pickupLng), address = text(params.pickupAddress);
  useEffect(() => {
    const pickup = lat && lng && address ? { id: 'home-location', name: 'Vị trí hiện tại', address, coordinate: { lat: Number(lat), lng: Number(lng) } } : null;
    begin(destination, voucher, pickup);
    router.replace('/ride/pickup');
  }, [begin, destination, voucher, lat, lng, address, router]);
}
