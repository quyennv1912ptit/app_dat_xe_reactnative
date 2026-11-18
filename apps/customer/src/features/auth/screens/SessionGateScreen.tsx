import { translate as t } from "@datxe/shared";
import { ActivityIndicator } from "react-native-paper";
import { Button, Card, ScreenWrapper, Typography as Text, useLanguage, useThemeColors, useThemedStyles } from "@datxe/ui";
import { Redirect, useRouter } from "expo-router";
import { Image, View } from "react-native";
import { styles as base_styles } from "../components/SessionGateScreenParts";
import { useSessionGate } from "../hooks/useSessionGate";

/** Customer artwork supplied with the new PtitGo identity. */
const brandLogo = require("../../../../assets/images/brand-logo.png");

export default function Index() {
  useLanguage();

  const colors = useThemeColors();
  const styles = useThemedStyles(base_styles);
  const router = useRouter();

  const { destination, error, shouldSuggestLogin, waiting, retry } = useSessionGate();
  if (destination) return <Redirect href={destination as never} />;
  return (
    <ScreenWrapper style={styles.screen}>
      <View style={styles.glow} />
      <Card style={styles.card}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="PtitGo"
          resizeMode="contain"
          source={brandLogo}
          style={styles.logo}
        />
        {!error ? <ActivityIndicator accessibilityLabel={t("Đang khôi phục phiên")} color={colors.primary} size="small" /> : null}
        <Text
          accessibilityRole={error ? "alert" : undefined}
          accessibilityLiveRegion="polite"
          style={styles.tagline}
        >
          {t(
            error ||
              (waiting
                ? "Đang kết nối. Việc khôi phục phiên mất nhiều thời gian hơn dự kiến."
                : "Khôi phục phiên đăng nhập"),
          )}
        </Text>
        {error ? <Button label={t("Thử lại")} onPress={retry} style={styles.actionButton} /> : null}
        {waiting || error ? (
          <Button
            variant={shouldSuggestLogin ? "secondary" : "ghost"}
            label={t(shouldSuggestLogin ? "Đăng nhập lại" : "Về màn đăng nhập")}
            onPress={() => router.replace("/(auth)/login")}
            style={styles.actionButton}
          />
        ) : null}
      </Card>
    </ScreenWrapper>
  );
}
