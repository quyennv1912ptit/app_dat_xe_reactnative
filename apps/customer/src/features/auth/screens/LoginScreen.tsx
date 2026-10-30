import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemedStyles , AuthHero,Button,Card,PhoneNumberInput } from '@datxe/ui';
import {
KeyboardAvoidingView,
Platform,
ScrollView,
Text,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialButton,facebookLogo,googleLogo,styles as base_styles } from '../components/LoginScreenParts';
import { useLogin } from '../hooks/useLogin';
export default function LoginScreen() {
 useLanguage();

 const styles=useThemedStyles(base_styles);

const { router, phone, setPhone, country, setCountry, busy, error, setError, continueWithPhone, continueWithSocial } = useLogin();
return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero
            brandLabel="DriveMate"
            icon="directions-car"
            subtitle={i18nT("Đặt chuyến an tâm, về nhà an toàn.")}
            title={i18nT("Đăng nhập")}
          />

          <Card style={styles.formCard}>
            <PhoneNumberInput
              country={country}
              disabled={busy !== null}
              label={i18nT("Số điện thoại")}
              onChangeText={(value) => {
                setPhone(value);
                setError('');
              }}
              onSelectCountry={(value) => {
                setCountry(value);
                setPhone((current) => current.slice(0, value.maxLength));
                setError('');
              }}
              value={phone}
            />
            <Text style={styles.helperText}>{i18nT("Chúng tôi sẽ gửi mã xác thực OTP qua SMS.")}</Text>
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{i18nT(error)}</Text> : null}
            <Button
              disabled={busy !== null && busy !== 'phone'}
              icon="arrow-forward"
              label={i18nT("Tiếp tục bằng số điện thoại")}
              loading={busy === 'phone'}
              loadingLabel={i18nT("Đang gửi mã OTP...")}
              onPress={continueWithPhone}
              style={styles.phoneButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>{i18nT("Hoặc tiếp tục với")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialButton
              disabled={busy !== null}
              icon={googleLogo}
              label={i18nT("Tiếp tục với Google")}
              loading={busy === 'google'}
              onPress={() => void continueWithSocial('google')}
            />
            <SocialButton
              disabled={busy !== null}
              icon={facebookLogo}
              label={i18nT("Tiếp tục với Facebook")}
              loading={busy === 'facebook'}
              onPress={() => void continueWithSocial('facebook')}
            />
          </Card>

          <Text style={styles.terms}>
            {i18nT("Tiếp tục nghĩa là bạn đồng ý với")}{' '}{i18nT(' ')}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/terms-of-service' as never)}
              style={styles.termsLink}
            >
              {i18nT("Điều khoản dịch vụ")}</Text>{i18nT(' ')}
            {i18nT("và")}{' '}{i18nT(' ')}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/privacy-policy' as never)}
              style={styles.termsLink}
            >
              {i18nT("Chính sách bảo mật")}</Text>{i18nT(' ')}
            {i18nT("của DriveMate.")}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
