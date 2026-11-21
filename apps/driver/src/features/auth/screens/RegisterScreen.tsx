import { AUTH_FULL_NAME_MAX_LENGTH } from "@datxe/shared";
import {
  AuthBackButton,
  Button,
  Input,
  OtpCodeInput,
  ResendOtpButton,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";

import { styles } from "../components/RegisterScreenParts";
import { useRegister } from "../hooks/useRegister";

export default function DriverRegisterScreen() {
  const colors = useThemeColors();
  const themed_styles = useThemedStyles(styles);

  const {
    user,
    router,
    initialName,
    setFullName,
    initialPhone,
    setPhone,
    code,
    setCode,
    codeSent,
    resetCode,
    verifiedPhone,
    loading,
    error,
    setError,
    sendCode,
    verifyCode,
    submit,
  } = useRegister();

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login" as never);
  };

  if (!user) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={themed_styles.safeArea}>
        <View style={themed_styles.topBar}>
          <AuthBackButton onPress={leave} />
          <Text accessibilityRole="header" style={themed_styles.title}>Đăng ký tài xế</Text>
        </View>
        <View style={themed_styles.content}>
          <Text style={themed_styles.intro}>
            Không tìm thấy phiên đăng nhập hiện tại. Vui lòng đăng nhập lại để tiếp tục tạo hồ sơ tài xế.
          </Text>
          <Button label="Về màn đăng nhập" onPress={() => router.replace("/(auth)/login")} />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["top", "bottom"]} style={themed_styles.safeArea}>
      <View style={themed_styles.topBar}>
        <AuthBackButton onPress={leave} />
        <Text accessibilityRole="header" style={themed_styles.title}>Đăng ký tài xế</Text>
      </View>
      <KeyboardAvoidingView behavior="padding" style={themed_styles.flex}>
        <ScrollView
          contentContainerStyle={themed_styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            editable={!loading}
            autoCapitalize="words"
            autoComplete="name"
            icon="person"
            label="Họ và tên theo giấy tờ"
            maxLength={AUTH_FULL_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setFullName(value);
              setError("");
            }}
            placeholder="Nguyễn Văn An"
            defaultValue={initialName}
            style={themed_styles.inputSurface}
          />

          {verifiedPhone ? (
            <View style={themed_styles.verifiedRow}>
              <MaterialIcons
                color={colors.primary}
                name="verified"
                size={20}
                importantForAccessibility="no"
              />
              <Text style={themed_styles.verifiedText}>
                Số điện thoại đã xác minh: {verifiedPhone}
              </Text>
            </View>
          ) : (
            <>
              <Input
                autoComplete="tel"
                editable={!codeSent && !loading}
                icon="call"
                keyboardType="phone-pad"
                label="Số điện thoại"
                onChangeText={(value) => {
                  setPhone(value);
                  setError("");
                }}
                placeholder="Nhập số điện thoại của bạn"
                defaultValue={initialPhone}
                style={themed_styles.inputSurface}
              />
              {codeSent ? (
                <>
                  <Text style={themed_styles.note}>Nhập mã 6 chữ số trong tin nhắn SMS.</Text>
                  <OtpCodeInput value={code} disabled={loading} onChange={setCode} />
                  <ResendOtpButton disabled={loading} onResend={sendCode} />
                  <Button variant="ghost" disabled={loading} label="Đổi số điện thoại" onPress={resetCode} />
                </>
              ) : null}
              <Button
                label={codeSent ? "Xác minh số điện thoại" : "Gửi mã OTP"}
                loading={loading}
                disabled={codeSent && code.length !== 6}
                loadingLabel="Đang xác minh..."
                onPress={codeSent ? verifyCode : sendCode}
                variant="secondary"
              />
            </>
          )}

          {error ? (
            <Text accessibilityRole="alert" style={themed_styles.errorText}>
              {error}
            </Text>
          ) : null}
          <Button
            disabled={!verifiedPhone}
            label="Tạo tài khoản và tiếp tục"
            loading={loading && Boolean(verifiedPhone)}
            loadingLabel="Đang tạo tài khoản..."
            onPress={submit}
            style={themed_styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
