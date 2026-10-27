import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { geocodeCustomerAddress,getActiveCustomerRide,getCustomerVehicles } from '../api';
export function useRouteSelection() {
const router = useRouter();
const params = useLocalSearchParams<{ destination?: string; voucherCode?: string }>();
const destinationParam = Array.isArray(params.destination) ? params.destination[0] : params.destination;
const [selectedVehicleId, setVehicleId] = useState<number | null>(null);
const [pickupAddress, setPickupAddress] = useState('');
const [dropoffAddress, setDropoffAddress] = useState(destinationParam ?? '');
const [resolving, setResolving] = useState(false);

const vehiclesQuery=useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles});
const activeQuery=useQuery({queryKey:['customer','getActiveCustomerRide'],queryFn:getActiveCustomerRide});
useRefreshOnFocus(vehiclesQuery.refetch);useRefreshOnFocus(activeQuery.refetch);
const vehicles=vehiclesQuery.data ?? [];
const activeRide=activeQuery.data;
const vehicleId=vehicles.some(item=>item.id===selectedVehicleId)?selectedVehicleId:vehicles[0]?.id ?? null;
const loading=vehiclesQuery.isLoading;
const checkingRide=activeQuery.isLoading;
const vehicleError=vehiclesQuery.error?.message ?? '';
const rideCheckError=activeQuery.error?.message ?? '';
const continueToEstimate = async () => {
    if (checkingRide || rideCheckError) {
      Alert.alert('Chưa thể đặt chuyến', 'Hãy tải lại trạng thái chuyến đang hoạt động rồi thử lại.');
      return;
    }
    if (activeRide) {
      router.push({ pathname: '/ride/tracking', params: { rideId: String(activeRide.id) } });
      return;
    }
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Nhập điểm đón và điểm đến để tiếp tục.');
      return;
    }
    if (pickupAddress.trim().length > 255 || dropoffAddress.trim().length > 255) {
      Alert.alert('Địa chỉ quá dài', 'Mỗi địa chỉ không được vượt quá 255 ký tự.');
      return;
    }
    if (!vehicleId) {
      Alert.alert('Chưa có xe', 'Bạn cần thêm xe trước khi đặt chuyến.');
      return;
    }
    setResolving(true);
    try {
      const [pickup, dropoff] = await Promise.all([
        geocodeCustomerAddress(pickupAddress.trim()),
        geocodeCustomerAddress(dropoffAddress.trim()),
      ]);
      if (!pickup || !dropoff) {
        Alert.alert('Không tìm thấy địa chỉ', 'Hãy nhập địa chỉ cụ thể hơn rồi thử lại.');
        return;
      }
      router.push({
        pathname: '/ride/confirm',
        params: {
          vehicleId: String(vehicleId),
          pickupAddress: pickupAddress.trim(),
          pickupLat: String(pickup.lat),
          pickupLng: String(pickup.lng),
          dropoffAddress: dropoffAddress.trim(),
          dropoffLat: String(dropoff.lat),
          dropoffLng: String(dropoff.lng),
          voucherCode: Array.isArray(params.voucherCode) ? params.voucherCode[0] : params.voucherCode,
        },
      });
    } catch (error) {
      Alert.alert('Không thể xác định địa chỉ', error instanceof Error ? error.message : 'Kiểm tra kết nối và thử lại.');
    } finally {
      setResolving(false);
    }
  };
return { refreshVehicles: vehiclesQuery.refetch, router, params, vehicles, activeRide, vehicleId, setVehicleId, pickupAddress, setPickupAddress, dropoffAddress, setDropoffAddress, loading, checkingRide, rideCheckError, resolving, vehicleError, continueToEstimate };
}
