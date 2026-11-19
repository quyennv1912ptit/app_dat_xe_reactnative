import { MaterialIcons } from "@expo/vector-icons";
import { translate } from "@datxe/shared";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { Badge, Text } from "react-native-paper";
import { fontWeight, typography } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";

export type NavigationItem = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  outlineIcon?: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
};

/** MD3 navigation indicators use tone and shape, with a 48dp touch target. */
export function TonalNavigationBar({
  items,
  active,
  onSelect,
  appearance = "tonal",
}: {
  items: readonly NavigationItem[];
  active: string;
  onSelect: (id: string) => void;
  /** `flat` bỏ pill nền, chỉ dùng màu primary + icon đậm cho tab đang chọn. */
  appearance?: "tonal" | "flat";
}) {
  const colors = useThemeColors();
  const dimensions = typeof useWindowDimensions === "function"
    ? useWindowDimensions()
    : { width: 390, fontScale: 1 };
  const compactBar = dimensions.width < 360 || dimensions.fontScale >= 1.4;
  const flat = appearance === "flat";
  // Phản hồi nhấn chỉ tô sáng viên thuốc (pill) quanh icon, không phủ
  // ripple hình chữ nhật lên cả ô tab.
  const [pressedId, setPressedId] = useState<string | null>(null);
  // Đổi tab hoặc quay lại màn cũ không được giữ lại highlight nhấn của tab trước.
  useEffect(() => { setPressedId(null); }, [active]);
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, compactBar && styles.compactBar, { backgroundColor: colors.cardSurface }]}
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.badge
              ? translate("{0}, {1} chưa đọc", { 0: translate(item.label), 1: item.badge })
              : translate(item.label)}
            onPress={() => {
              setPressedId(null);
              if (!selected) onSelect(item.id);
            }}
            onPressIn={() => setPressedId(item.id)}
            onPressOut={() => setPressedId(current => (current === item.id ? null : current))}
            style={styles.tab}
          >
            <View style={styles.content}>
              <View style={styles.indicatorWrap}>
                <View
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: flat
                        ? colors.transparent
                        : selected
                          ? colors.primaryContainer
                          : pressedId === item.id
                            ? colors.surfaceContainerHighest
                            : colors.transparent,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={selected ? item.icon : (item.outlineIcon ?? item.icon)}
                    size={24}
                    color={
                      selected
                        ? flat
                          ? colors.primary
                          : colors.onPrimaryContainer
                        : colors.onSurfaceVariant
                    }
                  />
                </View>
                {item.badge ? (
                  <View
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                    style={styles.badgeWrap}
                  >
                    <Badge size={16} style={styles.badge}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  </View>
                ) : null}
              </View>
              <Text
                variant="labelMedium"
                textBreakStrategy="simple"
                style={[
                  typography.navigationLabel,
                  {
                    width: "100%",
                    paddingHorizontal: compactBar ? 1 : 2,
                    color: selected
                      ? flat
                        ? colors.primary
                        : colors.onSurface
                      : colors.onSurfaceVariant,
                    textAlign: "center",
                    fontWeight: flat && selected ? fontWeight.semibold : fontWeight.medium,
                  },
                ]}
              >
                {translate(item.label)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    minHeight: 80,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  compactBar: {
    paddingHorizontal: 4,
  },
  tab: { flex: 1, minHeight: 64, borderRadius: 16, justifyContent: "flex-start" },
  content: { alignItems: "center", justifyContent: "flex-start", gap: 4, paddingVertical: 6 },
  indicatorWrap: {
    width: 64,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: { position: "absolute", top: -4, right: 4 },
  badge: { borderRadius: 999 },
});
