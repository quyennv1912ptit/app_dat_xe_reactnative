import { translate as t } from "@datxe/shared";
import {
  borderRadius,
  Button,
  Card,
  ScreenWrapper,
  spacing,
  type ThemeColors,
  Typography as Text,
  typography,
  useLanguage,
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

export default function AccountLockedScreen() {
  useLanguage();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  const detail =
    typeof reason === "string" && reason.trim().length > 0
      ? reason.trim()
      : t(
          "Tài khoản của bạn đã bị khóa do vi phạm chính sách sử dụng. Bạn không thể đăng nhập hoặc thực hiện giao dịch trên ứng dụng.",
        );

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
            {t("Tài khoản đã bị khóa")}
          </Text>
          <Text accessibilityRole="alert" style={styles.body}>
            {detail}
          </Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>
              {t("Liên hệ CSKH để khiếu nại")}
            </Text>
            <Text style={styles.contactLine}>
              {t("Tổng đài")}: {SUPPORT_PHONE}
            </Text>
            <Text style={styles.contactLine}>Email: {SUPPORT_EMAIL}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              icon="support-agent"
              label={t("Gọi tổng đài CSKH")}
              onPress={() => void Linking.openURL(`tel:${SUPPORT_PHONE}`)}
            />
            <Button
              variant="secondary"
              icon="email"
              label={t("Gửi email khiếu nại")}
              onPress={() =>
                void Linking.openURL(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Khiếu nại khóa tài khoản PtitGo")}`,
                )
              }
            />
            <Button
              variant="ghost"
              label={t("Về màn đăng nhập")}
              onPress={() => router.replace("/(auth)/login" as never)}
            />
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
