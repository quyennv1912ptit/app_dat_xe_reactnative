import type { ThemeColors } from "@datxe/ui";
import { spacing, typography } from "@datxe/ui";
import { StyleSheet } from "react-native";
export const genderOptions = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
] as const;

export type SignInMethod = "google" | "facebook" | "phone";

/**
 * Xác định phương thức đăng nhập thật của phiên Firebase hiện tại.
 *
 * Tài khoản Google/Facebook vẫn có thể đã liên kết thêm số điện thoại (kể cả
 * số kiểm thử), nên tuyệt đối không lấy `user.phoneNumber` làm phương thức
 * đăng nhập — nếu không màn Hoàn tất đăng ký sẽ hiển thị một số điện thoại
 * không phải của người dùng dưới nhãn "Phương thức đăng nhập".
 */
export function getSignInMethod(providerIds: readonly string[]): SignInMethod {
  if (providerIds.includes("google.com")) return "google";
  if (providerIds.includes("facebook.com")) return "facebook";
  return "phone";
}

export function formatIsoDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isPastIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  )
    return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
      minHeight: spacing.headerHeight,
      paddingHorizontal: spacing.spaceSm,
    },
    title: {
      ...typography.titleLg,
      color: colors.onSurface,
      flex: 1,
    },
    content: {
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceSm,
      paddingBottom: spacing.spaceLg,
      gap: spacing.spaceMd,
    },
    fieldGroup: { gap: spacing.gap1_5 },
    fieldLabel: {
      ...typography.label,
      color: colors.onSurface,
    },
    inputSurface: {
      backgroundColor: colors.cardSurface,
    },
    dateRow: {
      minHeight: spacing.inputHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      borderRadius: 24,
      backgroundColor: colors.cardSurface,
      paddingHorizontal: spacing.px3_5,
    },
    dateInput: {
      ...typography.body,
      flex: 1,
      minWidth: 0,
      color: colors.onSurface,
    },
    datePlaceholder: { color: colors.onSurfaceVariant },
    fieldHint: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    genderOptions: {
      flexDirection: "row",
      gap: spacing.spaceSm,
      flexWrap: "wrap",
    },
    genderOption: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: spacing.spaceMd,

      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLowest,
    },
    genderOptionSelected: {
      backgroundColor: colors.primaryContainer,
    },
    genderOptionText: {
      ...typography.label,
      color: colors.onSurfaceVariant,
    },
    genderOptionTextSelected: {
      ...typography.button,
      color: colors.onPrimaryContainer,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceSm,
      padding: spacing.px3_5,
      borderRadius: 24,
      backgroundColor: colors.cardSurface,
    },
    infoCopy: { flex: 1 },
    infoLabel: { ...typography.caption, color: colors.onSurfaceVariant },
    infoValue: {
      ...typography.label,
      color: colors.onSurface,
      marginTop: spacing.py0_5,
    },
    helperText: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    errorText: { ...typography.bodySecondary, color: colors.error },
    footer: {
      paddingHorizontal: spacing.margin,
      paddingBottom: spacing.spaceSm,
    },
    legalNotice: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: spacing.spaceLg,
      paddingBottom: spacing.spaceSm,
    },
    legalLink: {
      ...typography.label,
      color: colors.primary,
    },
  });
