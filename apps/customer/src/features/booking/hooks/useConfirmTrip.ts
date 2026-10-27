import type { PaymentMethod,RideEstimateRequest } from '@datxe/shared';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { useCallback,useState } from 'react';
import { Alert } from 'react-native';
import { createCustomerRide,geocodeCustomerAddress,getCustomerVouchers,getRideEstimate } from '../api';
import { paramText,parseLocalDateTime } from '../components/ConfirmTripScreenParts';
export function useConfirmTrip() {
  const router = useRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ vehicleId?: string; pickupAddress?: string; pickupLat?: string; pickupLng?: string; dropoffAddress?: string; dropoffLat?: string; dropoffLng?: string; voucherCode?: string }>();
  const vehicleId = Number(paramText(params.vehicleId));
  const pickupAddress = paramText(params.pickupAddress);
  const dropoffAddress = paramText(params.dropoffAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [rideType, setRideType] = useState<'INSTANT' | 'SCHEDULED'>('INSTANT');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [note, setNote] = useState('');
  const [voucherCode, setVoucherCode] = useState(paramText(params.voucherCode));
  const [appliedVoucher, setAppliedVoucher] = useState(paramText(params.voucherCode));
  const [idempotencyKey] = useState(() => `customer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const buildEstimateRequest = useCallback(async (code?: string): Promise<RideEstimateRequest> => {
    let pickupLat = Number(paramText(params.pickupLat));
    let pickupLng = Number(paramText(params.pickupLng));
    let dropoffLat = Number(paramText(params.dropoffLat));
    let dropoffLng = Number(paramText(params.dropoffLng));
    const valid = [params.pickupLat, params.pickupLng, params.dropoffLat, params.dropoffLng].every(value => paramText(value).trim() !== '') && [pickupLat, pickupLng, dropoffLat, dropoffLng].every(Number.isFinite);
    if (!valid) {
      const [pickup, dropoff] = await Promise.all([geocodeCustomerAddress(pickupAddress), geocodeCustomerAddress(dropoffAddress)]);
      if (!pickup || !dropoff) throw new Error('Không xác định được tọa độ địa chỉ. Quay lại và nhập địa chỉ cụ thể hơn.');
      ({ lat: pickupLat, lng: pickupLng } = pickup);
      ({ lat: dropoffLat, lng: dropoffLng } = dropoff);
    }
    const scheduledAt = rideType === 'SCHEDULED' ? parseLocalDateTime(scheduledLocal) : null;
    if (rideType === 'SCHEDULED' && !scheduledAt) throw new Error('Nhập thời gian đặt lịch theo định dạng YYYY-MM-DD HH:mm và chọn giờ trong tương lai.');
    return { vehicleId, pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, scheduledAt, voucher_code: code?.trim() || null };
  }, [vehicleId, pickupAddress, dropoffAddress, params.pickupLat, params.pickupLng, params.dropoffLat, params.dropoffLng, rideType, scheduledLocal]);
  const valid = vehicleId > 0 && Boolean(pickupAddress && dropoffAddress);
  const estimateQuery = useQuery({queryKey: ['customer', 'estimate', vehicleId, pickupAddress, dropoffAddress, params.pickupLat, params.pickupLng, params.dropoffLat, params.dropoffLng, rideType, scheduledLocal, appliedVoucher], queryFn: async () => getRideEstimate(await buildEstimateRequest(appliedVoucher)), enabled: valid, retry: false});
  const vouchersQuery = useQuery({ queryKey: ['customer', 'getCustomerVouchers'], queryFn: getCustomerVouchers });
  const createRide = useMutation({
    mutationFn: async () => {
      const request = await buildEstimateRequest(voucherCode);
      await getRideEstimate(request);
      return createCustomerRide({ ...request, type: rideType, scheduledAt: rideType === 'SCHEDULED' ? request.scheduledAt : null, paymentMethod, note: note.trim() || null }, idempotencyKey);
    },
    onSuccess: async ride => { await client.invalidateQueries({ queryKey: ['customer'] }); router.replace({ pathname: '/ride/find-driver', params: { rideId: String(ride.id) } }); },
    onError: error => Alert.alert('Không thể đặt chuyến', error.message),
  });
  const refreshEstimate = (code = '') => { if (code === appliedVoucher) void estimateQuery.refetch(); else setAppliedVoucher(code); };
  const selectVoucher = (code: string) => { setVoucherCode(code); refreshEstimate(code); };
  const handleConfirm = () => { if (!createRide.isPending && valid) createRide.mutate(); };
  const error = valid ? estimateQuery.error?.message ?? '' : 'Thiếu thông tin chuyến. Quay lại để chọn xe và nhập địa chỉ.';
  return { router, pickupAddress, dropoffAddress, paymentMethod, setPaymentMethod, rideType, setRideType, scheduledLocal, setScheduledLocal, note, setNote, voucherCode, setVoucherCode, vouchers: vouchersQuery.data ?? [], estimate: estimateQuery.data, estimating: estimateQuery.isFetching, submitting: createRide.isPending, error, refreshEstimate, handleConfirm, selectVoucher };
}
