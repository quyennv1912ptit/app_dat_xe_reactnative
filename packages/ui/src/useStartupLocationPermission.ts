import { useEffect } from 'react';
import { Alert, AppState, Platform } from 'react-native';

type Permission = { granted: boolean; canAskAgain: boolean; status: string };
type LocationPermissions = {
  getForegroundPermissionsAsync: () => Promise<Permission>;
  requestForegroundPermissionsAsync: () => Promise<Permission>;
};

let pending: Promise<Permission> | undefined;

export function ensureForegroundLocationPermission(location: LocationPermissions, userInitiated = false) {
  if (pending) return pending;
  pending = (async () => {
    const permission = await location.getForegroundPermissionsAsync();
    if (!permission.granted && permission.canAskAgain && (userInitiated || permission.status === 'undetermined')) {
      return location.requestForegroundPermissionsAsync();
    }
    return permission;
  })().finally(() => { pending = undefined; });
  return pending;
}

export function useStartupLocationPermission(ready: boolean, location: LocationPermissions, rationale?: string) {
  useEffect(() => {
    if (!ready || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return;
    let started = false;
    let active = true;
    const request = () => {
      if (started) return;
      started = true;
      void (async () => {
        const permission = await location.getForegroundPermissionsAsync();
        if (!active || permission.granted || !permission.canAskAgain || permission.status !== 'undetermined') return;
        if (rationale) {
          const accepted = await new Promise<boolean>(resolve => Alert.alert('Cho phép sử dụng vị trí?', rationale, [
            { text: 'Để sau', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Tiếp tục', onPress: () => resolve(true) },
          ], { cancelable: true, onDismiss: () => resolve(false) }));
          if (!accepted || !active) return;
        }
        await ensureForegroundLocationPermission(location);
      })().catch(() => {});
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') request();
    });
    if (AppState.currentState === 'active') request();
    return () => { active = false; subscription.remove(); };
  }, [ready, location, rationale]);
}
