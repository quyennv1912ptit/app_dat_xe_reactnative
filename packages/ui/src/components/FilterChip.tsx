import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { borderlessFrame } from "../theme/surfaces";
import { typography } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { MotionPressable } from "./MotionPressable";
import { Typography } from "./Typography";

export type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Borderless 48dp+ pill chip that wraps naturally on 320dp screens and large system font scales. */
export function FilterChip({
  label,
  selected = false,
  onPress,
  disabled = false,
  icon,
  accessibilityLabel,
  style,
}: FilterChipProps) {
  const colors = useThemeColors();
  const backgroundColor = selected ? colors.primaryContainer : colors.surfaceContainerHigh;
  const foregroundColor = selected ? colors.onPrimaryContainer : colors.onSurfaceVariant;
  const resolvedIcon = selected ? (icon ?? "check") : icon;

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {resolvedIcon ? (
          <MaterialIcons
            name={resolvedIcon}
            size={18}
            color={foregroundColor}
            importantForAccessibility="no"
          />
        ) : null}
        <Typography
          textBreakStrategy="simple"
          style={[styles.label, { color: foregroundColor }]}
        >
          {label}
        </Typography>
      </View>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    ...borderlessFrame,
    minHeight: 48,
    maxWidth: "100%",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: {
    ...typography.label,
    textAlign: "center",
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});
