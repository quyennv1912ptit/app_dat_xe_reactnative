import { StyleSheet, Switch, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  GroupedList,
  MotionPressable,
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';

const items = [
  {
    icon: 'badge' as const,
    title: 'Căn cước công dân (2 mặt)',
    detail: 'Bản gốc gắn chip hoặc căn cước mới, còn hạn và rõ chữ.',
  },
  {
    icon: 'fact-check' as const,
    title: 'Giấy phép lái xe (2 mặt)',
    detail: 'Thẻ PET rõ thông tin; mặt sau hỗ trợ quét mã QR.',
  },
  {
    icon: 'face' as const,
    title: 'Ảnh chân dung trực tiếp',
    detail: 'Chụp ở nơi đủ sáng, không đeo kính râm hay khẩu trang.',
  },
];

/** Calm single-scroll preparation step using a borderless GroupedList instead of stacked boxes. */
export function VerificationPrepareStep({
  consent,
  locked,
  reading,
  onToggleConsent,
}: {
  consent: boolean;
  locked: boolean;
  reading: boolean;
  onToggleConsent: (value: boolean) => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const toggleDisabled = locked || reading;

  return (
    <View style={styles.root}>
      <View style={styles.intro}>
        <Text style={styles.title}>Chuẩn bị giấy tờ trước khi chụp</Text>
        <Text style={styles.subtitle}>
          Bạn sẽ chụp 5 ảnh: hai mặt CCCD, hai mặt GPLX và một ảnh chân dung. Chuẩn bị giấy tờ gốc ở nơi đủ sáng.
        </Text>
      </View>

      <GroupedList>
        {items.map(item => (
          <View key={item.title} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name={item.icon} size={22} color={colors.onPrimaryContainer} importantForAccessibility="no" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </GroupedList>

      <View style={styles.intro}>
        <Text style={styles.itemTitle}>Các bước tiếp theo</Text>
        <Text style={styles.itemDetail}>1. Chụp lần lượt từng ảnh theo khung hướng dẫn. Kiểm tra rõ chữ và đủ bốn góc trước khi dùng ảnh.</Text>
        <Text style={styles.itemDetail}>2. Quét QR nếu có để điền nhanh. Nếu không đọc được QR, bạn vẫn có thể tự nhập thông tin theo giấy tờ.</Text>
        <Text style={styles.itemDetail}>3. Kiểm tra thông tin, bổ sung mục còn thiếu rồi xác nhận gửi hồ sơ xét duyệt.</Text>
        <Text style={styles.itemDetail}>4. Xem kết quả tại Xác minh tài xế. Sau khi được duyệt, mở Loại xe nhận lái hộ để bật nhóm xe đủ điều kiện.</Text>
      </View>

      <MotionPressable
        accessible={false}
        disabled={toggleDisabled}
        onPress={() => onToggleConsent(!consent)}
        style={[
          styles.consentCard,
          { backgroundColor: consent ? colors.primaryContainer : colors.cardSurface },
        ]}
      >
        <Switch
          accessibilityLabel="Đồng ý gửi ảnh giấy tờ và ảnh chân dung để xác minh"
          value={consent}
          disabled={toggleDisabled}
          onValueChange={onToggleConsent}
        />
        <Text style={[styles.consentText, { color: consent ? colors.onPrimaryContainer : colors.onSurface }]}>
          Tôi đồng ý gửi ảnh giấy tờ và ảnh chân dung để đối chiếu thông tin và xét duyệt hồ sơ tài xế.
        </Text>
      </MotionPressable>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.spaceMd },
    intro: { gap: spacing.xxs },
    title: { ...typography.screenTitle, color: colors.onSurface },
    subtitle: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.px3,
      paddingVertical: spacing.spaceSm,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textWrap: { flex: 1, gap: 2 },
    itemTitle: { ...typography.cardTitle, color: colors.onSurface },
    itemDetail: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
    consentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.px3,
      padding: spacing.spaceMd,
      minHeight: 56,
      borderRadius: borderRadius.default,
    },
    consentText: {
      ...typography.bodySecondary,
      flex: 1,
    },
  });
