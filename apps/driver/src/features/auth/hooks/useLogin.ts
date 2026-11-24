import { AuthApiError,AuthCancelledError,authenticateWithBackend,isValidVietnamPhoneNumber,normalizeVietnamPhoneNumber,signInWithFacebook,signInWithGoogle,signOutFirebase } from '@datxe/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { SignInMethod,getErrorMessage,isAccountNotFound } from '../components/LoginScreenParts';
export function useLogin() {
const router = useRouter();
// Keep the latest phone for validation without controlling the input.
const phoneDraft = useRef('');
const phoneSubmitting = useRef(false);
useFocusEffect(useCallback(() => { phoneSubmitting.current = false; }, []));
const setPhone = (text: string) => { phoneDraft.current = text; };
const [busy, setBusy] = useState<SignInMethod>(null);
const [error, setError] = useState('');
const continueWithPhone = async () => {
    const phone = phoneDraft.current;
    if (!isValidVietnamPhoneNumber(phone)) {
      setError('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return;
    }
    if (phoneSubmitting.current) return;
    setError('');
    const normalizedPhone = normalizeVietnamPhoneNumber(phone);
    // Chuyển thẳng vào màn nhập OTP; màn này tự gửi mã Firebase nên người dùng
    // không bị dừng ở bước xác minh/trang reCAPTCHA trung gian.
    phoneSubmitting.current = true;
    try {
      router.push({ pathname: '/(auth)/otp-verify', params: { phone: normalizedPhone } } as never);
    } catch (cause) {
      phoneSubmitting.current = false;
      setError(getErrorMessage(cause));
    }
  };
const continueWithSocial = async (method: Exclude<SignInMethod, 'phone' | null>) => {
    setBusy(method);
    setError('');
    try {
      const user = method === 'google' ? await signInWithGoogle() : await signInWithFacebook();
      try {
        const profile = await authenticateWithBackend('driver', user);
        if (profile.role !== 'DRIVER') {
          throw new AuthApiError('Tài khoản này không phải tài khoản tài xế.', 'ROLE_MISMATCH');
        }
        router.replace('/(tabs)/home' as never);
      } catch (cause) {
        if (cause instanceof AuthApiError && cause.code === 'ACCOUNT_LOCKED') {
          void signOutFirebase().catch(() => undefined);
          router.replace({
            pathname: '/(auth)/account-locked',
            params: { reason: cause.message },
          } as never);
          return;
        }
        if (isAccountNotFound(cause)) {
          router.replace('/(auth)/register' as never);
          return;
        }
        throw cause;
      }
    } catch (cause) {
      if (!(cause instanceof AuthCancelledError)) setError(getErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  };
return { setPhone, busy, error, setError, continueWithPhone, continueWithSocial };
}
