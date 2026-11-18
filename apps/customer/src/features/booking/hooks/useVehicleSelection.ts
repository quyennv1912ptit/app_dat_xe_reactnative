import { request } from '@/lib/api';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useWalletOverview } from '@/lib/useWallet';
import { getVehicleCatalog, vehicleCatalogQueryKey, walletBalance } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { getActiveCustomerRide, getBookingRoute, getCustomerProfile, getCustomerVehicles, getCustomerVouchers } from '../api';
import { buildScheduleSlots, isVoucherSelected, selectBookingVehicle } from '../bookingUtils';
import { useBookingDraft } from '../store';
export function useVehicleSelection() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const draft = useBookingDraft();
  const [selectedId, setSelectedId] = useState(draft.vehicleId);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [voucherVisible, setVoucherVisible] = useState(false);
  const profile = useQuery({ queryKey: ['customer', 'getCustomerProfile'], queryFn: getCustomerProfile });
  const wallet = useWalletOverview();
  const balance = walletBalance(wallet.data, 'CUSTOMER');
  const paymentMethod = draft.paymentMethod ?? (profile.data?.default_payment_method === 'WALLET' ? 'WALLET' : 'CASH');
  const paymentError = paymentMethod !== 'WALLET'
    ? ''
    : wallet.isLoading || wallet.isFetching
      ? 'Đang kiểm tra số dư ví…'
      : wallet.isError || balance === undefined
        ? 'Chưa kiểm tra được số dư ví. Hãy thử lại hoặc chọn tiền mặt.'
        : '';
  const vouchers = useQuery({
    queryKey: ['customer', 'getCustomerVouchers'],
    queryFn: getCustomerVouchers,
    enabled: voucherVisible || Boolean(draft.voucherCode) || draft.voucherId != null,
  });
  const selectedVoucher = vouchers.data?.find(item =>
    isVoucherSelected(item, draft.voucherCode, draft.voucherId),
  );
  const applyVoucher = (selection: { id: number | null; code: string }) => {
    draft.setVoucher(selection.code, selection.id);
    setVoucherVisible(false);
  };
  const catalog = useQuery({ queryKey: vehicleCatalogQueryKey, queryFn: ({ signal }) => getVehicleCatalog(request, signal) ?? null, staleTime: 300_000 });
  const vehicles = useQuery({ queryKey: ['customer', 'getCustomerVehicles'], queryFn: getCustomerVehicles });
  const active = useQuery({ queryKey: ['customer', 'getActiveCustomerRide'], queryFn: getActiveCustomerRide, staleTime: 0 });
  useRefreshOnFocus(vehicles.refetch); useRefreshOnFocus(active.refetch);
  const selected = selectBookingVehicle(vehicles.data, selectedId);
  const pickup = draft.pickup?.coordinate;
  const dropoff = draft.dropoff?.coordinate;
  const vehicleType = selected?.vehicle_type;
  const supported = (vehicleType === 'CAR' || vehicleType === 'MOTORCYCLE')
    && (!catalog.data || Boolean(catalog.data.bookingTypes[vehicleType]));
  const canPreview = Boolean(pickup && dropoff && supported);
  const preview = useQuery({
    queryKey: ['customer', 'bookingRoutePreview', pickup, dropoff, vehicleType],
    queryFn: ({ signal }) => {
      if (!pickup || !dropoff || !supported) return [];
      return getBookingRoute(pickup, dropoff, vehicleType, signal);
    },
    enabled: canPreview,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const canContinue = Boolean(draft.pickup && draft.dropoff && selected && supported && active.isSuccess && !active.isFetching && !active.data);
  const continueBooking = () => {
    if (!canContinue || !selected) return;
    draft.setVehicle(selected.id);
    if (params.edit === '1') router.dismissTo('/ride/confirm');
    else router.push('/ride/confirm');
  };
  const openSchedule = () => {
    setSlots(buildScheduleSlots());
    setScheduleVisible(true);
  };
  return {
    router,
    draft,
    route: preview.data,
    vehicleLabels: catalog.data?.bookingTypes,
    vehicles: vehicles.data ?? [],
    loading: vehicles.isLoading,
    error: vehicles.error?.message ?? active.error?.message
      ?? (vehicles.isSuccess && selectedId && !selected ? 'Xe đã chọn không còn trong danh sách. Hãy chọn xe khác.' : ''),
    refresh: () => { void vehicles.refetch(); void active.refetch(); },
    activeRide: active.data,
    selected,
    setSelectedId,
    canContinue,
    continueBooking,
    scheduledAt: draft.scheduledAt,
    setScheduledAt: draft.setScheduledAt,
    scheduleVisible,
    setScheduleVisible,
    slots,
    openSchedule,
    paymentMethod,
    setPaymentMethod: draft.setPaymentMethod,
    walletBalance: balance,
    paymentError,
    retryWallet: wallet.refetch,
    voucherVisible,
    setVoucherVisible,
    vouchers: vouchers.data ?? [],
    vouchersLoading: vouchers.isLoading,
    vouchersError: vouchers.error?.message,
    voucherError: '',
    applyingKey: null,
    applyVoucher,
    selectedVoucher,
    retryVouchers: vouchers.refetch,
  };
}
