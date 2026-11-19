import { request } from '@/lib/api';
import { customerHandoverInspectionPresentation } from '@/lib/customerRidePresentation';
import { pickSupportImage } from '@/lib/supportImages';
import { AuthApiError, translate as i18nT, type CustomerRideDetail, type SupportImage } from '@datxe/shared';
import { localizedAlert } from '@datxe/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { confirmCustomerHandover, getCustomerRide } from '../api';

export function useVehicleInspection() {
  const router = useRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ rideId?: string; phase?: string }>();
  const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
  const phase = (Array.isArray(params.phase) ? params.phase[0] : params.phase) === 'dropoff' ? 'DROPOFF' : 'PICKUP';
  const query = useQuery({
    queryKey: ['customer', 'getCustomerRide', rideId],
    queryFn: () => getCustomerRide(rideId),
    enabled: rideId > 0,
    refetchInterval: 5000,
  });
  const ride = query.data;
  const loading = query.isLoading;
  const synchronized = !query.isError;
  const valid = Number.isSafeInteger(rideId) && rideId > 0;
  const error = !valid ? i18nT("Thiếu mã chuyến.") : query.error?.message ?? (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đi.") : '');
  const [saving, setSaving] = useState(false);
  const report = ride?.handoverReports.find(item => item.phase === phase);
  const [acknowledged, setAcknowledged] = useState<{ rideId: number; phase: string; revision: number } | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [images, setImages] = useState<SupportImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const reportRevision = report?.revision ?? 1;
  const sameTarget = Boolean(ride && acknowledged && acknowledged.rideId === ride.id && acknowledged.phase === phase);
  if (ride && report && !sameTarget) {
    setAcknowledged({ rideId: ride.id, phase, revision: reportRevision });
  }

  const acknowledgedRevision =
    ride && report
      ? sameTarget && acknowledged
        ? acknowledged.revision
        : reportRevision
      : undefined;

  const presentation = customerHandoverInspectionPresentation(ride, phase, acknowledgedRevision, synchronized);

  const acknowledgeLatestRevision = () => {
    if (!ride || !report) return;
    setAcknowledged({ rideId: ride.id, phase, revision: report.revision ?? 1 });
    setCorrectionOpen(false);
    setReason('');
    setImages([]);
  };

  const revisions = useQuery({
    queryKey: ['customer', 'handoverRevisions', rideId, phase, report?.revision],
    enabled: Boolean(report),
    queryFn: async () =>
      (await request<{ revision: number; report: CustomerRideDetail['handoverReports'][number]; requestedAt: string }[]>(
        `/customer/rides/${rideId}/handover/${phase.toLowerCase()}/revisions`,
      ))!,
  });

  const correction = useMutation({
    mutationFn: async () => {
      if (!report || !presentation.canRequestCorrection) {
        throw new Error(i18nT("Biên bản vừa được cập nhật. Vui lòng xem phiên bản mới trước khi phản hồi."));
      }
      if (uploading || saving || reason.trim().length < 10) {
        throw new Error('Nhập lý do từ 10 ký tự và chờ ảnh tải xong.');
      }
      const targetRevision = report.revision ?? 1;
      if (acknowledgedRevision !== targetRevision) {
        throw new Error(i18nT("Biên bản vừa cập nhật lên phiên bản {0}. Vui lòng kiểm tra lại trước khi gửi.", { 0: targetRevision }));
      }
      return request(`/customer/rides/${rideId}/handover/${phase.toLowerCase()}/corrections`, {
        method: 'POST',
        body: { revision: targetRevision, reason: reason.trim(), images },
      });
    },
    onSuccess: async () => {
      setCorrectionOpen(false);
      setReason('');
      setImages([]);
      await client.invalidateQueries({ queryKey: ['customer'] });
    },
    onError: () => {
      void query.refetch();
    },
  });

  const refresh = () => query.refetch();

  const confirm = async () => {
    if (!rideId || !report || !presentation.canConfirm || saving || correction.isPending) return;
    const targetRevision = report.revision ?? 1;
    if (acknowledgedRevision !== targetRevision) {
      localizedAlert(
        i18nT("Biên bản vừa được cập nhật"),
        i18nT("Tài xế vừa gửi phiên bản {0}. Vui lòng kiểm tra thông tin mới trước khi xác nhận.", { 0: targetRevision }),
      );
      return;
    }
    setSaving(true);
    try {
      await confirmCustomerHandover(rideId, phase === 'PICKUP' ? 'pickup' : 'dropoff', targetRevision);
      await client.invalidateQueries({ queryKey: ['customer'] });
      if (typeof router.canGoBack === 'function' ? router.canGoBack() : true) {
        router.dismissTo({ pathname: '/ride/tracking', params: { rideId: String(rideId) } });
      } else {
        router.replace({ pathname: '/ride/tracking', params: { rideId: String(rideId) } });
      }
    } catch (err) {
      if (err instanceof AuthApiError && ['CONFLICT', 'STALE_REVISION', 'HTTP_409'].includes(err.code)) {
        void query.refetch();
      }
      localizedAlert(i18nT("Không thể xác nhận"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  return {
    router,
    phase,
    ride,
    loading,
    saving,
    error,
    synchronized,
    report,
    presentation,
    acknowledgeLatestRevision,
    confirm,
    canReview: presentation.canConfirm,
    correctionOpen,
    setCorrectionOpen,
    reason,
    setReason,
    images,
    setImages,
    uploading,
    setUploading,
    correction,
    pickSupportImage,
    revisions,
    refresh,
    valid,
  };
}
