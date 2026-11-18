import type { ThemeColors } from "@datxe/ui";
import { typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const rideStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    page: { padding: 16, gap: 16, paddingBottom: 32 },
    title: {
      ...typography.sectionTitle,
      color: colors.onSurface,
    },
    text: {
      ...typography.body,
      color: colors.onSurface,
    },
    label: {
      ...typography.label,
      color: colors.onSurfaceVariant,
    },
    card: {
      padding: 16,
      borderRadius: 24,
      gap: 8,
      backgroundColor: colors.surfaceContainerLowest,
    },
    listRow: { paddingVertical: 16, gap: 8 },
    button: {
      minHeight: 48,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    buttonText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    link: {
      ...typography.button,
      color: colors.primary,
    },
    error: { ...typography.bodySecondary, color: colors.error },
    amount: { ...typography.moneyDisplay, flexShrink: 1, color: colors.onSurface },
    metric: { ...typography.sectionTitle, fontVariant: ["tabular-nums"], flexShrink: 1, color: colors.onSurface },
  });
