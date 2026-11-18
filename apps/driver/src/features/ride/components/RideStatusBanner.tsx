import type { StatusBanner } from "../ridePresentation";
import { Card, Typography as Text, spacing, typography, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const TONE_ICONS: Record<StatusBanner["tone"], React.ComponentProps<typeof MaterialIcons>["name"]> = {
  info: "info-outline",
  warning: "schedule",
  success: "check-circle-outline",
  error: "error-outline",
};

export function RideStatusBanner({
  banner,
  action,
  children,
}: {
  banner: StatusBanner;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  const palette =
    banner.tone === "warning"
      ? { bg: colors.warningContainer, fg: colors.onWarningContainer }
      : banner.tone === "success"
        ? { bg: colors.successContainer, fg: colors.onSuccessContainer }
        : banner.tone === "error"
          ? { bg: colors.errorContainer, fg: colors.onErrorContainer }
          : { bg: colors.surfaceContainerHigh, fg: colors.onSurface };

  const liveRegion = banner.tone === "error" || banner.tone === "warning" ? "polite" : "none";

  return (
    <Card style={[styles.card, { backgroundColor: palette.bg }]}>
      <View style={styles.header} accessibilityLiveRegion={liveRegion}>
        <MaterialIcons name={TONE_ICONS[banner.tone]} size={22} color={palette.fg} importantForAccessibility="no" />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: palette.fg }]}>
            {banner.title}
          </Text>
          <Text style={[styles.message, { color: palette.fg }]}>{banner.message}</Text>
        </View>
      </View>
      {children}
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceMd, gap: spacing.spaceSm },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.px3 },
  copy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  title: { ...typography.cardTitle },
  message: { ...typography.bodySecondary },
});
