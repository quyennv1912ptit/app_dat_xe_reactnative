import { useEffect, useState } from "react";
import { AppState, Appearance, Dimensions, Platform } from "react-native";

/**
 * Triggers a lightweight re-render when the app returns to foreground or Android
 * dispatches a configuration/appearance change so mounted `<StatusBar>` entries
 * re-sync their native system bar icon contrast.
 */
export function useSystemBarSync(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        setTick((current) => current + 1);
      });
    };

    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") schedule();
    });
    const appearanceSub = Appearance.addChangeListener(schedule);
    const dimensionsSub = Dimensions.addEventListener("change", schedule);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      appSub.remove();
      appearanceSub.remove();
      dimensionsSub.remove();
    };
  }, []);

  return tick;
}
