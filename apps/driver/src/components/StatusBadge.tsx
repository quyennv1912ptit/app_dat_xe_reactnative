import { SharedStatusBadge, sharedStatusColors, type ThemeColors } from "@datxe/ui";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import {
  statusLabel,
  type StatusKind,
  type StatusTone,
} from "@/lib/displayLabels";

const icons = {
  neutral: "info-outline",
  pending: "schedule",
  active: "radio-button-checked",
  success: "check-circle-outline",
  danger: "error-outline",
} as const;

export function StatusBadge({
  kind,
  value,
  contextLabel,
  style,
}: {
  kind: StatusKind;
  value: string | null | undefined;
  contextLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const status = statusLabel(kind, value);
  return (
    <SharedStatusBadge
      label={status.label}
      tone={status.tone}
      icon={icons[status.tone]}
      accessibilityLabel={
        contextLabel ? `${contextLabel}: ${status.label}` : status.label
      }
      style={[styles.wrap, style]}
    />
  );
}

export const badgeColors = (
  c: ThemeColors,
): Record<StatusTone, { backgroundColor: string; color: string }> =>
  sharedStatusColors(c);

const styles = StyleSheet.create({
  wrap: { flexShrink: 0 },
});
