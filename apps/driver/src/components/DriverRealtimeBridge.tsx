import { env } from "@/config/env";
import { request } from "@/lib/api";
import {
  publishDriverLocation,
  restoreLastLocation,
  startDriverBackgroundLocation,
  startDriverLocationHeartbeat,
  stopDriverBackgroundLocation,
} from "@/lib/backgroundLocation";
import { driverRealtime } from "@/lib/realtime";
import { useSessionStore } from "@/lib/store";
import type { CustomerRideDetail } from "@datxe/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDriverHealth } from '@/lib/driverHealth';

export function DriverRealtimeBridge() {
  const user = useSessionStore((state) => state.user);
  const client = useQueryClient();
  const ride = useQuery({
    queryKey: ["driver", "activeRide"],
    queryFn: () =>
      request<CustomerRideDetail>("/driver/rides/active", { allowNull: true }),
    enabled: Boolean(user),
    // Keep the chat badge correct even if a foreground STOMP/FCM frame was missed.
    refetchInterval: query => query.state.data ? 10000 : false,
  });
  const rideId = ride.data?.id;
  const userId = user?.id;
  const online = user?.status === "ONLINE";
  const retryVersion = useDriverHealth(state => state.retryVersion);
  const teardown = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let lastRetryAt = 0;
    let leftAt = 0;
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') { leftAt = Date.now(); return; }
      const now = Date.now();
      // Permission dialogs also emit an active transition; without this debounce
      // retry() restarted the GPS effect, which re-opened the permission dialog,
      // which emitted active again - an endless loop that never got a GPS fix.
      if (now - lastRetryAt < 15000 || (leftAt > 0 && now - leftAt < 2000)) return;
      lastRetryAt = now;
      useDriverHealth.getState().retry();
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    useSessionStore.getState().setActiveRide(ride.data ?? null);
  }, [ride.data]);
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = driverRealtime.subscribe("/user/queue/trip", () => {
      void client.invalidateQueries({ queryKey: ["driver"] });
      // PushBridge validates/deduplicates offers from STOMP and FCM before routing.
    });
    const reconnect = driverRealtime.onConnection((connected) => {
      useDriverHealth.getState().update({ connected });
      if (connected) void client.invalidateQueries({ queryKey: ["driver"] });
    });
    driverRealtime.connect();
    return () => {
      unsubscribe();
      reconnect();
      void driverRealtime.disconnect();
    };
    // Chỉ kết nối lại khi đổi tài khoản; việc refetch session (đổi object user) không được
    // ngắt WebSocket vì sẽ làm mất heartbeat và bỏ lỡ offer.
  }, [userId, client]);
  useEffect(() => {
    if (!userId || (!rideId && !online)) {
      teardown.current = teardown.current.then(stopDriverBackgroundLocation).catch(() => {});
      return;
    }
    let cancelled = false;
    let watcher: Location.LocationSubscription | undefined;
    const previousTeardown = teardown.current;
    const setup = (async () => {
      await previousTeardown;
      if (cancelled) return;
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      let foreground = await Location.getForegroundPermissionsAsync();
      if (!foreground.granted && foreground.canAskAgain) foreground = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      useDriverHealth.getState().update({ foregroundGranted: foreground.granted, servicesEnabled, error: '' });
      if (!foreground.granted) throw new Error("Cần quyền vị trí để nhận chuyến và chia sẻ vị trí.");
      if (!servicesEnabled) throw new Error('Hãy bật dịch vụ vị trí/GPS của thiết bị.');
      if (cancelled) return;
      // Foreground GPS must work before (and independently of) the background
      // permission prompt, which can open Android Settings or fail on web.
      startDriverLocationHeartbeat();
      void restoreLastLocation().catch(() => {});
      void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then(position => { if (!cancelled) publishDriverLocation(position); })
        .catch(() => {
          if (!cancelled) useDriverHealth.getState().update({ error: 'Chưa lấy được GPS mới. Hãy bật vị trí chính xác và thử ở nơi thoáng.' });
        });
      watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: env.locationIntervalMs,
          distanceInterval: 0,
        },
        position => { if (!cancelled) publishDriverLocation(position); },
      );
      if (cancelled) { watcher.remove(); return; }
      const background = await startDriverBackgroundLocation().catch(() => false);
      if (cancelled) return;
      useDriverHealth.getState().update({ backgroundRunning: background });
      const backgroundPermission = await Location.getBackgroundPermissionsAsync().catch(() => null);
      if (cancelled) return;
      if (backgroundPermission) useDriverHealth.getState().update({ backgroundGranted: backgroundPermission.granted });
      // A started native task is not evidence of callbacks while the app is
      // visible. Keep the foreground watch; repeated GPS samples are deduplicated.
    })().catch((error) => {
      if (!cancelled) useDriverHealth.getState().update({ error: error instanceof Error ? error.message : 'Hãy kiểm tra quyền vị trí.' });
    });
    return () => {
      cancelled = true;
      watcher?.remove();
      teardown.current = setup.then(stopDriverBackgroundLocation).catch(() => {});
    };
  }, [userId, rideId, online, retryVersion]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const check = async () => {
      try {
        const [foreground, background, servicesEnabled, backgroundRunning] = await Promise.all([
          Location.getForegroundPermissionsAsync(), Location.getBackgroundPermissionsAsync(),
          Location.hasServicesEnabledAsync(), Location.hasStartedLocationUpdatesAsync('datxe-driver-active-ride-location'),
        ]);
        if (!cancelled) useDriverHealth.getState().update({ foregroundGranted: foreground.granted, backgroundGranted: background.granted, servicesEnabled, backgroundRunning });
      } catch { /* Setup errors remain visible in the status card. */ }
    };
    void check();
    const timer = setInterval(() => void check(), 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [userId]);
  return null;
}
