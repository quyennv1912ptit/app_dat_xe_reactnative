import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { padding: spacing.margin, gap: 16, paddingBottom: 28 },
    success: { alignItems: "center", gap: 8, padding: 16 },
    heading: { ...typography.sectionTitle, color: colors.onSurface },
    meta: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    card: {
      padding: 16,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
      gap: 8,
    },
    section: { ...typography.cardTitle, color: colors.onSurface },
    body: { ...typography.body, color: colors.onSurface },
    divider: { height: 1, backgroundColor: colors.outlineVariant },
    priceRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    price: { ...typography.label, color: colors.primary, fontVariant: ["tabular-nums"] },
    stars: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
    star: { alignItems: "center", borderRadius: 999 },
    footer: { padding: 16, gap: 4, backgroundColor: colors.cardSurface },
    input: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 24,
      padding: 12,
      textAlignVertical: "top",
      ...typography.body,
      color: colors.onSurface,
    },
    counter: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
      textAlign: "right",
      fontVariant: ["tabular-nums"],
    },
    primary: {
      minHeight: 52,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { ...typography.button, color: colors.onPrimary },
    skip: { minHeight: 48, justifyContent: "center", alignItems: "center", padding: 12 },
    skipText: { ...typography.button, color: colors.primary },
    disabled: { opacity: 0.55 },
    error: { ...typography.bodySecondary, color: colors.error },
  });
