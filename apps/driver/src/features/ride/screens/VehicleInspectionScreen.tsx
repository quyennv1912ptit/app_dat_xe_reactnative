import { Button,Card,colors,fontSize,spacing } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
Image,
Pressable,
ScrollView,
Text,
TextInput,
View
} from 'react-native';
import { NOTE_PRESETS,styles } from '../components/VehicleInspectionScreenParts';
import { useVehicleInspection } from '../hooks/useVehicleInspection';
export default function VehicleInspectionScreen() {
const { router, insets, slots, notes, setNotes, capturingIndex, capturedCount, capturePhoto, appendNote, submitHandover } = useVehicleInspection();
return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons color={colors.onPrimary} name="arrow-back" size={fontSize.icon2xl} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>Chi Tiết Chuyến Xe</Text>
        <View style={styles.headerAvatar}>
          <MaterialIcons color={colors.onPrimary} name="person-outline" size={fontSize.iconMd} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.spaceXl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.noticeCard} variant="muted">
          <View style={styles.noticeTop}>
            <View style={styles.noticeTitle}>
              <MaterialIcons color={colors.primary} name="verified-user" size={fontSize.iconLg} />
              <Text style={styles.noticeHeading}>BIÊN BẢN BÀN GIAO</Text>
            </View>
            <Text style={styles.counter}>{'Đã chụp ' + capturedCount + '/6'}</Text>
          </View>
          <Text style={styles.noticeCopy}>
            Chụp ảnh trước khi nhận chìa khóa và đối chiếu khi trả xe cho khách.
          </Text>
          <View style={styles.cameraNotice}>
            <MaterialIcons color={colors.success} name="lock-outline" size={fontSize.iconSm} />
            <Text style={styles.cameraNoticeText}>Chỉ chụp trực tiếp qua camera chống gian lận</Text>
          </View>
        </Card>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: (capturedCount / slots.length) * 100 + '%' }]} />
        </View>

        <View style={styles.photoGrid}>
          {slots.map((slot, index) => {
            const isCaptured = Boolean(slot.image);
            const isCapturing = capturingIndex === index;
            return (
              <Card key={slot.title} style={styles.photoCard} variant="surface">
                <Pressable
                  accessibilityLabel={(isCaptured ? 'Chụp lại ' : 'Chụp ') + slot.title}
                  accessibilityRole="button"
                  disabled={isCapturing}
                  onPress={() => void capturePhoto(index)}
                  style={styles.photoAction}
                >
                  {isCaptured ? (
                    <Image resizeMode="cover" source={{ uri: slot.image }} style={styles.photo} />
                  ) : (
                    <View style={styles.pendingPhoto}>
                      <View style={styles.cameraCircle}>
                        <MaterialIcons color={colors.primary} name="photo-camera" size={fontSize.icon26} />
                      </View>
                      <Text style={styles.captureLabel}>{isCapturing ? 'Đang mở camera…' : 'Chụp ngay'}</Text>
                    </View>
                  )}
                  {isCaptured ? (
                    <>
                      <View style={styles.checkedBadge}>
                        <MaterialIcons color={colors.onPrimary} name="check" size={fontSize.iconSm} />
                      </View>
                      <View style={styles.cameraBadge}>
                        <MaterialIcons color={colors.onPrimary} name="photo-camera" size={fontSize.iconMd} />
                      </View>
                    </>
                  ) : null}
                </Pressable>
                <View style={styles.photoCaption}>
                  <Text numberOfLines={1} style={styles.photoTitle}>{slot.title}</Text>
                  <View style={styles.photoStatus}>
                    <View style={[styles.statusDot, isCaptured && styles.statusDotCaptured]} />
                    <Text style={[styles.statusText, isCaptured && styles.statusTextCaptured]}>
                      {isCaptured ? 'Đã lưu hình ảnh' : 'Chưa chụp'}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        <Card style={styles.notesCard} variant="surface">
          <View style={styles.notesHeading}>
            <MaterialIcons color={colors.secondary} name="edit-note" size={fontSize.iconLg} />
            <Text style={styles.sectionTitle}>Ghi chú vết xước hoặc đồ đạc trên xe</Text>
            <Text style={styles.optional}>Tùy chọn</Text>
          </View>
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Ví dụ: Vết trầy nhẹ cản sau bên phụ, có 01 laptop ở ghế sau..."
            placeholderTextColor={colors.outline}
            style={styles.notesInput}
            textAlignVertical="top"
            value={notes}
          />
          <View style={styles.presetRow}>
            {NOTE_PRESETS.map((preset) => (
              <Pressable
                accessibilityRole="button"
                key={preset}
                onPress={() => appendNote(preset)}
                style={styles.presetChip}
              >
                <Text style={styles.presetText}>{'+ ' + preset.replace(/^Có |^Xe sạch sẽ /, '')}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button
          icon="assignment-turned-in"
          iconPosition="leading"
          label="Xác nhận bàn giao xe"
          onPress={submitHandover}
          style={styles.submitButton}
          textStyle={styles.submitLabel}
        />
        <View style={styles.footerNote}>
          <MaterialIcons color={colors.outline} name="info-outline" size={fontSize.iconSm} />
          <Text style={styles.footerText}>Biên bản sẽ được đồng bộ và lưu trữ minh bạch</Text>
        </View>
      </ScrollView>
    </View>
  );
}
