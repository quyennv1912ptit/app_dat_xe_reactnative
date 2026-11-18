import { spacing, typography } from "@datxe/ui";
import type { ThemeColors } from "@datxe/ui";
import { StyleSheet } from "react-native";

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.margin,
    },
    glow: {
      position: "absolute",
      width: spacing.radarOuter,
      height: spacing.radarOuter,
      borderRadius: spacing.radarOuter / 2,
      backgroundColor: colors.onPrimary20,
      opacity: 0.35,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      padding: spacing.spaceLg,
      alignItems: "center",
      gap: 14,
    },
    logo: {
      width: spacing.radarCore + spacing.spaceLg,
      height: spacing.radarCore + spacing.spaceLg,
      borderRadius: 24,
    },
    tagline: {
      ...typography.label,
      textAlign: "center",
      color: colors.onSurfaceVariant,
    },
    actionButton: {
      alignSelf: "stretch",
    },
  });
