import { StyleSheet, Switch, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Card,
  GroupedList,
  Typography as Text,
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

  return (
    <View style={styles.root}>
      <View style={styles.intro}>
        <Text style={styles.title}>Chuẩn bị giấy tờ trước khi chụp</Text>
        <Text style={styles.subtitle}>
          Chuẩn bị sẵn 3 mục dưới đây để hoàn thành trong khoảng 2 phút.
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

      <Card style={styles.consentCard}>
        <Switch
          accessibilityLabel="Đồng ý tải ảnh để xác minh"
          value={consent}
          disabled={locked || reading}
          onValueChange={onToggleConsent}
        />
        <Text style={styles.consentText}>
          Tôi đồng ý gửi ảnh giấy tờ và ảnh chân dung để đối chiếu thông tin và xét duyệt hồ sơ tài xế.
        </Text>
      </Card>
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
      padding: spacing.spaceMd,
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
    },
    consentText: {
      ...typography.bodySecondary,
      color: colors.onSurface,
      flex: 1,
    },
  });
