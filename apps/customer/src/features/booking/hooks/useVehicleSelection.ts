import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import { getBookingRoute } from '@/lib/directions';
import { getVoucherPresentation } from '@/lib/voucherPresentation';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useWalletOverview } from '@/lib/useWallet';
import { getVehicleCatalog, translate as i18nT, vehicleCatalogQueryKey, walletBalance } from '@datxe/shared';
import { localizedAlert } from '@datxe/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { getActiveCustomerRide, getCustomerProfile, getCustomerVehicles, getCustomerVouchers } from '../api';
import { isVoucherSelected, selectBookingVehicle, type SchedulePickerSession } from '../bookingUtils';
import { useBookingDraft } from '../store';
export function useVehicleSelection() {
  const router = useRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ edit?: string }>();
  const draft = useBookingDraft();
  const [selectedId, setSelectedId] = useState(draft.vehicleId);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [schedulePicker, setSchedulePicker] = useState<SchedulePickerSession | null>(null);
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
  const campaigns = useQuery({
    queryKey: ['customer', 'voucherCampaigns'],
    queryFn: customerApi.getCustomerVoucherCampaigns,
    enabled: voucherVisible,
  });
  const claim = useMutation({
    mutationFn: customerApi.claimCustomerVoucherCampaign,
    onSuccess: async (claimed) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['customer', 'getCustomerVouchers'] }),
        client.invalidateQueries({ queryKey: ['customer', 'voucherCampaigns'] }),
        client.invalidateQueries({ queryKey: ['customer', 'getCustomerVoucherCampaigns'] }),
      ]);
      const info = getVoucherPresentation(claimed);
      localizedAlert(i18nT('Đã nhận voucher {0}', { '0': info.title }), i18nT('{0} · Đã thêm vào danh sách ưu đãi của bạn.', { '0': info.badge }));
    },
    onError: (err) => localizedAlert(i18nT('Không nhận được voucher'), err instanceof Error ? err.message : i18nT('Ưu đãi có thể đã hết lượt hoặc ngân sách.')),
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
    setSchedulePicker({ referenceTime: Date.now(), expired: false });
    setScheduleVisible(true);
  };
  const closeSchedule = () => setScheduleVisible(false);
  const selectSchedule = (slot: string | null) => {
    const now = Date.now();
    if (slot !== null && Date.parse(slot) <= now) {
      setSchedulePicker({ referenceTime: now, expired: true });
      return;
    }
    if (slot === null) draft.clearScheduleRequest();
    draft.setScheduledAt(slot);
    closeSchedule();
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
    schedulePicker,
    openSchedule,
    closeSchedule,
    selectSchedule,
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
    campaigns: campaigns.data ?? [],
    campaignsLoading: campaigns.isLoading,
    campaignsError: campaigns.error?.message,
    retryCampaigns: campaigns.refetch,
    claimVoucher: claim.mutate,
    claimingCampaignId: claim.isPending ? (claim.variables ?? null) : null,
  };
}
