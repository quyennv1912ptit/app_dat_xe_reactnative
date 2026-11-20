import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import { typography } from "./colors";
import type { ThemeColors } from "./ThemeProvider";

/** Shared semantic roles align Paper widgets with the PtitGo typography system. */
export function createMaterialTheme(
  colors: ThemeColors,
  dark: boolean,
): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  const fonts = {
    ...base.fonts,
    displayLarge: { ...base.fonts.displayLarge, ...typography.display },
    displayMedium: { ...base.fonts.displayMedium, ...typography.display },
    displaySmall: { ...base.fonts.displaySmall, ...typography.moneyDisplay },
    headlineLarge: { ...base.fonts.headlineLarge, ...typography.display },
    headlineMedium: { ...base.fonts.headlineMedium, ...typography.screenTitle },
    headlineSmall: { ...base.fonts.headlineSmall, ...typography.screenTitle },
    titleLarge: { ...base.fonts.titleLarge, ...typography.sectionTitle },
    titleMedium: { ...base.fonts.titleMedium, ...typography.cardTitle },
    titleSmall: { ...base.fonts.titleSmall, ...typography.label },
    bodyLarge: { ...base.fonts.bodyLarge, ...typography.body },
    bodyMedium: { ...base.fonts.bodyMedium, ...typography.bodySecondary },
    bodySmall: { ...base.fonts.bodySmall, ...typography.caption },
    labelLarge: { ...base.fonts.labelLarge, ...typography.button },
    labelMedium: { ...base.fonts.labelMedium, ...typography.label },
    labelSmall: { ...base.fonts.labelSmall, ...typography.badge },
  };
  return {
    ...base,
    fonts,
    roundness: 6,
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryContainer: colors.primaryContainer,
      onPrimaryContainer: colors.onPrimaryContainer,
      secondary: colors.secondary,
      onSecondary: colors.onSecondary,
      secondaryContainer: colors.secondaryContainer,
      onSecondaryContainer: colors.onSecondaryContainer,
      tertiary: colors.tertiary,
      onTertiary: colors.onTertiary,
      tertiaryContainer: colors.tertiaryContainer,
      onTertiaryContainer: colors.onTertiaryContainer,
      error: colors.error,
      onError: colors.onError,
      errorContainer: colors.errorContainer,
      onErrorContainer: colors.onErrorContainer,
      background: colors.background,
      onBackground: colors.onBackground,
      // Nền mờ sau dialog/modal trong suốt hoàn toàn (alpha 0) ở cả app khách lẫn tài xế.
      backdrop: colors.transparent,
      surface: colors.cardSurface,
      onSurface: colors.onSurface,
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant: colors.onSurfaceVariant,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
      inverseSurface: colors.inverseSurface,
      inverseOnSurface: colors.inverseOnSurface,
      inversePrimary: colors.inversePrimary,
    },
  };
}
