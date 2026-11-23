import { activeRideDestination } from '../bookingUtils';
import { translate as i18nT } from '@datxe/shared';
import { ensureForegroundLocationPermission } from '@datxe/ui';
import { getCustomerDisplayName } from '@/lib/customerName';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { RideCoordinates } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { getActiveCustomerRide, getCustomerProfile, getCustomerRides, getCustomerVouchers, getNearbyCustomerDrivers, getUnreadNotificationCount, reverseBookingPlace } from '../api';
import { getRecentDestinations, type RecentDestination } from '../components/HomeScreenParts';
import { useBookingDraft } from '../store';
import type { BookingPlace } from '../types';

const LOCATION_TIMEOUT_MS = 8000;

async function getCustomerCoordinate(): Promise<RideCoordinates> {
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
        reject,
        { maximumAge: 15_000, timeout: 12_000 },
      );
    });
  }
  const lastKnown = typeof Location.getLastKnownPositionAsync === "function"
    ? await Location.getLastKnownPositionAsync({ maxAge: 60_000 }).catch(() => null)
    : null;
  if (lastKnown?.coords) {
    return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
  }
  return new Promise<RideCoordinates>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('GPS_TIMEOUT'));
    }, LOCATION_TIMEOUT_MS);
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ lat: coords.latitude, lng: coords.longitude });
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
  });
}

let cachedLocation: { coordinate: RideCoordinates; label: string; updatedAt: number } | null = null;
export function useHome() {
const router = useRouter();
const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
const [currentLocation, setCurrentLocation] = useState(cachedLocation?.label ?? 'Đang xác định vị trí…');
const [currentCoordinates, setCurrentCoordinates] = useState<RideCoordinates | null>(cachedLocation?.coordinate ?? null);
const [locationLoading, setLocationLoading] = useState(!cachedLocation);
const [homeFocused, setHomeFocused] = useState(false);
const locationBusy = useRef(false);
const refreshLocation = useCallback(async (requestPermission = false) => {
    if (locationBusy.current || (!requestPermission && cachedLocation && Date.now() - cachedLocation.updatedAt < 30000)) return;
    locationBusy.current = true;
    setLocationLoading(!cachedLocation);
    try {
      if (Platform.OS !== "web") {
        const permission = await ensureForegroundLocationPermission(Location, requestPermission);

        if (!permission.granted) {
          cachedLocation = null;
          setCurrentCoordinates(null);
          if (requestPermission && !permission.canAskAgain) await Linking.openSettings();
          setCurrentLocation(permission.canAskAgain
            ? i18nT("Cho phép vị trí để xem khu vực hiện tại")
            : i18nT("Bật quyền vị trí trong cài đặt"));
          return;
        }
      }

      const coordinate = await getCustomerCoordinate();
      if (cachedLocation && Math.hypot((coordinate.lat - cachedLocation.coordinate.lat) * 111320, (coordinate.lng - cachedLocation.coordinate.lng) * 111320 * Math.cos(coordinate.lat * Math.PI / 180)) < 20) {
        cachedLocation.updatedAt = Date.now();
        return;
      }
      const label = `${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)}`;
      const fix = { coordinate, label, updatedAt: Date.now() };
      cachedLocation = fix;
      setCurrentCoordinates(coordinate);
      setCurrentLocation(label);
      void reverseBookingPlace(coordinate).then(place => {
        if (cachedLocation !== fix) return;
        fix.label = place.address || label;
        setCurrentLocation(fix.label);
      }).catch(() => {});
    } catch (error) {
      const webPermissionDenied = Platform.OS === "web" && error && typeof error === "object"
        && "code" in error && error.code === 1;
      if (webPermissionDenied) {
        cachedLocation = null;
        setCurrentCoordinates(null);
        setCurrentLocation(i18nT("Bật quyền vị trí trong cài đặt"));
      } else if (!cachedLocation) {
        setCurrentLocation(i18nT("Chưa xác định được vị trí"));
      }
    } finally {
      locationBusy.current = false;
      setLocationLoading(false);
    }
  }, []);
const profileQuery=useQuery({queryKey:['customer','getCustomerProfile'],queryFn:getCustomerProfile,staleTime:300000});
const activeQuery=useQuery({queryKey:['customer','getActiveCustomerRide'],queryFn:getActiveCustomerRide});
const voucherQuery=useQuery({queryKey:['customer','getCustomerVouchers'],queryFn:getCustomerVouchers,staleTime:120000});
const unreadQuery=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount});
const historyQuery=useQuery({queryKey:['customer','getCustomerRides','recent'],queryFn:()=>getCustomerRides(0,12)});
const nearbyQuery=useQuery({queryKey:['customer','getNearbyCustomerDrivers',currentCoordinates],queryFn:()=>getNearbyCustomerDrivers(currentCoordinates!),enabled:homeFocused && Boolean(currentCoordinates),refetchInterval:10000, staleTime:5000});
useRefreshOnFocus(activeQuery.refetch);
const retryNearby = nearbyQuery.refetch;
useFocusEffect(useCallback(() => {
  setHomeFocused(true);
  void refreshLocation();
  const timer = setInterval(() => {
    setCurrentHour(new Date().getHours());
    void refreshLocation();
  }, 30_000);
  return () => {
    setHomeFocused(false);
    clearInterval(timer);
  };
}, [refreshLocation]));
const profile=profileQuery.data;
const isSuspended = profile?.status === 'INACTIVE';
const activeRide=activeQuery.data;
const vouchers=voucherQuery.data ?? [];
const unreadCount=unreadQuery.data ?? 0;
const recentDestinations=getRecentDestinations(historyQuery.data?.content ?? []);
const nearbyDrivers = nearbyQuery.isError ? [] : nearbyQuery.data ?? [];
const nearbyStatus = !currentCoordinates ? "location" : nearbyQuery.isError ? "error" : nearbyQuery.isPending ? "loading" : "ready";
const loading=[profileQuery,activeQuery,voucherQuery,unreadQuery].some(query=>query.isLoading);
const loadError=[profileQuery,activeQuery,voucherQuery,unreadQuery].find(query=>query.error)?.error?.message ?? '';
const retryData = () => Promise.allSettled([profileQuery, activeQuery, voucherQuery, unreadQuery, historyQuery, nearbyQuery].filter(query => query.isError).map(query => query.refetch()));
const customerName = getCustomerDisplayName(profile?.full_name) || 'bạn';
const greetingName = customerName === 'bạn'
    ? i18nT('bạn')
    : customerName.split(/\s+/).pop() || customerName;
