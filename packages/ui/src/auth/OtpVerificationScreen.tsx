import { translate as i18nT } from "@datxe/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
} from "../components";
import type { ThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/ThemeProvider";
import { useLanguage } from "../useLanguage";

import {
  AuthApiError,
  authenticateWithBackend,
  confirmPhoneCode,
  normalizeVietnamPhoneNumber,
  sendPhoneCode,
  type AuthRole,
} from "@datxe/shared";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { spacing, typography } from "../theme/colors";
import { AuthBackButton } from "./AuthBackButton";
import { OtpCodeInput } from "./OtpCodeInput";
import { ResendOtpButton } from "./ResendOtpButton";

type Props = {
  role: AuthRole;
  phone: string;
  onLogin: () => void;
  onRegister: (phone: string) => void;
  onHome: () => void;
  onAccountLocked?: (message: string) => void;
  onHelp?: () => void;
};

export function OtpVerificationScreen({
  role,
  phone,
  onLogin,
  onRegister,
  onHome,
  onAccountLocked,
  onHelp,
}: Props) {
  useLanguage();

  const styles = useThemedStyles(base_styles);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [sendReady, setSendReady] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const sendInFlight = useRef(false);
  const autoSent = useRef(false);

  // Màn đăng nhập chỉ điều hướng sang đây. Màn này tự gửi mã Firebase ngay khi
  // mount để người dùng thấy ô nhập OTP đầu tiên, không phải bước xác minh trung gian.
  const sendCode = useCallback(async (): Promise<boolean> => {
    if (sendInFlight.current) return false;
    sendInFlight.current = true;
    setResending(true);
    setError("");
    setNotice("");
    setSendReady(false);
    setSendFailed(false);
    try {
      await withTimeout(sendPhoneCode(phone), RESEND_TIMEOUT_MS);
      setCode("");
      setSendReady(true);
      setNotice(i18nT("Đã gửi mã OTP. Vui lòng kiểm tra tin nhắn SMS."));
      return true;
    } catch (cause) {
      setSendFailed(true);
      setError(getErrorMessage(cause));
      return false;
    } finally {
      setResending(false);
      sendInFlight.current = false;
    }
  }, [phone]);

  useEffect(() => {
    if (!phone || autoSent.current) return;
    autoSent.current = true;
    void sendCode();
  }, [phone, sendCode]);

  const handleVerify = async () => {
    if (!sendReady) {
      setError(i18nT("Mã OTP đang được gửi. Vui lòng đợi vài giây."));
      return;
    }
    if (code.replace(/\D/g, "").length !== 6) {
      setError(i18nT("Vui lòng nhập đủ 6 chữ số OTP."));
      return;
    }
    setLoading(true);
    setError("");
    let navigated = false;
    try {
      const user = await confirmPhoneCode(code);
      try {
        const profile = await authenticateWithBackend(role, user);
        if (profile.role !== role.toUpperCase()) {
          throw new AuthApiError(
            i18nT("Tài khoản này không thuộc ứng dụng đang sử dụng."),
            "ROLE_MISMATCH",
          );
        }
        onHome();
        navigated = true;
      } catch (cause) {
        if (isAccountNotFound(cause)) {
          onRegister(normalizeVietnamPhoneNumber(phone));
          navigated = true;
          return;
        }
        if (cause instanceof AuthApiError && cause.code === "ACCOUNT_LOCKED" && onAccountLocked) {
          onAccountLocked(cause.message);
          navigated = true;
          return;
        }
        throw cause;
      }
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      // Giữ nguyên cây View khi màn OTP đang được thay thế. Đổi trạng thái
      // Button ngay sau router.replace có thể khiến Fabric reparent View
      // trong lúc native-stack vẫn đang chạy animation rời màn hình.
      if (!navigated) setLoading(false);
    }
  };

  if (!phone) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <AuthBackButton onPress={onLogin} />
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.content}>
          <Card style={{ gap: spacing.spaceMd }}>
            <Text accessibilityRole="header" style={styles.heading}>{i18nT("Thiếu số điện thoại")}</Text>
            <Text style={styles.description}>{i18nT("Không tìm thấy số điện thoại để xác thực OTP. Vui lòng quay lại màn đăng nhập.")}</Text>
            <Button label={i18nT("Về màn đăng nhập")} onPress={onLogin} />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <AuthBackButton onPress={onLogin} />
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text accessibilityRole="header" style={styles.heading}>
            {i18nT("Nhập mã OTP")}
          </Text>
          <Text style={styles.description}>
            {i18nT("Nhập mã gồm 6 chữ số được gửi đến số")}{" "}
            <Text style={styles.phone}>
              {normalizeVietnamPhoneNumber(phone)}
            </Text>{" "}
            {i18nT("thông qua SMS.")}
          </Text>

          <View style={styles.codeBlock}>
            <OtpCodeInput
              autoFocus
              disabled={loading || resending || !sendReady}
              onChange={(value) => {
                setCode(value);
                setError("");
              }}
              value={code}
            />
            <View style={styles.resend}>
              <ResendOtpButton
                key={sendFailed ? "retry" : "default"}
                delaySeconds={sendFailed ? 0 : 60}
                disabled={loading || resending}
                onResend={sendCode}
              />
            </View>
          </View>

          {resending ? (
            <Text accessibilityRole="alert" style={styles.noticeText}>
              {i18nT("Đang gửi mã OTP qua SMS...")}
            </Text>
          ) : error ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {i18nT(error)}
            </Text>
          ) : notice ? (
            <Text accessibilityRole="alert" style={styles.noticeText}>
              {i18nT(notice)}
            </Text>
          ) : null}
          {onHelp ? <Button variant="ghost" label={i18nT("Chưa nhận được mã?")} onPress={onHelp} /> : null}
          <Pressable accessibilityRole="button" disabled={loading} onPress={onLogin} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>{i18nT("Đổi số điện thoại")}</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            disabled={loading || resending || !sendReady || code.replace(/\D/g, "").length !== 6}
            label={i18nT("Xác nhận OTP")}
            loading={loading}
            loadingLabel={i18nT("Đang xác thực...")}
            onPress={() => void handleVerify()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const RESEND_TIMEOUT_MS = 20000;

/** Bọc lời gọi Firebase bằng timeout để nút gửi lại không bị treo vô hạn. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new AuthApiError(
            i18nT("Không gửi lại được mã OTP. Kiểm tra kết nối rồi thử lại."),
            "RESEND_TIMEOUT",
          ),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (cause) => {
        clearTimeout(timer);
        reject(cause);
      },
    );
  });
}

function isAccountNotFound(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === "ACCOUNT_NOT_FOUND";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("invalid-verification-code"))
    return i18nT("Mã OTP không đúng. Vui lòng thử lại.");
  if (code.includes("session-expired"))
    return i18nT("Mã OTP đã hết hạn. Hãy gửi lại mã mới.");
  if (code.includes("too-many-requests"))
    return i18nT("Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.");
  return error instanceof Error
    ? error.message
    : i18nT("Không thể xác thực lúc này. Vui lòng thử lại.");
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceXs,
      minHeight: spacing.headerHeight,
    },
    topBarSpacer: { width: spacing.iconButtonMd },
    content: {
      flexGrow: 1,
      width: "100%",
      maxWidth: spacing.formMaxWidth + spacing.margin * 2,
      alignSelf: "center",
      paddingHorizontal: spacing.margin,
      paddingTop: spacing.spaceSm,
    },
    heading: {
      ...typography.headlineXlMobile,
      color: colors.onSurface,
    },
    description: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
      marginTop: spacing.spaceSm,
    },
    phone: {
      ...typography.label,
      color: colors.onSurface,
    },
    codeBlock: {
      marginTop: spacing.spaceLg + spacing.spaceSm,
      gap: spacing.spaceMd,
    },
    resend: { paddingTop: 36 },
    errorText: {
      ...typography.bodyMd,
      color: colors.error,
      marginTop: spacing.spaceMd,
    },
    noticeText: {
      ...typography.bodyMd,
      color: colors.verified,
      marginTop: spacing.spaceMd,
    },
    footer: {
      paddingTop: spacing.spaceSm,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.margin,
      paddingBottom: spacing.spaceSm,
      gap: spacing.spaceXs,
    },
    secondaryAction: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryActionText: {
      ...typography.labelMd,
      color: colors.onSurfaceVariant,
    },
  });
