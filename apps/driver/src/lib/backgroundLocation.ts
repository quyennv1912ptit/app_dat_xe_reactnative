import type { CustomerRideDetail, DriverLocationUpdate } from '@datxe/shared';
import { shouldPublishLocation } from '@datxe/shared';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { env } from '@/config/env';
import { request } from './api';
import { driverRealtime } from './realtime';

export const DRIVER_LOCATION_TASK = 'datxe-driver-active-ride-location';
let previous: DriverLocationUpdate | null = null;
let lastRideCheck = 0;
let active = false;
export function publishDriverLocation(position: Location.LocationObject) {
  if (position.coords.accuracy === null) return;
  const next = { location: { lat: position.coords.latitude, lng: position.coords.longitude }, timestamp: new Date(position.timestamp).toISOString(), accuracy: position.coords.accuracy };
  if (shouldPublishLocation(previous, next, env.locationIntervalMs) && driverRealtime.publish('/app/location', next, 10000)) previous = next;
}
export async function stopDriverBackgroundLocation() {
  active = false; previous = null;
  if (Platform.OS !== 'web' && await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
}
export async function startDriverBackgroundLocation(): Promise<boolean> {
  active = true; lastRideCheck = Date.now();
  if (Platform.OS === 'web') return false;
  if (!(await Location.requestBackgroundPermissionsAsync()).granted) return false;
  if (!active) return false;
  if (!(await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK))) await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.High, timeInterval: env.locationIntervalMs, distanceInterval: 0,
    pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
    foregroundService: { notificationTitle: 'Đang chia sẻ vị trí chuyến đi', notificationBody: 'Vị trí được gửi cho khách trong chuyến đang hoạt động.', killServiceOnDestroy: true },
  });
  return true;
}
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) TaskManager.defineTask<{ locations: Location.LocationObject[] }>(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  try {
    // A cold background launch verifies that a ride is still assigned; never sends cached trip samples indefinitely.
    if (!active || Date.now() - lastRideCheck > 30000) {
      active = Boolean(await request<CustomerRideDetail>('/driver/rides/active', { allowNull: true })); lastRideCheck = Date.now();
      if (!active) { await stopDriverBackgroundLocation(); return; }
    }
    driverRealtime.connect();
    publishDriverLocation(data.locations.reduce((latest, point) => point.timestamp > latest.timestamp ? point : latest));
  } catch { /* Never publish after an auth/active-ride verification failure. */ }
});
