import { toInternationalPhoneNumber } from '@datxe/shared';
import { AuthBackButton,AuthHero,Button,Card,OtpCodeInput,PhoneNumberInput,ResendOtpButton } from '@datxe/ui';
import {
KeyboardAvoidingView,
Platform,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/AddPhoneNumberScreenParts';
import { useAddPhoneNumber } from '../hooks/useAddPhoneNumber';
export default function AddPhoneNumberScreen() {
const { user, router, accountProvider, country, setCountry, phone, setPhone, otp, setOtp, otpStep, invalid, setInvalid, submitting, error, setError, notice, setNotice, onChangePhone, onSubmit, resendCode, switchAccount, changePhone } = useAddPhoneNumber();
if (!user) return null;
return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <AuthBackButton
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login' as never)}
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero
            detail={otpStep ? toInternationalPhoneNumber(phone, country) : undefined}
            icon={otpStep ? 'sms' : 'phone-android'}
            subtitle={otpStep
              ? 'Nhập mã xác thực 6 chữ số vừa được gửi qua SMS.'
              : 'Liên kết số điện thoại đã xác thực với tài khoản khách hàng của bạn.'}
            title={otpStep ? 'Xác thực số điện thoại' : 'Thêm số điện thoại'}
          />

          <View style={styles.connectedPill}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>Tài khoản {accountProvider} đã kết nối</Text>
          </View>

          <Card style={styles.formCard}>
            {!otpStep ? (
              <>
                <PhoneNumberInput
                  country={country}
                  disabled={submitting}
                  invalid={invalid}
                  label="Số điện thoại nhận OTP"
                  onChangeText={onChangePhone}
                  onSelectCountry={(value) => {
                    setCountry(value);
                    setPhone((current) => current.slice(0, value.maxLength));
                    setInvalid(false);
                    setError('');
                    setNotice('');
                  }}
                  value={phone}
                />
                <Text style={styles.helperText}>Chúng tôi sẽ gửi mã xác thực qua SMS.</Text>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Mã OTP gồm 6 chữ số</Text>
                <OtpCodeInput
                  autoFocus
                  disabled={submitting}
                  onChange={(value) => {
                    setOtp(value);
                    setError('');
                    setNotice('');
                  }}
                  value={otp}
                />
                <Text style={styles.helperText}>Bạn có thể dán mã OTP hoặc chọn mã được gợi ý từ SMS.</Text>
              </>
            )}

            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

            <Button
              disabled={submitting}
              icon="arrow-forward"
              label={otpStep ? 'Xác nhận và liên kết số' : 'Gửi mã OTP'}
              loading={submitting}
              loadingLabel={otpStep ? 'Đang xác thực...' : 'Đang gửi mã...'}
              onPress={() => void onSubmit()}
              style={styles.submitButton}
            />

            {otpStep ? (
              <>
                <ResendOtpButton disabled={submitting} onResend={resendCode} />
                <Pressable accessibilityRole="button" disabled={submitting} onPress={changePhone} style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Đổi số điện thoại</Text>
                </Pressable>
              </>
            ) : null}
          </Card>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => void switchAccount()}
            style={styles.switchAccount}
          >
            <Text style={styles.switchAccountText}>Đăng nhập bằng tài khoản khác</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
