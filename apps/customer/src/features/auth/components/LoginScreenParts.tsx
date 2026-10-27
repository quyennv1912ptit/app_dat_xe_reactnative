import { AuthApiError } from '@datxe/shared';
import { borderRadius,colors,spacing,typography } from '@datxe/ui';
import {
Image,
Pressable,
StyleSheet,
Text
} from 'react-native';
export const googleLogo = require('@/assets/1._ng_nh_p/google.png');

export const facebookLogo = require('@/assets/1._ng_nh_p/facebook.png');

export type SignInMethod = 'phone' | 'google' | 'facebook' | null;

export function SocialButton({
  disabled,
  icon,
  label,
  loading,
  onPress,
}: {
  disabled: boolean;
  icon: number;
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.socialButton, disabled && styles.disabledButton]}
    >
      <Image source={icon} style={styles.socialIcon} />
      <Text style={styles.socialLabel}>{loading ? 'Đang kết nối...' : label}</Text>
    </Pressable>
  );
}

export function isAccountNotFound(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === 'ACCOUNT_NOT_FOUND';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) return error.message;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('too-many-requests')) return 'Bạn đã yêu cầu OTP quá nhiều lần. Hãy thử lại sau.';
  if (code.includes('invalid-phone-number')) return 'Số điện thoại không hợp lệ.';
  if (code.includes('account-exists-with-different-credential')) return 'Email này đã được dùng với phương thức đăng nhập khác.';
  return error instanceof Error ? error.message : 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.margin, paddingVertical: spacing.spaceXl },
  formCard: { width: '100%', maxWidth: spacing.formMaxWidth, gap: spacing.spaceMd, padding: spacing.spaceMd },
  helperText: { ...typography.labelSm, color: colors.onSurfaceVariant, marginTop: -spacing.spaceSm },
  errorText: { ...typography.bodyMd, color: colors.error },
  phoneButton: { marginTop: spacing.spaceXs },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, marginVertical: spacing.spaceXs },
  dividerLine: { height: 1, flex: 1, backgroundColor: colors.outlineVariant },
  dividerLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  socialButton: { minHeight: 52, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: borderRadius.xl, backgroundColor: colors.surfaceContainerLowest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceSm, paddingHorizontal: spacing.spaceMd },
  disabledButton: { opacity: 0.6 },
  socialIcon: { width: 20, height: 20, resizeMode: 'contain' },
  socialLabel: { ...typography.labelMd, color: colors.onSurface },
  terms: { ...typography.labelSm, color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: spacing.formMaxWidth, marginTop: spacing.spaceLg, paddingHorizontal: spacing.spaceSm },
  termsLink: { color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' },
});
