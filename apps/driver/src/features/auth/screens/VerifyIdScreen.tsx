import { Button,Card,Input,colors,fontSize } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Image,
Pressable,
ScrollView,
Text,
View
} from 'react-native';
import { DocumentCard,styles } from '../components/VerifyIdScreenParts';
import { useVerifyId } from '../hooks/useVerifyId';
export default function VerifyIdScreen() {
const { router, insets, fullName, setFullName, citizenId, setCitizenId, photos, busyTarget, selfieMatched, notice, setNotice, choosePhoto, submitVerification } = useVerifyId();
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
        <Card style={styles.progressCard} variant="surface">
          <View style={styles.progressHeading}>
            <View style={styles.progressLabelGroup}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepLabel}>Bước 2/3: Định danh cá nhân</Text>
            </View>
            <Text style={styles.processingBadge}>Đang xử lý</Text>
          </View>
          <View
            accessibilityLabel="Tiến trình hồ sơ: bước 2 trên 3"
            accessibilityRole="progressbar"
            style={styles.progressTrack}
          >
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressDescription}>
            Hồ sơ tài xế chuyên nghiệp • Cần hình ảnh rõ nét, không lóa sáng
          </Text>
        </Card>

        <Card style={styles.identityCard} variant="surface">
          <View style={styles.cardHeading}>
            <MaterialIcons
              color={colors.primary}
              name="badge"
              size={fontSize.iconXl}
            />
            <Text style={styles.cardTitle}>Thông tin trên thẻ</Text>
          </View>

          <Input
            accessibilityLabel="Họ và tên đầy đủ trên CCCD"
            autoCapitalize="characters"
            label="Họ và tên đầy đủ *"
            labelAccessory={<Text style={styles.inputHint}>IN HOA CÓ DẤU</Text>}
            onChangeText={(value) => {
              setFullName(value.toLocaleUpperCase('vi-VN'));
              setNotice('');
            }}
            placeholder="NGUYỄN VĂN AN"
            style={styles.identityInput}
            value={fullName}
          />

          <View style={styles.citizenIdField}>
            <Input
              accessibilityLabel="Số căn cước công dân, 12 chữ số"
              keyboardType="number-pad"
              label="Số Căn cước công dân (12 số) *"
              labelAccessory={
                citizenId.length === 12 ? (
                  <View style={styles.validLabel}>
                    <MaterialIcons
                      color={colors.success}
                      name="check-circle"
                      size={fontSize.iconSm}
                    />
                    <Text style={styles.validText}>Hợp lệ</Text>
                  </View>
                ) : null
              }
              maxLength={12}
              onChangeText={(value) => {
                setCitizenId(value.replace(/\D/g, '').slice(0, 12));
                setNotice('');
              }}
              placeholder="001095012345"
              style={styles.identityInput}
              inputStyle={styles.citizenIdText}
              value={citizenId}
            />
            {citizenId.length === 12 ? (
              <View pointerEvents="none" style={styles.idValidIcon}>
                <MaterialIcons
                  color={colors.success}
                  name="verified"
                  size={fontSize.iconXl}
                />
              </View>
            ) : null}
          </View>
        </Card>

        <View style={styles.documentSection}>
          <View style={styles.documentHeading}>
            <View style={styles.documentTitleGroup}>
              <MaterialIcons
                color={colors.primary}
                name="document-scanner"
                size={fontSize.iconXl}
              />
              <Text style={styles.cardTitle}>Ảnh thẻ CCCD gắn chip</Text>
            </View>
            <Text style={styles.requiredText}>Bắt buộc</Text>
          </View>
          <View style={styles.documentRow}>
            <DocumentCard
              image={photos.idFront}
              label="Mặt trước"
              loading={busyTarget === 'idFront'}
              onPress={() => choosePhoto('idFront')}
              title="Mặt trước CCCD"
            />
            <DocumentCard
              image={photos.idBack}
              label="Mặt sau"
              loading={busyTarget === 'idBack'}
              onPress={() => choosePhoto('idBack')}
              title="Mặt sau CCCD"
            />
          </View>
        </View>

        <Card style={styles.selfieCard} variant="surface">
          <View style={styles.selfieHeader}>
            <View style={styles.selfieTitleGroup}>
              <MaterialIcons
                color={colors.primary}
                name="face"
                size={fontSize.iconXl}
              />
              <Text style={styles.cardTitle}>Chân dung sinh trắc học</Text>
            </View>
            <Text
              style={[
                styles.matchBadge,
                !selfieMatched && styles.pendingMatchBadge,
              ]}
            >
              {selfieMatched ? 'Khớp 98.6%' : 'Chờ xác minh'}
            </Text>
          </View>

          <View style={styles.selfieContent}>
            <View style={styles.selfiePortrait}>
              <Image
                accessibilityLabel="Ảnh chân dung tài xế"
                resizeMode="cover"
                source={{ uri: photos.selfie.uri }}
                style={styles.selfieImage}
              />
              <View pointerEvents="none" style={styles.selfieGuide} />
            </View>
            <View style={styles.selfieCopy}>
              <Text style={styles.selfieTitle}>
                Ảnh chân dung trực diện (Selfie)
              </Text>
              <Text style={styles.selfieDescription}>
                Khuôn mặt căn giữa khung tròn, không đeo kính râm, không đội mũ,
                ánh sáng đủ.
              </Text>
              <View style={styles.selfieActions}>
                <Pressable
                  accessibilityLabel="Chụp lại ảnh chân dung"
                  accessibilityRole="button"
                  disabled={busyTarget === 'selfie'}
                  onPress={() => choosePhoto('selfie')}
                  style={styles.retakeButton}
                >
                  <MaterialIcons
                    color={colors.onSurface}
                    name="photo-camera-front"
                    size={fontSize.iconSm}
                  />
                  <Text style={styles.retakeText}>Chụp lại</Text>
                </Pressable>
                <View style={styles.validLabel}>
                  <MaterialIcons
                    color={selfieMatched ? colors.success : colors.outline}
                    name={selfieMatched ? 'check' : 'schedule'}
                    size={fontSize.iconSm}
                  />
                  <Text
                    style={[
                      styles.validText,
                      !selfieMatched && styles.pendingText,
                    ]}
                  >
                    {selfieMatched ? 'Hợp lệ' : 'Chờ đối soát'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.securityCard} variant="muted">
          <View style={styles.securityIcon}>
            <MaterialIcons
              color={colors.primary}
              name="verified-user"
              size={fontSize.iconMd}
            />
          </View>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>Cam kết bảo mật tuyệt đối</Text>
            <Text style={styles.securityDescription}>
              DriveMate cam kết mã hóa và bảo mật dữ liệu cá nhân theo tiêu
              chuẩn <Text style={styles.isoLabel}>ISO 27001</Text>. Dữ liệu chỉ
              dùng cho mục đích xác minh tư cách pháp lý tài xế.
            </Text>
          </View>
        </Card>

        <View style={styles.submitSection}>
          {notice ? (
            <View accessibilityRole="alert" style={styles.notice}>
              <MaterialIcons
                color={colors.primary}
                name="info-outline"
                size={fontSize.iconMd}
              />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          <Button
            icon="lock"
            iconPosition="leading"
            iconSize={fontSize.iconXl}
            label="Gửi hồ sơ duyệt"
            onPress={submitVerification}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
          <View style={styles.reviewTime}>
            <MaterialIcons
              color={colors.success}
              name="schedule"
              size={fontSize.iconSm}
            />
            <Text style={styles.reviewTimeText}>
              Thời gian xét duyệt tự động: 5 - 15 phút
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
    </View>
  );
}
