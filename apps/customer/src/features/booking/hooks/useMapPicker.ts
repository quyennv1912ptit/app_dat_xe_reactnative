import type { RideCoordinates } from '@datxe/shared';
import { useSettings } from '@/lib/settings/SettingsProvider';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNearbyBookingPlaces, reverseBookingPlace } from '../api';
import { bookingPlaceFromParams, DEFAULT_MAP_CENTER } from '../bookingUtils';
import { MapPinResolver, type PinSelection } from '../mapPinResolver';
import { useBookingDraft } from '../store';
import type { BookingPlace, NearbyPlace } from '../types';
import { useDeviceLocation } from './useDeviceLocation';

const addressCache = new Map<string, BookingPlace>();
const NEARBY_RADIUS_METERS = 100;

const text = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export function useMapPicker() {
  const router = useRouter();
  const focused = useIsFocused();
  const params = useLocalSearchParams();
  const kind = params.kind === 'dropoff' ? 'dropoff' : 'pickup';
  const draft = useBookingDraft();
  const { data: settings, update: updateSettings } = useSettings();
  const saveLabel = (text(params.saveLabel) ?? '').trim();
  const [initialPlace] = useState(() => bookingPlaceFromParams(params));

  const [center, setCenter] = useState<RideCoordinates>(
    initialPlace?.coordinate ?? draft[kind]?.coordinate ?? draft.pickup?.coordinate ?? DEFAULT_MAP_CENTER,
  );
  const [cameraVersion, setCameraVersion] = useState(0);
  const cameraMoving = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [selection, setSelection] = useState<PinSelection>(() => initialPlace
    ? { phase: 'ready', point: initialPlace.coordinate, place: initialPlace, error: '' }
    : { phase: 'waiting', point: null, place: null, error: '' });
  const [resolver] = useState(() => new MapPinResolver(reverseBookingPlace, addressCache, setSelection));
  const seeded = useRef(false);
  const idlePoint = useRef<RideCoordinates | null>(null);
  const enabled = useRef(false);
  const device = useDeviceLocation();

  useEffect(() => {
    if (seeded.current || !initialPlace) return;
    seeded.current = true;
    // Địa điểm vừa chọn ở màn tìm kiếm là kết quả đầu tiên; chỉ reverse khi người
    // dùng thực sự di chuyển bản đồ.
    resolver.seed(initialPlace.coordinate, initialPlace);
  }, [initialPlace, resolver]);

  useEffect(() => {
    enabled.current = focused && mapReady;
    if (enabled.current) {
      // Bản đồ vừa sẵn sàng: ghim sẵn địa điểm người dùng đã chọn ở màn tìm kiếm
      // để camera-idle đầu tiên không reverse-geocode đè lên địa chỉ đó.
      if (!idlePoint.current && initialPlace) {
        idlePoint.current = initialPlace.coordinate;
        resolver.seed(initialPlace.coordinate, initialPlace);
      }
      if (!cameraMoving.current && idlePoint.current) resolver.idle(idlePoint.current);
    } else {
      resolver.cancel();
    }
    return () => { enabled.current = false; resolver.cancel(); };
  }, [focused, initialPlace, mapReady, resolver]);

  const setMapMoving = useCallback((moving: boolean) => {
    cameraMoving.current = moving;
    if (moving) resolver.moving();
  }, [resolver]);

  // Map adapters emit center changes only when their camera has fully stopped.
  const movePin = useCallback((point: RideCoordinates) => {
    cameraMoving.current = false;
    idlePoint.current = point;
    if (enabled.current) resolver.idle(point);
  }, [resolver]);

  const recenter = async () => {
    resolver.moving();
    const point = await device.locateCoordinates();
    if (point && enabled.current) {
      setCenter(point);
      setCameraVersion(value => value + 1);
    } else if (enabled.current && !cameraMoving.current && idlePoint.current) {
      resolver.idle(idlePoint.current);
    }
  };

  const pin = selection.phase === 'ready' ? selection.point : null;
  const pinKey = pin ? `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}` : '';
  const nearby = useQuery({
    queryKey: ['customer', 'nearbyPlaces', pinKey, NEARBY_RADIUS_METERS],
    queryFn: ({ signal }) => getNearbyBookingPlaces(pin!, signal, NEARBY_RADIUS_METERS, 8),
    enabled: Boolean(pin) && focused && selection.phase !== 'moving',
    retry: false,
    staleTime: 60_000,
  });
  const nearbyPlaces = useMemo(() => {
    const selected = selection.phase === 'ready' ? selection.place : null;
    return (nearby.data?.places ?? []).filter((place) => {
      if (selected && place.id === selected.id) return false;
      if (selected && Math.abs(place.coordinate.lat - selected.coordinate.lat) < 0.00003
        && Math.abs(place.coordinate.lng - selected.coordinate.lng) < 0.00003) return false;
      return true;
    });
  }, [nearby.data?.places, selection]);

  /** Chọn một điểm gần đây: ghim sang đúng toạ độ và giữ nguyên tên điểm đó. */
  const selectNearby = (place: NearbyPlace) => {
    const picked: BookingPlace = {
      ...place,
      id: `pin:${place.coordinate.lng},${place.coordinate.lat}`,
      coordinate: { ...place.coordinate },
    };
    resolver.seed(place.coordinate, picked);
    idlePoint.current = place.coordinate;
    setCenter(place.coordinate);
    setCameraVersion(value => value + 1);
  };

  const canConfirm = focused && mapReady && !device.locating && selection.phase === 'ready' && Boolean(selection.place);
  const confirm = () => {
    if (!canConfirm || !selection.place) return;
    const place = selection.place;
    if (saveLabel) {
      const saved = {
        id: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
        name: saveLabel,
        address: place.address,
        lat: place.coordinate.lat,
        lng: place.coordinate.lng,
      };
      updateSettings({
        places: [
          ...settings.places.filter((item) => saveLabel === 'Yêu thích' || item.name !== saveLabel),
          saved,
        ],
      });
      // "Thêm nhà"/"Thêm công ty"/"Thêm địa chỉ" chỉ lưu vị trí rồi quay lại
      // màn chọn để chip mới xuất hiện, không tự chọn làm điểm đón/đến.
      router.back();
      return;
    }
    draft.setPlace(kind, place);
    if (params.edit === '1') router.dismissTo('/ride/confirm');
    else router.replace(kind === 'pickup' ? '/ride/destination' : '/ride/vehicle');
  };

  return {
    router,
    kind,
    center,
    cameraVersion,
    movePin,
    setMapReady,
    setMapMoving,
    mapReady,
    mapMoving: selection.phase === 'moving',
    place: selection.phase === 'ready' ? selection.place : null,
    resolving: ['waiting', 'moving', 'debouncing', 'resolving'].includes(selection.phase),
    nearbyPlaces,
    nearbyLoading: Boolean(pin) && nearby.isFetching,
    nearbyError: nearby.error?.message ?? '',
    retryNearby: nearby.refetch,
    nearbyWithinRadius: nearby.data?.withinRadius ?? true,
    nearbyRadius: nearby.data?.radiusMeters ?? NEARBY_RADIUS_METERS,
    selectNearby,
    note: draft.pickupNote,
    setNote: draft.setPickupNote,
    canConfirm,
    confirm,
    recenter,
    locating: device.locating,
    saveLabel,
    error: selection.error || device.locationError,
    retryable: selection.phase === 'error',
    retry: () => {
      if (enabled.current && !cameraMoving.current && idlePoint.current) {
        resolver.cancel();
        resolver.idle(idlePoint.current);
      }
    },
  };
}
