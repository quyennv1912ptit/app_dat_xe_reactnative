type MapboxRuntime = {
  setAccessToken: (token: string) => Promise<unknown>;
  setTelemetryEnabled: (enabled: boolean) => void;
};

export async function initializeMapbox(sdk: MapboxRuntime, token: string | undefined): Promise<boolean> {
  const publicToken = token?.trim();
  // EXPO_PUBLIC_* is bundled into the client: accept public tokens only.
  if (!publicToken || !/^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publicToken)) return false;

  // Android's telemetry setter creates a temporary native MapView itself.
  // Wait for the native token assignment before calling it or rendering a map.
  await sdk.setAccessToken(publicToken);
  sdk.setTelemetryEnabled(false);
  return true;
}
