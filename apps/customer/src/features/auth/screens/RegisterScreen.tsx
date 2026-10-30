import { translate as i18nT , AUTH_FULL_NAME_MAX_LENGTH } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles , AuthBackButton,AuthHero,Button,Card,Input,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatIsoDateInput,genderOptions,styles as base_styles } from '../components/RegisterScreenParts';
import { useRegister } from '../hooks/useRegister';
export default function RegisterScreen() {
 useLanguage();

 const colors=useThemeColors();

 const styles=useThemedStyles(base_styles);

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
          subtitle={i18nT("Hoàn tất thông tin để bắt đầu sử dụng DriveMate.")}
          title={i18nT("Tạo tài khoản khách hàng")}
        />

        <Card style={styles.card}>
          <Input
            autoCapitalize="words"
            autoComplete="name"
            icon="person"
            label={i18nT("Họ và tên")}
            maxLength={AUTH_FULL_NAME_MAX_LENGTH}
            onChangeText={(value) => {
              setFullName(value);
              setError('');
            }}
            placeholder={i18nT("Nguyễn Văn An")}
            value={fullName}
          />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            icon="mail"
            keyboardType="email-address"
            label={i18nT("Email (không bắt buộc)")}
            maxLength={255}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="ten@email.com"
            value={email}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{i18nT("Ngày sinh (không bắt buộc)")}</Text>
            <TextInput
              accessibilityLabel={i18nT("Ngày sinh theo định dạng năm-tháng-ngày")}
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
            <Text style={styles.fieldHint}>{i18nT("Ví dụ: 1995-08-24")}</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{i18nT("Giới tính (không bắt buộc)")}</Text>
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
                    {i18nT(option.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons color={colors.primary} name="verified-user" size={fontSize.iconMd} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>{i18nT("Phương thức đăng nhập")}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {i18nT(user.phoneNumber ?? (phoneParam ? String(phoneParam) : user.email) ?? 'Tài khoản đã xác thực')}
              </Text>
            </View>
          </View>
          {phoneParam && !user.phoneNumber ? (
            <Text style={styles.helperText}>{i18nT("Số")}{' '}{i18nT(phoneParam)} {i18nT("đã được xác minh.")}</Text>
          ) : null}
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{i18nT(error)}</Text> : null}
          <Button
            icon="arrow-forward"
            label={i18nT("Tạo tài khoản")}
            loading={loading}
            loadingLabel={i18nT("Đang tạo tài khoản...")}
            onPress={submit}
            style={styles.submitButton}
          />
          <Text style={styles.legalNotice}>
            {i18nT("Khi tạo tài khoản, bạn đồng ý với")}{' '}{i18nT(' ')}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/terms-of-service' as never)}
              style={styles.legalLink}
            >
              {i18nT("Điều khoản dịch vụ")}</Text>{i18nT(' ')}
            {i18nT("và")}{' '}{i18nT(' ')}
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/privacy-policy' as never)}
              style={styles.legalLink}
            >
              {i18nT("Chính sách bảo mật")}</Text>
            .
          </Text>
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
