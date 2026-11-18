import { createContext, useContext } from "react";
import { StyleSheet, type TextProps } from "react-native";
import { Text } from "react-native-paper";
import { typography, type TypographyRole } from "../theme/colors";
import { useThemedStyles, type ThemeColors } from "../theme/ThemeProvider";

export type TypographyProps = TextProps & {
  variant?: TypographyRole;
  color?: string;
  tabular?: boolean;
};

const NestedText = createContext(false);
export function Typography({
  style,
  children,
  variant,
  color,
  tabular = false,
  textBreakStrategy = "simple",
  ...props
}: TypographyProps) {
  const nested = useContext(NestedText);
  const styles = useThemedStyles(createStyles);
  const roleStyle = variant ? (typography[variant] ?? typography.body ?? typography.bodyMd) : undefined;
  return (
    <NestedText.Provider value>
      <Text
        {...props}
        textBreakStrategy={textBreakStrategy}
        style={[
          !nested && styles.body,
          roleStyle,
          tabular && styles.tabular,
          color ? { color } : null,
          style,
        ]}
      >
        {children}
      </Text>
    </NestedText.Provider>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { ...(typography.body ?? typography.bodyMd), color: colors.onSurface },
    tabular: { fontVariant: ["tabular-nums"] },
  });
