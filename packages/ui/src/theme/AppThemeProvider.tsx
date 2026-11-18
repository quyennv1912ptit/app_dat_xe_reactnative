import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, type ReactNode } from "react";
import { Appearance, Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import {
  ThemeProvider,
  useTheme,
  type ThemeBrand,
  type ThemeMode,
} from "./ThemeProvider";
import { createMaterialTheme } from "./materialTheme";

const paperSettings = {
  icon: (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
    <MaterialCommunityIcons {...props} />
  ),
};

function MaterialProvider({ children }: { children: ReactNode }) {
  const { colors, dark } = useTheme();
  const theme = useMemo(
    () => createMaterialTheme(colors, dark),
    [colors, dark],
  );
  return (
    <PaperProvider theme={theme} settings={paperSettings}>
      {children}
    </PaperProvider>
  );
}

/** App-wide MD3 provider, shared by customer and driver. */
export function AppThemeProvider({
  children,
  ...props
}: {
  children: ReactNode;
  mode?: ThemeMode;
  brand?: ThemeBrand;
}) {
  const mode = props.mode ?? "system";
  useEffect(() => {
    if (Platform.OS === "web" || typeof Appearance?.setColorScheme !== "function") return;
    Appearance.setColorScheme(
      mode === "dark" ? "dark" : mode === "light" ? "light" : "unspecified",
    );
  }, [mode]);
  return (
    <ThemeProvider {...props}>
      <MaterialProvider>{children}</MaterialProvider>
    </ThemeProvider>
  );
}
