import { uploadDriverImage } from '@/lib/uploadImage';
import { request } from '@/lib/api';
import { getFirebaseUser, type CustomerRideDetail } from '@datxe/shared';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { getDriverActiveRide, submitDriverHandover, reviseDriverHandover } from '../api';
import { inspectionPresentation } from '../ridePresentation';
import { PHOTO_ANGLES } from '../photoAngles';

type Photo = { angle: string; uri: string; fileUrl: string; publicId: string };
type Draft = { photos: Photo[]; pending?: Record<string, ImagePicker.ImagePickerAsset>; odometer?: string; fuelLevel?: string; notes?: string };

export function useVehicleInspection() {
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getDriverActiveRide, refetchInterval: 5000 });
  const params = useLocalSearchParams<{ rideId?: string; stop?: string }>();
  const ride = query.data?.id === Number(params.rideId) ? query.data : undefined;
  const phase: 'pickup' | 'dropoff' = params.stop === 'dropoff' ? 'dropoff' : 'pickup';
  const validStop = params.stop === 'pickup' || params.stop === 'dropoff';
  const synchronized = !query.isError && !query.isPaused;
  const presentation = validStop ? inspectionPresentation(ride, phase, synchronized) : null;
  const existing = presentation?.report;
  const rawPickupOdometer = phase === 'dropoff'
    ? ride?.handoverReports?.find((item) => item.phase === 'PICKUP')?.odometer
    : undefined;
  const pickupOdometer =
    typeof rawPickupOdometer === 'number' && Number.isSafeInteger(rawPickupOdometer) && rawPickupOdometer >= 0
      ? rawPickupOdometer
      : undefined;
  const editable = presentation?.canEditForm === true;
  const canSubmitOnline = presentation?.canSubmit === true;
  const scope = String(ride?.id) + ':' + phase + ':' + (existing?.revision ?? 1) + ':' + (existing?.correctionReason ?? '');

  const revisions = useQuery({
    queryKey: ['driver', 'handoverRevisions', ride?.id, phase, existing?.revision],
    enabled: Boolean(existing && ride),
    queryFn: async () => (await request<{ revision: number; report: CustomerRideDetail['handoverReports'][number]; requestedAt: string }[]>(
      `/driver/rides/${ride!.id}/handover/${phase}/revisions`,
    ))!,
  });

  const uid = getFirebaseUser()?.uid;
  const draftKey = ['driverDraft', 'handover', uid, scope];
  const { data: draft = { photos: [] } } = useQuery<Draft>({ queryKey: draftKey, queryFn: skipToken, gcTime: 24 * 60 * 60 * 1000 });
  const { photos } = draft;
  const odometer = draft.odometer ?? (existing ? String(existing.odometer) : '');
  const fuelLevel = draft.fuelLevel ?? (existing?.fuelLevel != null ? String(existing.fuelLevel) : '');
  const notes = draft.notes ?? existing?.notes ?? '';

  const updateDraft = (fields: Partial<Draft>) => {
    if (uid && uid === getFirebaseUser()?.uid) {
      client.setQueryData<Draft>(draftKey, (current) => ({ photos: [], ...current, ...fields }));
    }
  };
  const setOdometer = (value: string) => updateDraft({ odometer: value });
  const setFuelLevel = (value: string) => updateDraft({ fuelLevel: value });
  const setNotes = (value: string) => updateDraft({ notes: value });

  const [uploading, setUploading] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<{ scope: string; angle: string; message: string } | null>(null);
  const captureLock = useRef(false);
  const submitLock = useRef(false);

  const capture = async (angle: string) => {
    if (!ride || !uid || captureLock.current || !editable || submitLock.current) return;
    captureLock.current = true;
    const capturedScope = scope;
    setPhotoError(null);
    setUploading(angle);
    try {
      const pending = { ...draft.pending };
      let asset = pending[angle];
      if (!asset) {
        if (!(await ImagePicker.requestCameraPermissionsAsync()).granted) {
          throw new Error('Cần quyền camera để chụp ảnh bàn giao.');
        }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
        if (result.canceled || !result.assets[0]) return;
        if (getFirebaseUser()?.uid !== uid) return;
        asset = result.assets[0];
        updateDraft({ pending: { ...pending, [angle]: asset } });
      }
      const uploaded = await uploadDriverImage(asset, 'HANDOVER', ride.id);
      delete pending[angle];
      updateDraft({
        pending,
        photos: [
          ...photos.filter((photo) => photo.angle !== angle),
          { angle, uri: asset.uri, fileUrl: uploaded.secureUrl, publicId: uploaded.publicId },
        ],
      });
    } catch (error) {
      setPhotoError({
        scope: capturedScope,
        angle,
        message: error instanceof Error ? error.message : 'Chưa tải được ảnh. Hãy thử lại.',
      });
    } finally {
      captureLock.current = false;
      setUploading(null);
    }
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!uid || getFirebaseUser()?.uid !== uid) throw new Error('Phiên đăng nhập đã thay đổi.');
      const latest = client.getQueryState<CustomerRideDetail | null>(['driver', 'activeRide']);
      const latestPresentation = validStop
        ? inspectionPresentation(
            latest?.data,
            phase,
            latest?.status === 'success' && latest.fetchStatus !== 'paused',
          )
        : null;
      if (
        !ride ||
        !editable ||
        !canSubmitOnline ||
        latest?.data?.id !== ride.id ||
        !latestPresentation?.canSubmit ||
        latestPresentation.report?.revision !== existing?.revision ||
        Object.keys(draft.pending ?? {}).length > 0
      ) {
        throw new Error('Biên bản đã đổi trạng thái hoặc mất đồng bộ. Hãy làm mới rồi thử lại.');
      }
      if (!odometer.trim() || !Number.isSafeInteger(Number(odometer)) || Number(odometer) < 0) {
        throw new Error('Nhập số km đồng hồ hợp lệ.');
      }
      if (pickupOdometer != null && Number(odometer) < pickupOdometer) {
        throw new Error('Số km trả xe phải lớn hơn hoặc bằng lúc nhận xe.');
      }
      if (fuelLevel && (!Number.isInteger(Number(fuelLevel)) || Number(fuelLevel) < 0 || Number(fuelLevel) > 100)) {
        throw new Error('Mức nhiên liệu phải là số nguyên từ 0 đến 100%.');
      }
      if (PHOTO_ANGLES.slice(0, 4).some(([angle]) => !photos.some((photo) => photo.angle === angle))) {
        throw new Error('Cần đủ ảnh đầu xe, đuôi xe, bên trái và bên phải.');
      }
      const body = {
        odometer: Number(odometer),
        fuelLevel: fuelLevel ? Number(fuelLevel) : null,
        notes: notes.trim() || null,
        photos: photos.map(({ angle, fileUrl, publicId }) => ({ angle, fileUrl, publicId })),
      };
      return existing
        ? reviseDriverHandover(ride.id, phase, existing.revision ?? 1, body)
        : submitDriverHandover(ride.id, phase, body);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['driver'] });
      if (getFirebaseUser()?.uid === uid) {
        client.setQueryData<Draft>(draftKey, { photos: [] });
        router.dismissTo('/ride/in-progress');
      }
    },
    onError: () => { void query.refetch(); },
    onSettled: () => { submitLock.current = false; },
  });

  const send = (onSuccess: () => void) => {
    if (submitLock.current || captureLock.current || !editable || !canSubmitOnline) return;
    submitLock.current = true;
    submit.mutate(undefined, { onSuccess });
  };

  return {
    router,
    ride,
    phase,
    validStop,
    presentation,
    existing,
    photos,
    pending: Object.keys(draft.pending ?? {}),
    uploading,
    photoError: photoError?.scope === scope ? photoError : null,
    refresh: query.refetch,
    isFetching: query.isFetching,
    odometer,
    setOdometer,
    fuelLevel,
    setFuelLevel,
    notes,
    setNotes,
    capture,
    submit,
    send,
    editable,
    canSubmitOnline,
    pickupOdometer,
    revisions,
    loading: query.isLoading,
    error: query.error?.message || submit.error?.message,
  };
}
