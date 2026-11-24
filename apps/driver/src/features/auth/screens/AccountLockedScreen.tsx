import {
  borderRadius,
  Button,
  Card,
  ScreenWrapper,
  spacing,
  type ThemeColors,
  Typography as Text,
  typography,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, View } from "react-native";

const SUPPORT_PHONE = "19001234";
const SUPPORT_EMAIL = "support@ptitgo.vn";

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.spaceLg,
      paddingVertical: spacing.spaceXl,
    },
    card: {
      padding: spacing.spaceLg,
      gap: spacing.spaceMd,
      alignItems: "center",
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.full,
      backgroundColor: colors.errorContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.screenTitle,
      color: colors.onSurface,
      textAlign: "center",
    },
    body: {
      ...typography.body,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    contactBox: {
      width: "100%",
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: borderRadius.default,
      padding: spacing.spaceMd,
      gap: spacing.spaceXs,
    },
    contactTitle: {
      ...typography.label,
      color: colors.onSurface,
    },
    contactLine: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    actions: {
      width: "100%",
      gap: spacing.spaceSm,
    },
  });

export default function DriverAccountLockedScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  const detail =
    typeof reason === "string" && reason.trim().length > 0
      ? reason.trim()
      : "Tài khoản tài xế của bạn đã bị khóa vĩnh viễn do vi phạm nghiêm trọng chính sách hoạt động. Bạn không thể đăng nhập hoặc tiếp tục nhận chuyến.";

  return (
    <ScreenWrapper style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <View style={styles.iconWrap} accessible={false}>
            <MaterialIcons
              name="lock-outline"
              size={32}
              color={colors.onErrorContainer}
            />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            Tài khoản tài xế đã bị khóa
          </Text>
          <Text accessibilityRole="alert" style={styles.body}>
            {detail}
          </Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>
              Liên hệ hỗ trợ đối soát & giải quyết công nợ
            </Text>
            <Text style={styles.contactLine}>
              Nếu tài khoản còn số dư ví hoặc cần khiếu nại, vui lòng liên hệ tổng đài hỗ trợ đối tác.
            </Text>
            <Text style={styles.contactLine}>Tổng đài: {SUPPORT_PHONE}</Text>
            <Text style={styles.contactLine}>Email: {SUPPORT_EMAIL}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="Gọi tổng đài hỗ trợ"
              onPress={() => void Linking.openURL(`tel:${SUPPORT_PHONE}`)}
            />
            <Button
              variant="secondary"
              label="Gửi email hỗ trợ"
              onPress={() =>
                void Linking.openURL(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Hỗ trợ tài khoản tài xế bị khóa")}`,
                )
              }
            />
            <Button
              variant="ghost"
              label="Về màn đăng nhập"
              onPress={() => router.replace("/(auth)/login" as never)}
            />
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