const activeVoucher = vouchers[0];
const openBooking = (destination?: string, intent?: "destination" | "schedule", dropoffPlace?: BookingPlace | null) => {
    if (activeRide) {
      router.push(activeRideDestination(activeRide));
      return;
    }
    if (isSuspended) {
      return;
    }
    const pickup: BookingPlace | null = currentCoordinates && !locationLoading
      ? { id: 'home-location', name: 'Vị trí hiện tại', address: currentLocation, coordinate: currentCoordinates }
      : null;
    const draft = useBookingDraft.getState();
    draft.begin(destination ?? '', '', pickup, intent === 'schedule');
    if (dropoffPlace) {
      draft.setPlace('dropoff', dropoffPlace);
      router.push(pickup ? '/ride/vehicle' : '/ride/pickup');
      return;
    }
    router.push(pickup && intent ? '/ride/destination' : '/ride/pickup');
  };
const openRecentDestination = (recent: RecentDestination) => {
    if (recent.coordinate) {
      openBooking(recent.address, 'destination', {
        id: `recent:${recent.coordinate.lng},${recent.coordinate.lat}`,
        name: recent.title,
        address: recent.address,
        coordinate: recent.coordinate,
        provider: 'goong',
      });
      return;
    }
    openBooking(recent.address, 'destination');
  };
return { router, profile, isSuspended, activeRide, recentDestinations, unreadCount, loading, loadError, retryData, currentHour, currentLocation, currentCoordinates, nearbyDrivers, nearbyStatus, retryNearby, locationLoading, refreshLocation, greetingName, activeVoucher, openBooking, openRecentDestination };
}
