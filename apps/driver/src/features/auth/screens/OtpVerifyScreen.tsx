import { signOutFirebase } from "@datxe/shared";
import { Button, Card, OtpVerificationScreen, ScreenWrapper, spacing, typography, Typography as Text } from "@datxe/ui";
import { StyleSheet, View } from "react-native";
import { useOtpVerify } from "../hooks/useOtpVerify";

export default function DriverOtpVerifyScreen() {
  const { phone, router } = useOtpVerify();
  if (!phone) {
    return (
      <ScreenWrapper>
        <View style={styles.fallback}>
          <Card style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>Thiếu số điện thoại xác thực</Text>
            <Text>Phiên nhập OTP đã hết hạn hoặc thiếu số điện thoại. Vui lòng quay lại màn đăng nhập để gửi lại mã.</Text>
            <Button label="Về màn đăng nhập" onPress={() => router.replace("/(auth)/login" as never)} />
          </Card>
        </View>
      </ScreenWrapper>
    );
  }
  return (
    <OtpVerificationScreen
      phone={phone}
      onHelp={() => router.push("/(auth)/login-help")}
      onHome={() => router.replace("/(tabs)/home" as never)}
      onLogin={() => router.replace("/(auth)/login" as never)}
      onAccountLocked={(reason) => {
        void signOutFirebase().catch(() => undefined);
        router.replace({
          pathname: "/(auth)/account-locked",
          params: { reason },
        } as never);
      }}
      onRegister={(verifiedPhone) =>
        router.replace({
          pathname: "/(auth)/register",
          params: { phone: verifiedPhone },
        } as never)
      }
      role="driver"
    />
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, justifyContent: "center", padding: spacing.margin },
  card: { gap: spacing.spaceMd },
  title: { ...typography.sectionTitle },
});
