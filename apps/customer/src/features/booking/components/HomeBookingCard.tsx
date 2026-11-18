import { translate as t } from '@datxe/shared';
import {
  MotionPressable as Pressable,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { homeStyles } from './homeStyles';

/**
 * Tầng 3: thẻ đặt chuyến gồm hàng điểm đón trung tính và hàng điểm đến dùng
 * tonal primary làm CTA chính; hai hàng cùng padding 16 nên icon và text thẳng hàng.
 */
export function HomeBookingCard({
  pickupAddress,
  pickupLoading,
  onPickup,
  onSearch,
  onSchedule,
}: {
  pickupAddress: string;
  pickupLoading: boolean;
  onPickup: () => void;
  onSearch: () => void;
  onSchedule: () => void;
}) {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(homeStyles);
  const pickupLabel = pickupLoading
    ? t('Đang xác định vị trí…')
    : pickupAddress || t('Chưa xác định được vị trí');

  return (
    <View style={s.bookingCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('Điểm đón')}: ${pickupLabel}`}
        onPress={onPickup}
        style={({ pressed }) => [s.bookingRow, pressed && { opacity: 0.65 }]}
      >
        <View style={[s.bookingIcon, { backgroundColor: colors.ridePickup }]}>
          <MaterialIcons name="person-pin-circle" size={22} color={colors.onRideAccent} />
        </View>
        <View style={s.bookingCopy}>
          <Text style={s.bookingLabel}>{t('Điểm đón')}</Text>
          <Text style={s.bookingAddress}>
            {pickupLabel}
          </Text>
        </View>
        {pickupLoading ? (
          <ActivityIndicator size="small" color={colors.ridePickup} />
        ) : (
          <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        )}
      </Pressable>

      <View style={s.destinationRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Bạn muốn đi đâu?')}
          onPress={onSearch}
          style={({ pressed }) => [s.destinationMain, pressed && { opacity: 0.65 }]}
        >
          <View style={s.destinationIcon}>
            <MaterialIcons name="search" size={22} color={colors.onPrimary} />
          </View>
          <Text textBreakStrategy="simple" style={s.destinationText}>
            {t('Bạn muốn đi đâu?')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Đặt chuyến hẹn giờ')}
          onPress={onSchedule}
          style={({ pressed }) => [s.clockButton, pressed && { opacity: 0.65 }]}
          hitSlop={6}
        >
          <MaterialIcons name="schedule" size={22} color={colors.primary} />
          <Text textBreakStrategy="simple" style={s.clockLabel}>{t('Hẹn giờ')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
