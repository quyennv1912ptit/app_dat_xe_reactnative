import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { typography } from "../theme/colors";
import { useThemeColors, type ThemeColors } from "../theme/ThemeProvider";
import { Typography } from "./Typography";

export type SharedStatusTone = "neutral" | "pending" | "active" | "success" | "danger";

const defaultIcons: Record<SharedStatusTone, keyof typeof MaterialIcons.glyphMap> = {
  neutral: "info-outline",
  pending: "schedule",
  active: "radio-button-checked",
  success: "check-circle-outline",
  danger: "error-outline",
};

export const sharedStatusColors = (
  c: ThemeColors,
): Record<SharedStatusTone, { backgroundColor: string; color: string }> => ({
  neutral: { backgroundColor: c.surfaceContainerHigh, color: c.onSurface },
  pending: { backgroundColor: c.warningContainer, color: c.onWarningContainer },
  active: { backgroundColor: c.primaryContainer, color: c.onPrimaryContainer },
  success: { backgroundColor: c.successContainer, color: c.onSuccessContainer },
  danger: { backgroundColor: c.errorContainer, color: c.onErrorContainer },
});

export type SharedStatusBadgeProps = {
  label: string;
  tone?: SharedStatusTone;
  icon?: keyof typeof MaterialIcons.glyphMap | null;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Pill status badge sized so short labels never clip or truncate under Android Fabric font measurements. */
export function SharedStatusBadge({
  label,
  tone = "neutral",
  icon,
  accessibilityLabel,
  style,
}: SharedStatusBadgeProps) {
  const colors = useThemeColors();
  const palette = sharedStatusColors(colors)[tone];
  const resolvedIcon = icon === undefined ? defaultIcons[tone] : icon;
  const labelMinWidth =
    label.includes(" ") && label.length <= 28 ? Math.ceil(label.length * 6.9) : undefined;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.base, { backgroundColor: palette.backgroundColor }, style]}
    >
      {resolvedIcon ? (
        <MaterialIcons
          name={resolvedIcon}
          size={16}
          color={palette.color}
          importantForAccessibility="no"
        />
      ) : null}
      <Typography
        textBreakStrategy="simple"
        style={[
          styles.label,
          labelMinWidth !== undefined ? { minWidth: labelMinWidth } : null,
          { color: palette.color },
        ]}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    maxWidth: "100%",
    minHeight: 32,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    ...typography.badge,
  },
});
