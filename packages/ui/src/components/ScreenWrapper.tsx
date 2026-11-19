import { Platform, StatusBar, StyleSheet, View, type ViewProps } from "react-native";
import {
  useSafeAreaInsets,
  type Edge,
} from "react-native-safe-area-context";
import { useThemedStyles, type ThemeColors } from "../theme/ThemeProvider";

export type ScreenWrapperProps = ViewProps & {
  edges?: readonly Edge[];
};

const ALL_EDGES: readonly Edge[] = ["top", "right", "bottom", "left"];

export function ScreenWrapper({ style, edges = ALL_EDGES, ...props }: ScreenWrapperProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const topInset = edges.includes("top")
    ? (insets.top > 0 ? insets.top : Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0)
    : 0;
  const edgePadding = {
    paddingTop: topInset,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };
  return <View {...props} style={[styles.screen, edgePadding, style]} />;
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
  });
