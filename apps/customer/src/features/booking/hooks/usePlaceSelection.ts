import { translate as i18nT } from '@datxe/shared';
import { useSettings } from '@/lib/settings/SettingsProvider';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import {
  getPopularBookingPlaces,
  getRecentBookingPlaces,
  resolveBookingPlace,
  searchBookingPlaces,
} from '../api';
import { placeTitle } from '../bookingUtils';
import { useBookingDraft } from '../store';
import type { CustomerPlace, PlaceKind, PlaceSuggestion } from '../types';
import { useDebouncedTextChange } from '@datxe/ui';
import { useDeviceLocation } from './useDeviceLocation';
import { useSearchProximity } from './useSearchProximity';

/** Ghép địa điểm đã lưu trên thiết bị thành gợi ý có toạ độ. */
function savedPlaceOf(place: { id: string; name: string; address: string; lat: number; lng: number }): CustomerPlace {
  return {
    id: `saved:${place.id}`,
    name: place.name,
    address: place.address,
    provider: 'goong',
    coordinate: { lat: place.lat, lng: place.lng },
  };
}

export function usePlaceSelection(kind: PlaceKind) {
  const router = useRouter();
  const { data: settings } = useSettings();
  const params = useLocalSearchParams<{ edit?: string }>();
  const edit = params.edit === '1';
  const draft = useBookingDraft();
  const [initialText] = useState(() => (kind === 'dropoff' ? draft.destinationHint : ''));
  // `text` là từ khoá đã debounce dùng cho query; `inputText` phản hồi ngay khi gõ.
  const [text, setText] = useState(initialText);
  const [inputText, setInputText] = useState(initialText);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState('');
  const selecting = useRef(false);
  const selectionRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { selectionRequest.current?.abort(); }, []);

  const normalizedText = text.trim().replace(/\s+/g, ' ').toLowerCase();
  const proximity = useSearchProximity(kind === 'dropoff' ? draft.pickup?.coordinate : undefined);
  const canSearch = normalizedText.length >= 2;

  const input = useDebouncedTextChange((value) => {
    setText(value);
    setSelectionError('');
  }, 350);

  const onChangeText = (value: string) => {
    setInputText(value);
    if (!value.trim()) {
      input.cancel();
      setText('');
      setSelectionError('');
    } else {
      input.onChangeText(value);
    }
  };
  const clearText = () => {
    input.cancel();
    setInputText('');
    setText('');
    setSelectionError('');
  };

  const search = useQuery({
    queryKey: ['customer', 'placeSearchV3', normalizedText, proximity?.lat, proximity?.lng],
    queryFn: ({ signal }) => searchBookingPlaces(normalizedText, proximity, signal),
    enabled: canSearch,
    retry: false,
    // Giữ kết quả cũ khi gõ tiếp (danh sách không nhấp nháy) và cache 5 phút để
    // gõ đi gõ lại cùng một địa chỉ không gọi lại API.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  const recent = useQuery({
    queryKey: ['customer', 'bookingRecentPlaces', kind, proximity?.lat, proximity?.lng],
    queryFn: ({ signal }) => getRecentBookingPlaces(kind, proximity, signal, 5),
    enabled: !canSearch,
    retry: false,
    staleTime: 60_000,
  });
  const popular = useQuery({
    queryKey: ['customer', 'bookingPopularPlaces', proximity?.lat, proximity?.lng],
    queryFn: ({ signal }) => getPopularBookingPlaces(proximity, signal, 6),
    enabled: kind === 'dropoff' && !canSearch,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const device = useDeviceLocation();
  const selectedAddress = draft[kind]?.address;
  const recentPlaces = (recent.data ?? []).filter((place) => place.address !== selectedAddress);
  const popularPlaces = (popular.data ?? []).filter((place) => place.address !== selectedAddress);

  /** Chuyển sang bản đồ để chọn chính xác; địa điểm đã có toạ độ được ghim sẵn. */
  const openMapFor = async (suggestion: PlaceSuggestion | CustomerPlace) => {
    if (selecting.current) return;
    selecting.current = true;
    setSelectingId(suggestion.id);
    setSelectionError('');
    const controller = new AbortController();
    selectionRequest.current = controller;
    try {
      const place = await resolveBookingPlace(suggestion, controller.signal);
      if (controller.signal.aborted) return;
      Keyboard.dismiss();
      router.push({
        pathname: '/ride/map-picker',
        params: {
          kind,
          edit: edit ? '1' : '0',
          id: place.id,
          name: place.name,
          address: place.address,
          lat: String(place.coordinate.lat),
          lng: String(place.coordinate.lng),
          provider: place.provider ?? 'goong',
        },
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        setSelectionError(error instanceof Error ? error.message : i18nT('Chưa chọn được địa điểm. Vui lòng thử lại.'));
      }
    } finally {
      selecting.current = false;
      setSelectingId(null);
    }
  };

  const selectKnownPlace = (place: CustomerPlace) => {
    if (selecting.current) return;
    const { lat, lng } = place.coordinate;
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      openMap();
      return;
    }
    selecting.current = true;
    Keyboard.dismiss();
    draft.setPlace(kind, place);
    if (edit) router.dismissTo('/ride/confirm');
    else router.replace(kind === 'pickup' ? '/ride/destination' : draft.pickup ? '/ride/vehicle' : '/ride/pickup');
  };

  const openDetail = (suggestion: PlaceSuggestion | CustomerPlace) => {
    if (selecting.current) return;
    Keyboard.dismiss();
    router.push({
      pathname: '/ride/place-detail',
      params: {
        kind,
        edit: edit ? '1' : '0',
        id: suggestion.id,
        name: suggestion.name,
        address: suggestion.address,
        lat: suggestion.coordinate ? String(suggestion.coordinate.lat) : '',
        lng: suggestion.coordinate ? String(suggestion.coordinate.lng) : '',
        provider: suggestion.provider ?? 'goong',
      },
    });
  };

  const openMap = () => {
    if (selecting.current) return;
    Keyboard.dismiss();
    router.push({ pathname: '/ride/map-picker', params: { kind, edit: edit ? '1' : '0' } });
  };

  const useCurrentLocation = async () => {
    if (selecting.current) return;
    const place = await device.locate();
    if (place) await openMapFor(place);
  };

  /** Khi chưa lưu Nhà/Cơ quan, cho người dùng ghim rồi lưu luôn trong màn bản đồ. */
  const addSavedPlace = (label: string) => {
    if (selecting.current) return;
    Keyboard.dismiss();
    router.push({ pathname: '/ride/map-picker', params: { kind, edit: edit ? '1' : '0', saveLabel: label } });
  };

  const swap = () => {
    if (!draft.pickup || !draft.dropoff) return;
    const { pickup, dropoff } = draft;
    draft.setPlace('pickup', dropoff);
    draft.setPlace('dropoff', pickup);
  };

  const editTarget = (target: PlaceKind) => {
    Keyboard.dismiss();
    router.push(target === 'pickup' ? '/ride/pickup' : '/ride/destination');
  };

  const savedPlaces = settings.places.map(savedPlaceOf);

  return {
    savedPlaces,
    router,
    text: inputText,
    initialText,
    onChangeText,
    clearText,
    selected: draft[kind],
    pickup: draft.pickup,
    dropoff: draft.dropoff,
    results: canSearch ? search.data?.places ?? [] : [],
    limitedCoverage: canSearch && search.data?.limitedCoverage,
    provider: canSearch ? search.data?.provider : undefined,
    loading: canSearch && search.isFetching,
    recentLoading: recent.isLoading,
    popularLoading: popular.isLoading,
    recentPlaces,
    popularPlaces,
    hasSearchText: inputText.trim().length > 0,
    canSearch,
    error: selectionError || (canSearch ? search.error?.message : ''),
    selectingId,
    select: openMapFor,
    selectKnownPlace,
    openDetail,
    openMap,
    useCurrentLocation,
    addSavedPlace,
    swap,
    editTarget,
    titleOf: placeTitle,
    ...device,
  };
}
