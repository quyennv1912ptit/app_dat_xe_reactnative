import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

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

export function useStartupLocationPermission(ready: boolean, location: LocationPermissions) {
  useEffect(() => {
    if (!ready || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return;
    let started = false;
    const request = () => {
      if (started) return;
      started = true;
      void ensureForegroundLocationPermission(location).catch(() => {});
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') request();
    });
    if (AppState.currentState === 'active') request();
    return () => subscription.remove();
  }, [ready, location]);
}
