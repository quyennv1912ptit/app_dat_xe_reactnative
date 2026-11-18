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
import { placeTitle } from '../bookingUtils';
import { useBookingDraft } from '../store';
import type { BookingPlace } from '../types';
import { checkoutStyles } from './checkoutStyles';

/**
 * Thanh địa chỉ nổi phía trên bản đồ, tách khỏi nội dung cuộn của bottom sheet.
 * Giữ nguyên thao tác đổi điểm đón/đến và đổi chiều.
 */
export function RideRouteBar({
  pickup,
  dropoff,
  onBack,
  onPickup,
  onDropoff,
}: {
  pickup: BookingPlace | null;
  dropoff: BookingPlace | null;
  onBack: () => void;
  onPickup: () => void;
  onDropoff: () => void;
}) {
  useLanguage();
  const colors = useThemeColors();
  const s = useThemedStyles(checkoutStyles);
  const draft = useBookingDraft();
  const canSwap = Boolean(pickup && dropoff);

  const swap = () => {
    if (!pickup || !dropoff) return;
    draft.setPlace('pickup', dropoff);
    draft.setPlace('dropoff', pickup);
  };

  const pickupText = pickup ? placeTitle(pickup.address) : t('Chọn điểm đón');
  const dropoffText = dropoff ? placeTitle(dropoff.address) : t('Chọn điểm đến');

  return (
    <View style={s.routeBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Quay lại')}
        onPress={onBack}
        style={s.routeBack}
        hitSlop={6}
      >
        <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
      </Pressable>

      <View style={s.routeMarkers}>
        <View style={[s.routeDot, { backgroundColor: colors.ridePickup }]} />
        <View style={[s.routeLine, { backgroundColor: colors.outlineVariant }]} />
        <View style={[s.routeDot, { backgroundColor: colors.rideDropoff }]} />
      </View>

      <View style={s.routeCopy}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('Điểm đón')}, ${pickup?.address ?? pickupText}`}
          onPress={onPickup}
          style={s.routeRow}
        >
          <Text numberOfLines={2} style={[s.routeText, !pickup && s.routePlaceholder]}>
            {pickupText}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('Điểm đến')}, ${dropoff?.address ?? dropoffText}`}
          onPress={onDropoff}
          style={s.routeRow}
        >
          <Text numberOfLines={2} style={[s.routeText, !dropoff && s.routePlaceholder]}>
            {dropoffText}
          </Text>
        </Pressable>
      </View>

      <View style={s.routeActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Đổi điểm đón và điểm đến')}
          accessibilityState={{ disabled: !canSwap }}
          disabled={!canSwap}
          onPress={swap}
          style={[s.routeAction, !canSwap && s.routeActionDisabled]}
        >
          <MaterialIcons name="swap-vert" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>
    </View>
  );
}
