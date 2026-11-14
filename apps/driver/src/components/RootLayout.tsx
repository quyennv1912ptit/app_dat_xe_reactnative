import { validateEnv } from "@/config/env";
import "@/lib/auth";
import "@/lib/logger";
import { queryClient } from "@/lib/queryClient";
import { useScreenMotion, useTheme, usePushForegroundLaunch } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DriverRealtimeBridge } from "./DriverRealtimeBridge";
import { DriverSettingsProvider } from "@/lib/settings/DriverSettingsProvider";
import { PushBridge } from "./PushBridge";

export default function RootLayout() {
  validateEnv();
  const [loaded, error] = useFonts(MaterialIcons.font);
  const [fontTimeout, setFontTimeout] = useState(false);
  const foregroundLaunch = usePushForegroundLaunch();
  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  if (!foregroundLaunch || (!loaded && !error && !fontTimeout)) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <DriverSettingsProvider>
          <PushBridge />
          <DriverRealtimeBridge />
          <DriverStack />
        </DriverSettingsProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function DriverStack() {
  const screenOptions = useScreenMotion();
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions} />
    </>
  );
}
