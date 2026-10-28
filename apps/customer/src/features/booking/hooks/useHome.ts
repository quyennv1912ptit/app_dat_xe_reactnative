import { getCustomerDisplayName } from '@/lib/customerName';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { RideCoordinates } from '@datxe/shared';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useFocusEffect,useRouter } from 'expo-router';
import { useCallback,useRef,useState } from 'react';
import {
Linking
} from 'react-native';
import { getActiveCustomerRide,getCustomerProfile,getCustomerRides,getCustomerVouchers,getNearbyCustomerDrivers,getUnreadNotificationCount } from '../api';
import { getRecentDestinations } from '../components/HomeScreenParts';
export function useHome() {
const router = useRouter();
const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
const [currentLocation, setCurrentLocation] = useState('Đang xác định vị trí…');
const [currentCoordinates, setCurrentCoordinates] = useState<RideCoordinates | null>(null);
const [locationLoading, setLocationLoading] = useState(true);
const locationPermissionRequested = useRef(false);
const refreshLocation = useCallback(async (requestPermission = false) => {
    setLocationLoading(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain && (requestPermission || !locationPermissionRequested.current)) {
        locationPermissionRequested.current = true;
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!permission.granted) {
        setCurrentCoordinates(null);
        if (requestPermission && !permission.canAskAgain) await Linking.openSettings();
        setCurrentLocation(permission.canAskAgain
          ? 'Cho phép vị trí để xem khu vực hiện tại'
          : 'Bật quyền vị trí trong cài đặt');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
      const places = await Location.reverseGeocodeAsync(position.coords).catch(() => []);
      const place = places[0];
      const placeParts = [place?.district, place?.city ?? place?.subregion, place?.region]
        .filter((part): part is string => Boolean(part?.trim()));
      const uniquePlaceParts = [...new Set(placeParts)];
      setCurrentLocation(
        uniquePlaceParts.slice(0, 2).join(', ')
          || place?.name
          || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
      );
    } catch {
      setCurrentCoordinates(null);
      setCurrentLocation('Chưa xác định được vị trí');
    } finally {
      setLocationLoading(false);
    }
  }, []);
const profileQuery=useQuery({queryKey:['customer','getCustomerProfile'],queryFn:getCustomerProfile});
const activeQuery=useQuery({queryKey:['customer','getActiveCustomerRide'],queryFn:getActiveCustomerRide});
const voucherQuery=useQuery({queryKey:['customer','getCustomerVouchers'],queryFn:getCustomerVouchers});
const unreadQuery=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount});
const historyQuery=useQuery({queryKey:['customer','getCustomerRides','recent'],queryFn:()=>getCustomerRides(0,12)});
const nearbyQuery=useQuery({queryKey:['customer','getNearbyCustomerDrivers',currentCoordinates],queryFn:()=>getNearbyCustomerDrivers(currentCoordinates!),enabled:Boolean(currentCoordinates),refetchInterval:30000});
useRefreshOnFocus(profileQuery.refetch);useRefreshOnFocus(activeQuery.refetch);useRefreshOnFocus(voucherQuery.refetch);useRefreshOnFocus(unreadQuery.refetch);useRefreshOnFocus(historyQuery.refetch);
useFocusEffect(useCallback(()=>{void refreshLocation();const timer=setInterval(()=>setCurrentHour(new Date().getHours()),30000);return()=>clearInterval(timer);},[refreshLocation]));
const profile=profileQuery.data;
const activeRide=activeQuery.data;
const vouchers=voucherQuery.data ?? [];
const unreadCount=unreadQuery.data ?? 0;
const recentDestinations=getRecentDestinations(historyQuery.data?.content ?? []);
const nearbyDrivers=nearbyQuery.data ?? [];
const loading=[profileQuery,activeQuery,voucherQuery,unreadQuery].some(query=>query.isLoading);
const loadError=[profileQuery,activeQuery,voucherQuery,unreadQuery].find(query=>query.error)?.error?.message ?? '';
const customerName = getCustomerDisplayName(profile?.full_name) || 'bạn';
const greetingName = customerName === 'bạn'
    ? customerName
    : customerName.split(/\s+/).pop() || customerName;
const activeVoucher = vouchers[0];
const openBooking = (destination?: string) => {
    if (activeRide) {
      router.push({ pathname: '/ride/tracking', params: { rideId: String(activeRide.id) } });
      return;
    }
    router.push({ pathname: '/ride/route-selection', params: {
      ...(destination ? { destination } : {}),
      ...(currentCoordinates && !locationLoading ? { pickupLat: String(currentCoordinates.lat), pickupLng: String(currentCoordinates.lng), pickupAddress: currentLocation } : {}),
    } });
  };
return { router, profile, activeRide, recentDestinations, unreadCount, loading, loadError, currentHour, currentLocation, currentCoordinates, nearbyDrivers, locationLoading, refreshLocation, greetingName, activeVoucher, openBooking };
}
