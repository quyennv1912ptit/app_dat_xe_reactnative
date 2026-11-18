import { translate } from "@datxe/shared";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { typography } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

/** The same group heading and card alignment used by Settings and Profile. */
export function SectionHeading({
  title,
  uppercase = false,
}: {
  title: string;
  uppercase?: boolean;
}) {
  useLanguage();
  const colors = useThemeColors();
  return (
    <Text
      variant="titleSmall"
      accessibilityRole="header"
      style={[
        styles.heading,
        { color: colors.primary },
        uppercase && styles.uppercase,
      ]}
    >
      {translate(title)}
    </Text>
  );
}
const styles = StyleSheet.create({
  heading: {
    ...typography.label,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  uppercase: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
