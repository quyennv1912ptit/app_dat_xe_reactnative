import { AUTH_FULL_NAME_MAX_LENGTH } from '@datxe/shared';
import { AuthBackButton,AuthHero,Button,Card,Input,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatIsoDateInput,genderOptions,styles } from '../components/RegisterScreenParts';
import { useRegister } from '../hooks/useRegister';
export default function RegisterScreen() {
const { user, router, phoneParam, fullName, setFullName, email, setEmail, dateOfBirth, setDateOfBirth, gender, setGender, loading, error, setError, submit } = useRegister();
if (!user) return null;
return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.topBar}>
        <AuthBackButton onPress={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
        <AuthHero
          icon="person-add-alt-1"
          subtitle="Hoàn tất thông tin để bắt đầu sử dụng DriveMate."
          title="Tạo tài khoản khách hàng"
        />

        <Card style={styles.card}>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            icon="person"
            label="Họ và tên"
            maxLength={AUTH_FULL_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setFullName(value);
              setError('');
            }}
            placeholder="Nguyễn Văn An"
            value={fullName}
          />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            icon="mail"
            keyboardType="email-address"
            label="Email (không bắt buộc)"
            maxLength={255}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="ten@email.com"
            value={email}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ngày sinh (không bắt buộc)</Text>
            <TextInput
              accessibilityLabel="Ngày sinh theo định dạng năm-tháng-ngày"
              value={dateOfBirth}
              onChangeText={(value) => {
                setDateOfBirth(formatIsoDateInput(value));
                setError('');
              }}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              keyboardType="number-pad"
              autoComplete="birthdate-full"
              style={styles.textInput}
            />
            <Text style={styles.fieldHint}>Ví dụ: 1995-08-24</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Giới tính (không bắt buộc)</Text>
            <View style={styles.genderOptions}>
              {genderOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: gender === option.value }}
                  onPress={() => setGender(gender === option.value ? '' : option.value)}
                  style={[styles.genderOption, gender === option.value && styles.genderOptionSelected]}
                >
                  <Text style={[styles.genderOptionText, gender === option.value && styles.genderOptionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons color={colors.primary} name="verified-user" size={fontSize.iconMd} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Phương thức đăng nhập</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user.phoneNumber ?? (phoneParam ? String(phoneParam) : user.email) ?? 'Tài khoản đã xác thực'}
              </Text>
            </View>
          </View>
          {phoneParam && !user.phoneNumber ? (
            <Text style={styles.helperText}>Số {phoneParam} đã được xác minh.</Text>
          ) : null}
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          <Button
            icon="arrow-forward"
            label="Tạo tài khoản"
            loading={loading}
            loadingLabel="Đang tạo tài khoản..."
            onPress={submit}
            style={styles.submitButton}
          />
          <Text style={styles.legalNotice}>
            Khi tạo tài khoản, bạn đồng ý với{' '}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/terms-of-service' as never)}
              style={styles.legalLink}
            >
              Điều khoản dịch vụ
            </Text>{' '}
            và{' '}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/privacy-policy' as never)}
              style={styles.legalLink}
            >
              Chính sách bảo mật
            </Text>
            .
          </Text>
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
