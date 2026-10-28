import type { RideCoordinates } from '@datxe/shared';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { DEFAULT_MAP_CENTER } from '../bookingUtils';

export function useSearchProximity(selected?: RideCoordinates) {
  const [device, setDevice] = useState<RideCoordinates | null>(null);
  useEffect(() => {
    if (selected) return;
    let active = true;
    void (async () => {
      // Reuse existing permission; searching must not trigger a new permission dialog.
      if (!(await Location.getForegroundPermissionsAsync()).granted) return;
      const known = await Location.getLastKnownPositionAsync({ maxAge: 120000, requiredAccuracy: 200 });
      if (active && known) setDevice({ lat: known.coords.latitude, lng: known.coords.longitude });
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setDevice({ lat: current.coords.latitude, lng: current.coords.longitude });
    })().catch(() => { /* Hanoi remains available when GPS is off/unavailable. */ });
    return () => { active = false; };
  }, [selected]);
  return selected ?? device ?? DEFAULT_MAP_CENTER;
}
