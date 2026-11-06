import type { AuthProfile, CustomerRideDetail, DriverLocationUpdate } from '@datxe/shared';
import { shouldPublishLocation, validLocationUpdate } from '@datxe/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { env } from '@/config/env';
import { request } from './api';
import { driverRealtime } from './realtime';
import { useDriverHealth } from './driverHealth';

export const DRIVER_LOCATION_TASK = 'datxe-driver-active-ride-location';
const HEARTBEAT_INTERVAL_MS = 10_000;
const MAX_SAMPLE_AGE_MS = 30_000;
const LOCATION_POST_TIMEOUT_MS = 5_000;
let lastAcknowledgedAt = 0;
let pendingLocationPost: AbortController | null = null;
const LAST_LOCATION_KEY = 'datxe.driver.lastLocation';
let previous: DriverLocationUpdate | null = null;
let lastKnown: DriverLocationUpdate | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let lastRideCheck = 0;
let active = false;
let locationEpoch = 0;
// Ask for background access at most once per app session; repeating the request
// flashes the system permission activity and re-triggers the location effect.
let backgroundPermissionAsked = false;
export function publishDriverLocation(position: Location.LocationObject) {
  const next = { location: { lat: position.coords.latitude, lng: position.coords.longitude }, timestamp: new Date(position.timestamp).toISOString(), accuracy: position.coords.accuracy };
  if (!validLocationUpdate(next) || Date.now() - position.timestamp >= MAX_SAMPLE_AGE_MS) return;
  if (lastKnown && Date.parse(next.timestamp) <= Date.parse(lastKnown.timestamp)) return;
  lastKnown = next;
  useDriverHealth.getState().update({ lastSampleAt: position.timestamp });
  void AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(next)).catch(() => {});
  if (!shouldPublishLocation(previous, next, env.locationIntervalMs)) return;
  previous = next;
  sendLocation(next);
}

function sendLocation(update: DriverLocationUpdate) {
  const liveSocket = useDriverHealth.getState().connected && AppState.currentState === 'active';
  const needsAcknowledgment = Date.now() - lastAcknowledgedAt >= HEARTBEAT_INTERVAL_MS;
  if (liveSocket && (!needsAcknowledgment || pendingLocationPost)) {
    driverRealtime.publish('/app/location', update, 10000);
    return;
  }
  if (pendingLocationPost) return;

  const epoch = locationEpoch;
  const controller = new AbortController();
  pendingLocationPost = controller;
  const timer = setTimeout(() => controller.abort(), LOCATION_POST_TIMEOUT_MS);
  void request<boolean>('/driver/location', { method: 'POST', body: update, allowNull: true, signal: controller.signal })
    .then((accepted) => {
      if (epoch !== locationEpoch) return;
      if (accepted === false) {
        useDriverHealth.getState().update({ error: 'Máy chủ chưa chấp nhận mẫu GPS. Đang chờ vị trí mới.' });
        return;
      }
      lastAcknowledgedAt = Date.now();
      useDriverHealth.getState().update({ lastSentAt: lastAcknowledgedAt, error: '' });
    })
    .catch(() => {
      if (epoch !== locationEpoch) return;
      useDriverHealth.getState().update({ error: 'Chưa xác nhận gửi được vị trí. Kiểm tra kết nối và thử lại.' });
      const latest = lastKnown;
      if (latest && Date.now() - Date.parse(latest.timestamp) < MAX_SAMPLE_AGE_MS) {
        driverRealtime.publish('/app/location', latest, 10000);
      }
    })
    .finally(() => {
      clearTimeout(timer);
      if (pendingLocationPost === controller) pendingLocationPost = null;
    });
}

/**
 * Chỉ khôi phục mẫu GPS còn mới và giữ nguyên thời điểm đo, không làm mới tọa độ cũ.
 */
