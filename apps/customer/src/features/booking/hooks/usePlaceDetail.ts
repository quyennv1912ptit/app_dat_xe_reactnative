import { translate as i18nT } from '@datxe/shared';
import { useSettings } from '@/lib/settings/SettingsProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Clipboard, Platform } from 'react-native';
import { reportBookingPlace, resolveBookingPlace } from '../api';
import {
  bookingPlaceFromParams,
  distanceMetersBetween,
  formatDistanceMeters,
  placeTitle,
} from '../bookingUtils';
import { useBookingDraft } from '../store';
import type { PlaceKind } from '../types';
import { useExistingDeviceLocation } from './useExistingDeviceLocation';

const text = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export function usePlaceDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const kind: PlaceKind = params.kind === 'dropoff' ? 'dropoff' : 'pickup';
  const edit = params.edit === '1';
  const draft = useBookingDraft();
  const { data: settings, update } = useSettings();
  const [initial] = useState(() => bookingPlaceFromParams(params));
  const id = (text(params.id) ?? '').trim();
  const name = (text(params.name) ?? '').trim();
  const address = (text(params.address) ?? '').trim();
  const [toast, setToast] = useState('');

  const detail = useQuery({
    queryKey: ['customer', 'placeDetail', id, address],
    enabled: !initial && Boolean(id),
    queryFn: ({ signal }) => resolveBookingPlace({ id, name, address, provider: 'goong' }, signal),
    retry: false,
    staleTime: 30 * 60_000,
  });
  const place = initial ?? detail.data ?? null;
  const device = useExistingDeviceLocation();
  const origin = kind === 'dropoff' ? draft.pickup?.coordinate ?? null : device;
  const distance = place && origin ? distanceMetersBetween(origin, place.coordinate) : null;
  const saved = Boolean(place && settings.places.some((item) => item.address === place.address));

  const save = (label: string) => {
    if (!place) return;
    update({
      places: [
        ...settings.places.filter((item) => label === 'Yêu thích' || item.name !== label),
        {
          id: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
          name: label,
          address: place.address,
          lat: place.coordinate.lat,
          lng: place.coordinate.lng,
        },
      ],
    });
    setToast(i18nT('Đã lưu địa điểm'));
  };

  const copy = async () => {
    if (!place) return;
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return;
      await navigator.clipboard.writeText(place.address);
    } else {
      Clipboard.setString(place.address);
    }
    setToast(i18nT('Đã sao chép địa chỉ'));
  };

  const report = useMutation({
    mutationFn: (reason: string) => reportBookingPlace({
      placeId: place?.id,
      name: place?.name ?? '',
      address: place?.address ?? '',
      lat: place?.coordinate.lat,
      lng: place?.coordinate.lng,
      reason,
    }),
  });

  const choose = () => {
    if (!place) return;
    draft.setPlace(kind, place);
    if (edit) router.dismissTo('/ride/confirm');
    else router.replace(kind === 'pickup' ? '/ride/destination' : '/ride/vehicle');
  };

  return {
    router,
    kind,
    place,
    loading: detail.isLoading,
    error: detail.error?.message ?? (!initial && !id ? i18nT('Chưa xác định được địa chỉ.') : ''),
    retry: detail.refetch,
    distance: formatDistanceMeters(distance),
    saved,
    save,
    copy,
    report: report.mutateAsync,
    reporting: report.isPending,
    reportError: report.error?.message,
    resetReport: report.reset,
    choose,
    toast,
    clearToast: () => setToast(''),
    titleOf: placeTitle,
  };
}
