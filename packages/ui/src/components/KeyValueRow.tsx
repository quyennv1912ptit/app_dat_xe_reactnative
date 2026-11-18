import { StyleSheet, View, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { typography } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { Typography } from "./Typography";

export type KeyValueRowProps = {
  label: string;
  value: string;
  strong?: boolean;
  tabular?: boolean;
  valueColor?: string;
  forceStack?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
};

/** Adaptive label/value row that stacks vertically on compact widths or large font scales instead of clipping values. */
export function KeyValueRow({
  label,
  value,
  strong = false,
  tabular = true,
  valueColor,
  forceStack = false,
  style,
  labelStyle,
  valueStyle,
}: KeyValueRowProps) {
  const colors = useThemeColors();
  const dimensions = typeof useWindowDimensions === "function"
    ? useWindowDimensions()
    : { width: 390, fontScale: 1 };
  const stacked =
    forceStack ||
    dimensions.width < 360 ||
    dimensions.fontScale >= 1.35 ||
    value.length > 22 ||
    label.length + value.length > 36;

  return (
    <View style={[styles.row, stacked && styles.rowStacked, style]}>
      <Typography
        textBreakStrategy="simple"
        style={[
          typography.body,
          styles.label,
          !stacked && styles.labelInline,
          { color: colors.onSurfaceVariant },
          labelStyle,
        ]}
      >
        {label}
      </Typography>
      <Typography
        textBreakStrategy="simple"
        style={[
          typography.body,
          styles.value,
          !stacked && styles.valueInline,
          tabular && styles.tabular,
          strong && styles.strong,
          { color: valueColor ?? colors.onSurface },
          valueStyle,
        ]}
      >
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  rowStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  label: {
    flexShrink: 1,
  },
  labelInline: {
    flexShrink: 0,
    maxWidth: "52%",
  },
  value: {
    flexShrink: 1,
  },
  valueInline: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  strong: {
    ...typography.cardTitle,
  },
});
