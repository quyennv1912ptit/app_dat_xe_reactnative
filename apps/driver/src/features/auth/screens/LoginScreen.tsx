import { Button,Card,Input,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
KeyboardAvoidingView,
Platform,
ScrollView,
Text,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialButton,styles } from '../components/LoginScreenParts';
import { useLogin } from '../hooks/useLogin';
export default function DriverLoginScreen() {
const { phone, setPhone, busy, error, setError, continueWithPhone, continueWithSocial } = useLogin();
return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandIcon}>
            <MaterialIcons color={colors.onPrimary} name="local-taxi" size={fontSize.icon3xl} />
          </View>
          <Text style={styles.brandName}>DriveMate Tài Xế</Text>
          <Text style={styles.title}>Chào mừng đối tác</Text>
          <Text style={styles.subtitle}>Đăng nhập để nhận chuyến và bắt đầu hành trình.</Text>

          <Card style={styles.formCard}>
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
                setError('');
              }}
              placeholder="0912 345 678"
              value={phone}
            />
            <Text style={styles.helperText}>Xác thực bằng mã OTP gửi qua SMS.</Text>
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
            <Button
              disabled={busy !== null && busy !== 'phone'}
              icon="arrow-forward"
              label="Tiếp tục bằng số điện thoại"
              loading={busy === 'phone'}
              loadingLabel="Đang gửi mã OTP..."
              onPress={continueWithPhone}
              style={styles.phoneButton}
              textStyle={styles.phoneButtonText}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Hoặc tiếp tục với</Text>
              <View style={styles.dividerLine} />
            </View>
            <SocialButton
              disabled={busy !== null}
              label="Tiếp tục với Google"
              loading={busy === 'google'}
              mark="G"
              onPress={() => void continueWithSocial('google')}
            />
            <SocialButton
              disabled={busy !== null}
              label="Tiếp tục với Facebook"
              loading={busy === 'facebook'}
              mark="f"
              onPress={() => void continueWithSocial('facebook')}
            />
          </Card>

          <View style={styles.footer}>
            <MaterialIcons color={colors.outline} name="verified-user" size={fontSize.iconSm} />
            <Text style={styles.footerText}>Bảo mật tài khoản bằng Firebase Authentication.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
