import { formatMoney, getLocale } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export type Filter = "all" | "completed" | "cancelled";

export const labelForStatus: Record<string, string> = {
  PENDING: "Đang tiếp nhận",
  SEARCHING: "Đang tìm tài xế",
  DRIVER_ASSIGNED: "Đã có tài xế",
  DRIVER_ARRIVING: "Tài xế đang đến",
  DRIVER_ARRIVED: "Tài xế đã đến",
  VEHICLE_HANDOVER: "Bàn giao xe",
  IN_PROGRESS: "Đang thực hiện",
  ARRIVED_DESTINATION: "Đã đến nơi",
  VEHICLE_RETURNED: "Đã trả xe",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  FAILED_SYSTEM: "Không thể tìm tài xế do lỗi hệ thống",
  NO_DRIVER_FOUND: "Không tìm được tài xế",
  EXPIRED: "Hết hạn",
};

export const money = (value: number) =>
  formatMoney(value, { locale: getLocale(), nonBreaking: true });

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: {
      padding: spacing.margin,
      gap: spacing.spaceMd,
      paddingBottom: spacing.spaceXl,
    },
    list: { gap: 16 },
    summary: {
      alignItems: "center",
      padding: 16,
      borderRadius: 24,
      backgroundColor: colors.cardSurface,
      gap: 2,
    },
    summaryCount: { ...typography.display, fontVariant: ["tabular-nums"], color: colors.onSurface },
    summaryText: { ...typography.body, color: colors.onSurfaceVariant },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    filter: {
      flexGrow: 1,
      flexBasis: "28%",
      minWidth: 80,
      minHeight: 48,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,

      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
    },
    filterActive: {
      backgroundColor: colors.primaryContainer,
    },
    filterText: {
      ...typography.label,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    filterTextActive: { color: colors.onPrimaryContainer },
    ride: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 8,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLowest,
    },
    rideHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    rideTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
      minWidth: 0,
    },
    rideTitle: {
      ...typography.cardTitle,
      color: colors.onSurfaceMuted,
      flexShrink: 1,
    },
    status: {
      ...typography.badge,
      color: colors.onSurfaceVariant,
      flexShrink: 1,
    },
    statusCancelled: { color: colors.error },
    meta: { ...typography.caption, color: colors.onSurfaceMuted },
    addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    address: {
      ...typography.body,
      color: colors.onSurface,
      flex: 1,
      minWidth: 0,
    },
    pin: { ...typography.label, color: colors.onSurfaceMuted, minWidth: 36 },
    rideFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingTop: 12,
    },
    fareCopy: { flex: 1, minWidth: 0, gap: 2 },
    fare: { ...typography.moneyDisplay, color: colors.onSurface },
    more: { minHeight: 48, justifyContent: "center", alignItems: "center" },
    moreText: { ...typography.button, color: colors.primary },
    error: { ...typography.bodySecondary, color: colors.error },
  });
