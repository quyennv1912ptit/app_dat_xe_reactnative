import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const chatStatuses = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
];

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.margin, gap: 16, paddingBottom: 48 },
    flex: { flex: 1 },
    error: { color: colors.error, lineHeight: 22 },
    notice: {
      alignItems: "flex-start",
      gap: 12,
      padding: 16,
      borderRadius: 24,
      backgroundColor: colors.cardSurface,
    },
    heading: { ...typography.headlineSm, color: colors.onSurface },
    body: { ...typography.bodyMd, color: colors.onSurface, textAlign: "left" },
    meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
    card: {
      padding: 16,
      gap: 12,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    section: { ...typography.labelLg, color: colors.onSurface },
    ride: {
      padding: 16,
      gap: 8,
      borderRadius: 24,

      backgroundColor: colors.surfaceContainerLowest,
    },
    label: { ...typography.labelSm, color: colors.primary },
    link: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 6,
    },
    linkText: { ...typography.labelLg, color: colors.primary },
    chat: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 999,
      backgroundColor: colors.primaryFixedTint,
    },
    chatText: { ...typography.labelLg, color: colors.primary },
  });
