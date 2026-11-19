import { validateEnv } from "@/config/env";
import "@/lib/auth";
import "@/lib/logger";
import { queryClient } from "@/lib/queryClient";
import { useScreenMotion, useSystemBarSync, useTheme, usePushForegroundLaunch, useStartupLocationPermission } from "@datxe/ui";
import * as SystemUI from "expo-system-ui";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { DriverRealtimeBridge } from "./DriverRealtimeBridge";
import { DriverSettingsProvider } from "@/lib/settings/DriverSettingsProvider";
import { PushBridge } from "./PushBridge";

export default function RootLayout() {
  validateEnv();

  // Expo's floating Tools gear covers top-right header actions on development builds.
  // The development menu remains available through the normal device gesture.
  useEffect(() => {
    if (!__DEV__ || Platform.OS === "web") return;
    let mounted = true;
    void import("expo-dev-client")
      .then((menu) => {
        if (mounted) menu.setToolsButtonVisible(false);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const [loaded, error] = useFonts(MaterialIcons.font);
  const [fontTimeout, setFontTimeout] = useState(false);
  const foregroundLaunch = usePushForegroundLaunch();
  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  const fontsSettled = Boolean(loaded || error || fontTimeout);
  useStartupLocationPermission(foregroundLaunch && fontsSettled, Location);
  if (!foregroundLaunch || !fontsSettled) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <DriverSettingsProvider>
            <PushBridge />
            <DriverRealtimeBridge />
            <DriverStack />
          </DriverSettingsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function DriverStack() {
  const screenOptions = useScreenMotion();
  const { dark, colors } = useTheme();
  const systemBarTick = useSystemBarSync();
  useEffect(() => {
    if (Platform.OS === "web") return;
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background, systemBarTick]);
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions} />
    </>
  );
}
