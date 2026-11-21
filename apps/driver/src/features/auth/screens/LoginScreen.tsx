import {
  Button,
  Input,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useThemedStyles,
} from "@datxe/ui";
import { useRouter } from "expo-router";
import { Image, KeyboardAvoidingView, ScrollView, View } from "react-native";

import {
  SocialButton,
  facebookLogo,
  googleLogo,
  styles,
} from "../components/LoginScreenParts";
import { useLogin } from "../hooks/useLogin";

export default function DriverLoginScreen() {
  const router = useRouter();
  const themed_styles = useThemedStyles(styles);

  const {
    setPhone,
    busy,
    error,
    setError,
    continueWithPhone,
    continueWithSocial,
  } = useLogin();
  return (
    <SafeAreaView edges={["top", "bottom"]} style={themed_styles.safeArea}>
      <KeyboardAvoidingView
        behavior="padding"
        style={themed_styles.flex}
      >
        <ScrollView
          contentContainerStyle={themed_styles.scrollContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require("../../../../assets/images/brand-logo.png")}
            accessibilityLabel="PtitGo Tài Xế" accessibilityIgnoresInvertColors
            resizeMode="contain" style={themed_styles.brandLogo} />
          <Text accessibilityRole="header" style={themed_styles.heading}>
            Đồng hành cùng PtitGo Tài Xế
          </Text>
          <Text style={themed_styles.subtitle}>
            Đăng nhập để nhận chuyến và bắt đầu hành trình.
          </Text>

          <View style={themed_styles.form}>
            <Input
              accessibilityLabel="Số điện thoại"
              autoComplete="tel"
              editable={busy === null}
              icon="call"
              keyboardType="phone-pad"
              label="Số điện thoại"
              maxLength={16}
              onChangeText={(value) => {
                setPhone(value);
                setError("");
              }}
              placeholder="Nhập số điện thoại của bạn"
            />
            <Text style={themed_styles.helperText}>
              Xác thực bằng mã OTP gửi qua SMS.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={themed_styles.errorText}>
                {error}
              </Text>
            ) : null}
            <Button
              disabled={busy !== null && busy !== "phone"}
              label="Tiếp tục"
              loading={busy === "phone"}
              loadingLabel="Đang gửi mã OTP..."
              onPress={continueWithPhone}
              style={themed_styles.submitButton}
            />
          </View>

          <View style={themed_styles.divider}>
            <View style={themed_styles.dividerLine} />
            <Text style={themed_styles.dividerLabel}>HOẶC</Text>
            <View style={themed_styles.dividerLine} />
          </View>

          <View style={themed_styles.form}>
            <SocialButton
              disabled={busy !== null}
              icon={googleLogo}
              label="Đăng nhập bằng Google"
              loading={busy === "google"}
              onPress={() => void continueWithSocial("google")}
            />
            <SocialButton
              disabled={busy !== null}
              icon={facebookLogo}
              label="Đăng nhập bằng Facebook"
              loading={busy === "facebook"}
              onPress={() => void continueWithSocial("facebook")}
            />
          </View>

          <View style={themed_styles.footer}>
            <Text style={themed_styles.terms}>
              Bằng việc tiếp tục, bạn đồng ý với quy định sử dụng và chính sách quyền riêng tư của PtitGo.
            </Text>
            <View style={themed_styles.termsActions}>
              <Pressable
                accessibilityRole="link"
                style={themed_styles.termsTarget}
                onPress={() => router.push("/(auth)/login-help")}
              >
                <Text style={themed_styles.termsLink}>Trợ giúp đăng nhập</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                style={themed_styles.termsTarget}
                onPress={() => router.push("/settings/privacy")}
              >
                <Text style={themed_styles.termsLink}>Quyền riêng tư</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
