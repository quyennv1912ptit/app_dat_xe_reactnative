import { translate as i18nT , AuthApiError,AuthCancelledError,DEFAULT_PHONE_COUNTRY,authenticateWithBackend,isValidInternationalPhoneNumber,signInWithFacebook,signInWithGoogle,toInternationalPhoneNumber } from '@datxe/shared';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { SignInMethod,getErrorMessage,isAccountNotFound } from '../components/LoginScreenParts';
export function useLogin() {
const router = useRouter();
// Keep the latest phone for validation without controlling the input.
const phoneDraft = useRef('');
const phoneSubmitting = useRef(false);
const setPhone = (text: string) => { phoneDraft.current = text; };
const [country, setCountry] = useState(DEFAULT_PHONE_COUNTRY);
const [busy, setBusy] = useState<SignInMethod>(null);
const [error, setError] = useState('');
const continueWithPhone = async () => {
    const phone = phoneDraft.current;
    if (!isValidInternationalPhoneNumber(phone, country)) {
      setError(i18nT("Vui lòng nhập số điện thoại {0} hợp lệ.", {"0": country.name}));
      return;
    }
    if (phoneSubmitting.current) return;
    setError('');
    const internationalPhone = toInternationalPhoneNumber(phone, country);
    // Chuyển thẳng vào màn nhập OTP; màn này tự gửi mã Firebase nên người dùng
    // không bị dừng ở bước xác minh/trang reCAPTCHA trung gian.
    phoneSubmitting.current = true;
    router.push({ pathname: '/(auth)/otp-verify', params: { phone: internationalPhone } } as never);
  };
const continueWithSocial = async (method: Exclude<SignInMethod, 'phone' | null>) => {
    setBusy(method);
    setError('');
    try {
      const user = method === 'google' ? await signInWithGoogle() : await signInWithFacebook();
      if (!user.phoneNumber) {
        router.replace('/(auth)/add-phone-number' as never);
        return;
      }
      try {
        const profile = await authenticateWithBackend('customer', user);
        if (profile.role !== 'CUSTOMER') {
          throw new AuthApiError(i18nT("Tài khoản này không phải tài khoản khách hàng."), 'ROLE_MISMATCH');
        }
        if (!profile.phoneNumber) {
          router.replace('/(auth)/add-phone-number' as never);
          return;
        }
        router.replace('/(tabs)/home' as never);
      } catch (cause) {
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
return { router, setPhone, country, setCountry, busy, error, setError, continueWithPhone, continueWithSocial };
}
