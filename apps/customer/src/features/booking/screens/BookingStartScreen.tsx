import { ActivityIndicator } from "react-native-paper";
import { translate as i18nT } from "@datxe/shared";
import { useLanguage, useThemeColors, useThemedStyles } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { useBookingStart } from "../hooks/useBookingStart";
export default function BookingStartScreen() {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  useBookingStart();
  return (
    <View style={extra.item1}>
      <ActivityIndicator
        color={colors.primary}
        accessibilityLabel={i18nT("Đang mở luồng đặt chuyến")}
      />
    </View>
  );
}

const extraStyles = () =>
  StyleSheet.create({
    item1: { flex: 1, justifyContent: "center" },
  });