export async function restoreLastLocation(): Promise<void> {
  const epoch = locationEpoch;
  if (lastKnown) return; // GPS đã có vị trí mới hơn, không ghi đè bằng vị trí cũ.
  const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
  if (!raw || lastKnown || epoch !== locationEpoch) return;
  try {
    const stored: unknown = JSON.parse(raw);
    if (!validLocationUpdate(stored) || Date.now() - Date.parse(stored.timestamp) >= MAX_SAMPLE_AGE_MS) return;
    lastKnown = stored;
    useDriverHealth.getState().update({ lastSampleAt: Date.parse(stored.timestamp) });
    previous = stored;
    sendLocation(stored);
  } catch {
    // Dữ liệu cũ/hỏng: bỏ qua và chờ GPS thật.
  }
}

/**
 * Lấy mẫu GPS thật khi đứng yên. Không đóng timestamp mới lên vị trí đã lưu.
 */
export function startDriverLocationHeartbeat() {
  if (heartbeat) return;
  const epoch = locationEpoch;
  let polling = false;
  heartbeat = setInterval(() => {
    if (polling) return;
    polling = true;
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      .then(position => { if (epoch === locationEpoch) publishDriverLocation(position); })
      .catch(() => { if (epoch === locationEpoch) useDriverHealth.getState().update({ error: 'Chưa lấy được GPS mới. Kiểm tra dịch vụ vị trí và quyền ứng dụng.' }); })
      .finally(() => { polling = false; });
  }, HEARTBEAT_INTERVAL_MS);
}
export function stopDriverLocationHeartbeat() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}
export async function stopDriverBackgroundLocation() {
  locationEpoch++;
  active = false; previous = null; lastKnown = null;
  pendingLocationPost?.abort();
  pendingLocationPost = null;
  lastAcknowledgedAt = 0;
  useDriverHealth.getState().update({ lastSampleAt: null, lastSentAt: null, backgroundRunning: false });
  stopDriverLocationHeartbeat();
  if (Platform.OS !== 'web' && await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
}
export async function startDriverBackgroundLocation(): Promise<boolean> {
  active = true; lastRideCheck = Date.now();
  if (Platform.OS === 'web') return false;
  const current = await Location.getBackgroundPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain && !backgroundPermissionAsked) {
    backgroundPermissionAsked = true;
    granted = (await Location.requestBackgroundPermissionsAsync()).granted;
  }
  if (!granted) return false;
  if (!active) return false;
  if (!(await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK))) await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.High, timeInterval: env.locationIntervalMs, distanceInterval: 0,
    pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
    foregroundService: { notificationTitle: 'Đang chia sẻ vị trí tài xế', notificationBody: 'Vị trí dùng để tìm chuyến phù hợp hoặc theo dõi chuyến đang thực hiện.', killServiceOnDestroy: true },
  });
  return true;
}
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) TaskManager.defineTask<{ locations: Location.LocationObject[] }>(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) { useDriverHealth.getState().update({ error: 'Chia sẻ vị trí nền gặp lỗi. Hãy mở app và kiểm tra lại GPS.' }); return; }
  if (!data?.locations?.length) return;
  const epoch = locationEpoch;
  try {
    // A cold background launch verifies that a ride is still assigned; never sends cached trip samples indefinitely.
    if (!active || Date.now() - lastRideCheck > 30000) {
      const [ride, profile] = await Promise.all([request<CustomerRideDetail>('/driver/rides/active', { allowNull: true }), request<AuthProfile>('/auth/me')]);
      if (epoch !== locationEpoch) return;
      active = Boolean(ride || profile?.status === 'ONLINE'); lastRideCheck = Date.now();
      if (!active) { await stopDriverBackgroundLocation(); return; }
    }
    if (epoch !== locationEpoch) return;
    driverRealtime.connect();
    publishDriverLocation(data.locations.reduce((latest, point) => point.timestamp > latest.timestamp ? point : latest));
  } catch { /* Never publish after an auth/active-ride verification failure. */ }
});
