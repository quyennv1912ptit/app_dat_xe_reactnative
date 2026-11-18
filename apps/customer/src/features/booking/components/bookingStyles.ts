import type { ThemeColors } from "@datxe/ui";
import { typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const bookingStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    white: { backgroundColor: colors.surfaceContainerLowest },
    flex: { flex: 1 },
    page: { padding: 16, gap: 16, paddingBottom: 28 },
    title: {
      ...typography.screenTitle,
      color: colors.onSurface,
    },
    section: {
      ...typography.sectionTitle,
      color: colors.onSurface,
    },
    text: {
      ...typography.body,
      color: colors.onSurface,
    },
    muted: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    label: {
      ...typography.label,
      color: colors.onSurfaceVariant,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    between: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      backgroundColor: colors.surfaceContainerLowest,
      padding: 16,
      borderRadius: 24,
      gap: 12,
    },
    selected: {
      backgroundColor: colors.primarySoft,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 4,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 8,
      backgroundColor: colors.surfaceContainerLowest,
    },
    primary: {
      minHeight: 54,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    disabled: { opacity: 0.42 },
    link: {
      ...typography.label,
      color: colors.primary,
    },
    error: {
      ...typography.bodySecondary,
      color: colors.onErrorContainer,
    },
    errorBox: {
      padding: 16,
      borderRadius: 24,
      backgroundColor: colors.errorContainer,
      gap: 8,
    },
    search: {
      ...typography.body,
      flex: 1,
      minHeight: 48,
      color: colors.onSurface,
      paddingVertical: 10,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLowest,
    },
    listItem: {
      paddingHorizontal: 0,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,

      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 999,
    },
    empty: { padding: 32, alignItems: "center", gap: 12 },
    chip: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.primarySoft,
    },
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.surfaceContainerLowest,
      padding: 16,
      gap: 16,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.outlineVariant,
      alignSelf: "center",
      marginBottom: 8,
    },
  });
