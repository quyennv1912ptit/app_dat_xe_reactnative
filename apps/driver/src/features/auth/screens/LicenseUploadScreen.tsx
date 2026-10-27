import { Button,Card,Input,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { CAPABILITIES,DateField,LICENSE_TIERS,UploadCard,styles } from '../components/LicenseUploadScreenParts';
import { useLicenseUpload } from '../hooks/useLicenseUpload';
export default function LicenseUploadScreen() {
const { router, insets, frontImage, backImage, licenseNumber, tier, setTier, issueDate, setIssueDate, expiryDate, setExpiryDate, busySide, notice, setNotice, chooseImage, updateLicenseNumber, submitForReview } = useLicenseUpload();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              color={colors.onPrimary}
              name="arrow-back"
              size={fontSize.icon2xl}
            />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>
            Cài Đặt Tài Xế
          </Text>
          <View style={styles.profileIcon}>
            <MaterialIcons
              color={colors.onPrimary}
              name="person-outline"
              size={fontSize.iconMd}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.contextCard} variant="muted">
          <View style={styles.contextContent}>
            <View style={styles.contextIcon}>
              <MaterialIcons
                color={colors.primary}
                name="verified-user"
                size={fontSize.iconXl}
              />
            </View>
            <View style={styles.contextCopy}>
              <Text style={styles.contextTitle}>Xác thực hồ sơ tài xế</Text>
              <Text style={styles.contextDescription}>
                Cung cấp GPLX từ B2 trở lên để xác thực tay lái và loại xe nhận
                lái (Số sàn &amp; Số tự động).
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.form}>
          <View style={styles.uploadSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                Hình ảnh giấy phép <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.ocrLabel}>
                <MaterialIcons
                  color={colors.primary}
                  name="auto-awesome"
                  size={fontSize.iconSm}
                />
                <Text style={styles.ocrText}>OCR Tự động điền</Text>
              </View>
            </View>

            <View style={styles.uploadRow}>
              <UploadCard
                busy={busySide === 'front'}
                imageUri={frontImage}
                onPress={() => chooseImage('front')}
                side="front"
              />
              <UploadCard
                busy={busySide === 'back'}
                imageUri={backImage}
                onPress={() => chooseImage('back')}
                side="back"
              />
            </View>

            <View style={styles.guidance}>
              <MaterialIcons
                color={colors.success}
                name="info-outline"
                size={fontSize.iconMd}
              />
              <Text style={styles.guidanceText}>
                Yêu cầu ảnh chụp rõ nét, không lóa sáng, không cắt 4 góc.
              </Text>
            </View>
          </View>

          <View style={styles.fieldSection}>
            <Input
              accessibilityLabel="Số giấy phép lái xe, 12 chữ số"
              autoCapitalize="none"
              keyboardType="number-pad"
              label="Số Giấy phép lái xe (12 số)"
              labelAccessory={<Text style={styles.requiredText}>Bắt buộc</Text>}
              maxLength={14}
              onChangeText={updateLicenseNumber}
              placeholder="0101 9801 2345"
              style={styles.licenseInput}
              inputStyle={styles.licenseNumberText}
              value={licenseNumber}
            />
            {licenseNumber.replace(/\D/g, '').length === 12 ? (
              <View pointerEvents="none" style={styles.licenseStatus}>
                <MaterialIcons
                  color={colors.success}
                  name="check-circle"
                  size={fontSize.iconXl}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.fieldSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Hạng giấy phép lái xe</Text>
              <Text style={styles.secondaryLabel}>Nhận khách lái ô tô</Text>
            </View>
            <View accessibilityRole="radiogroup" style={styles.tierRow}>
              {LICENSE_TIERS.map((item) => {
                const selected = tier === item.value;

                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setTier(item.value)}
                    style={[
                      styles.tierOption,
                      selected ? styles.tierOptionSelected : styles.tierOptionIdle,
                    ]}
                  >
                    {item.popular ? (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Phổ biến</Text>
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.tierName,
                        selected && styles.tierNameSelected,
                      ]}
                    >
                      {item.value}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.tierDescription,
                        selected && styles.tierDescriptionSelected,
                      ]}
                    >
                      {item.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.dateRow}>
            <DateField
              icon="calendar-today"
              label="Ngày cấp"
              onChangeText={(value) => {
                setIssueDate(value);
                setNotice('');
              }}
              value={issueDate}
            />
            <DateField
              icon="event-repeat"
              label="Ngày hết hạn"
              onChangeText={(value) => {
                setExpiryDate(value);
                setNotice('');
              }}
              value={expiryDate}
            />
          </View>

          <Card style={styles.capabilitiesCard} variant="surface">
            <Text style={styles.capabilitiesTitle}>
              Phương tiện được cấp phép điều khiển
            </Text>
            <View style={styles.capabilitiesList}>
              {CAPABILITIES.map((capability) => (
                <View key={capability} style={styles.capabilityChip}>
                  <MaterialIcons
                    color={colors.onSecondaryFixed}
                    name="check"
                    size={fontSize.iconSm}
                  />
                  <Text style={styles.capabilityText}>{capability}</Text>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.submitSection}>
            {notice ? (
              <View
                accessibilityRole="alert"
                style={styles.notice}
              >
                <MaterialIcons
                  color={colors.primary}
                  name="info-outline"
                  size={fontSize.iconMd}
                />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}
            <Button
              icon="send"
              iconPosition="leading"
              iconSize={fontSize.iconXl}
              label="Gửi duyệt GPLX"
              onPress={submitForReview}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
            <View style={styles.privacyNote}>
              <MaterialIcons
                color={colors.success}
                name="lock-outline"
                size={fontSize.iconSm}
              />
              <Text style={styles.privacyText}>
                Hồ sơ được bảo mật và đối soát trực tiếp cùng CSGT/Bộ GTVT
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
    </View>
  );
}
