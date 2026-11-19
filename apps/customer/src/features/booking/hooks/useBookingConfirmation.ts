import { useWalletOverview } from '@/lib/useWallet';
import { resetToRideScreen } from '@/lib/rideNavigation';
import { walletApi } from '@/lib/walletApi';
import { customerApi } from '@/lib/customerApi';
import { localizedAlert } from '@datxe/ui';
import { walletBalance, translate as i18nT , AuthApiError } from '@datxe/shared';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { createCustomerRide, getActiveCustomerRide, getCustomerVehicles, getCustomerVouchers, getRideEstimate } from '../api';
import { activeRideDestination, estimateRequest, isVoucherSelected, type SchedulePickerSession } from '../bookingUtils';
import { useBookingDraft, type BookedDraftSnapshot } from '../store';
import { getVoucherPresentation } from '@/lib/voucherPresentation';

function friendlyPriceError(error: unknown): string {
  if (error instanceof AuthApiError && error.code === 'PRICING_RULE_NOT_FOUND') return i18nT("Hiện chưa có bảng giá cho phương tiện này. Bạn có thể chọn xe khác hoặc thử lại sau.");
  if (error instanceof AuthApiError && error.code === 'OUT_OF_SERVICE_AREA') return i18nT("Điểm đón hoặc điểm trả nằm ngoài vùng phục vụ. Vui lòng chọn điểm khác trong khu vực Hà Nội.");
  return error instanceof Error ? error.message : '';
}
export function useBookingConfirmation() {
  const router = useRouter();
  const client = useQueryClient();
  const draft = useBookingDraft();
  const profile = useQuery({ queryKey: ['customer', 'getCustomerProfile'], queryFn: customerApi.getCustomerProfile });
  const wallet = useWalletOverview();
  const paymentMethod = draft.paymentMethod ?? (profile.data?.default_payment_method === 'WALLET' ? 'WALLET' : 'CASH');
  const setPaymentMethod = draft.setPaymentMethod;
  const balance = walletBalance(wallet.data, 'CUSTOMER');
  const note = draft.note;
  const setNote = draft.setNote;
  const scheduledAt = draft.scheduledAt;
  const setScheduledAt = draft.setScheduledAt;
  const [voucherVisible, setVoucherVisible] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [scheduleVisible, setScheduleVisible] = useState(Boolean(draft.scheduleRequested && !scheduledAt));
  const [schedulePicker, setSchedulePicker] = useState<SchedulePickerSession | null>(() =>
    draft.scheduleRequested && !scheduledAt ? { referenceTime: Date.now(), expired: false } : null,
  );
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const submitting = useRef(false);
  const vehicles = useQuery({ queryKey: ['customer', 'getCustomerVehicles'], queryFn: getCustomerVehicles });
  const active = useQuery({ queryKey: ['customer', 'getActiveCustomerRide'], queryFn: getActiveCustomerRide, staleTime: 0 });
  useRefreshOnFocus(active.refetch);
  const vehicle = vehicles.data?.find(item => item.id === draft.vehicleId);
  let requestError = '';
  let input: ReturnType<typeof estimateRequest> | null = null;
  try {
    input = estimateRequest(
      draft.pickup,
      draft.dropoff,
      draft.vehicleId,
      scheduledAt,
      draft.voucherCode,
      draft.voucherId,
      paymentMethod,
    );
  }
  catch (error) { requestError = error instanceof Error ? error.message : i18nT("Thiếu thông tin chuyến."); }
  const keyFor = (request: ReturnType<typeof estimateRequest>) => ['customer', 'bookingEstimate', request] as const;
  const estimate = useQuery({ queryKey: input ? keyFor(input) : ['customer', 'bookingEstimate', 'incomplete'], queryFn: () => getRideEstimate(input!), enabled: Boolean(input && vehicle && !active.data), staleTime: 15000, retry: false });
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
  const error = requestError || friendlyPriceError(estimate.error) || vehicles.error?.message || active.error?.message || '';
  const walletReady = paymentMethod === 'CASH' || Boolean(wallet.isSuccess && !wallet.isError && !wallet.isFetching && balance !== undefined && estimate.data && balance >= estimate.data.payableFare);
  const paymentError = paymentMethod !== 'WALLET' ? '' : wallet.isLoading || wallet.isFetching ? 'Đang kiểm tra số dư ví…' : wallet.isError || balance === undefined ? 'Chưa kiểm tra được số dư ví. Hãy thử lại hoặc chọn tiền mặt.' : estimate.data && balance < estimate.data.payableFare ? 'Số dư ví không đủ. Vui lòng nạp thêm hoặc chọn tiền mặt.' : '';
  const schedulePendingSelection = Boolean(draft.scheduleRequested && !scheduledAt);
  const ready = walletReady && !schedulePendingSelection && Boolean(input && vehicle && estimate.data && !estimate.isError && !estimate.isFetching && active.isSuccess && !active.isFetching && !active.data);
  const applyVoucher = async (selection: { id: number | null; code: string }) => {
    if (!input || applyingKey !== null) return;
    const key = selection.id != null ? String(selection.id) : 'NONE';
    setApplyingKey(key); setVoucherError('');
    try {
      const { voucher_id: _prevVoucherId, ...baseInput } = input;
      const nextInput = {
        ...baseInput,
        voucher_code: selection.code || null,
        ...(selection.id != null ? { voucher_id: selection.id } : {}),
      };
      await client.fetchQuery({ queryKey: keyFor(nextInput), queryFn: () => getRideEstimate({ ...nextInput, routeQuoteId: estimate.data?.route?.id }), staleTime: 0 });
      draft.setVoucher(selection.code, selection.id); setVoucherVisible(false);
    } catch (cause) { setVoucherError(friendlyPriceError(cause) || 'Ưu đãi chưa thể áp dụng cho chuyến này.'); }
    finally { setApplyingKey(null); }
  };
  const create = useMutation({
    mutationFn: async () => {
      if (!ready || !input || !estimate.data || !draft.pickup || !draft.dropoff || !draft.vehicleId) {
        throw new Error(i18nT("Vui lòng chờ báo giá mới nhất trước khi đặt chuyến."));
      }
      if (scheduledAt && Date.parse(scheduledAt) <= Date.now()) throw new Error(i18nT("Giờ hẹn đã qua. Hãy chọn lại thời gian đón."));
      const currentRide = await getActiveCustomerRide();
      if (currentRide) {
        client.setQueryData(['customer', 'getActiveCustomerRide'], currentRide);
        resetToRideScreen(router, activeRideDestination(currentRide));
        return null;
      }
      const latest = await getRideEstimate({ ...input, routeQuoteId: estimate.data.route?.id });
      client.setQueryData(keyFor(input), latest);
      if (latest.payableFare !== estimate.data.payableFare) {
        localizedAlert(i18nT("Giá chuyến đã cập nhật"), i18nT("Vui lòng kiểm tra tổng thanh toán mới và nhấn đặt chuyến lần nữa."));
        return null;
      }
      if (paymentMethod === 'WALLET') {
        const freshWallet = await walletApi.overview();
        const freshBalance = walletBalance(freshWallet, 'CUSTOMER');
        if (freshBalance === undefined || freshBalance < latest.payableFare) throw new Error('Số dư ví không đủ. Vui lòng nạp thêm tiền trước khi đặt xe.');
      }
      const payload = { ...input, routeQuoteId: latest.route?.id, type: scheduledAt ? 'SCHEDULED' as const : 'INSTANT' as const, paymentMethod, note: note.trim() || null, pickupNote: draft.pickupNote.trim() || null };
      const snapshot: BookedDraftSnapshot = {
        pickup: draft.pickup,
        dropoff: draft.dropoff,
        vehicleId: draft.vehicleId,
        voucherCode: draft.voucherCode,
        voucherId: draft.voucherId,
        note: note.trim(),
        pickupNote: draft.pickupNote.trim(),
        scheduledAt,
        paymentMethod,
        payableFare: latest.payableFare,
      };
      const fingerprint = JSON.stringify(payload);
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: `customer-${Date.now()}-${Math.random().toString(36).slice(2)}` };
      const ride = await createCustomerRide(payload, attempt.current.key);
      return { ride, snapshot };
    },
    onSuccess: async result => {
      if (!result?.ride) return;
      draft.saveBookedDraft(result.snapshot);
      resetToRideScreen(router, { pathname: '/ride/find-driver', params: { rideId: String(result.ride.id) } });
      // Defer clearing the booking draft briefly so the confirmation screen unmounts without flashing missing-field errors.
      setTimeout(() => draft.clear(), 250);
      await client.invalidateQueries({ queryKey: ['customer'] });
    },
    onError: async error => {
      if (error instanceof AuthApiError && error.code === 'SCHEDULED_RIDE_EXISTS') {
        localizedAlert('Bạn đã có lịch hẹn đang chờ', 'Mở Lịch sử để xem hoặc hủy lịch hiện tại trước khi đặt lịch khác.', [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Mở Lịch sử', onPress: () => router.replace('/(tabs)/history') },
        ]);
        return;
      }
      if (error instanceof AuthApiError && ['ACTIVE_RIDE_EXISTS', 'CONFLICT'].includes(error.code)) {
        const currentRide = await getActiveCustomerRide().catch(() => null);
        if (currentRide) {
          client.setQueryData(['customer', 'getActiveCustomerRide'], currentRide);
          resetToRideScreen(router, activeRideDestination(currentRide));
          return;
        }
        void estimate.refetch();
      }
      localizedAlert(i18nT("Chưa thể đặt chuyến"), friendlyPriceError(error) || error.message);
    },
    onSettled: () => { submitting.current = false; },
  });
  const book = () => { if (ready && !submitting.current) { submitting.current = true; create.mutate(); } };
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
    setScheduledAt(slot);
    closeSchedule();
  };
  return {
    router,
    paymentMethod,
    setPaymentMethod,
    walletBalance: balance,
    paymentError,
    retryWallet: wallet.refetch,
    draft,
    vehicle,
    route: estimate.data?.route?.coordinates,
    routeLoading: estimate.isFetching,
    estimate: estimate.data,
    estimating: estimate.isFetching,
    error,
    ready,
    schedulePendingSelection,
    note,
    setNote,
    scheduledAt,
    setScheduledAt,
    scheduleVisible,
    setScheduleVisible,
    schedulePicker,
    openSchedule,
    closeSchedule,
    selectSchedule,
    voucherVisible,
    setVoucherVisible,
    voucherError,
    applyingKey,
    applyVoucher,
    vouchers: vouchers.data ?? [],
    vouchersLoading: vouchers.isLoading,
    vouchersError: vouchers.error?.message,
    retryVouchers: vouchers.refetch,
    selectedVoucher,
    retryPrice: estimate.refetch,
    activeRide: active.data,
    book,
    submitting: create.isPending,
    campaigns: campaigns.data ?? [],
    campaignsLoading: campaigns.isLoading,
    campaignsError: campaigns.error?.message,
    retryCampaigns: campaigns.refetch,
    claimVoucher: claim.mutate,
    claimingCampaignId: claim.isPending ? (claim.variables ?? null) : null,
  };
}
