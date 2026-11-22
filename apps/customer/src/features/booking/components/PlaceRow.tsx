import { MaterialIcons } from '@expo/vector-icons';
import { translate as i18nT } from '@datxe/shared';
import {
  MotionPressable as Pressable,
  Typography as Text,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { StyleSheet, View } from 'react-native';
import { placeAccent, placeStyles } from './placeStyles';

type RowIcon = keyof typeof MaterialIcons.glyphMap;

type PlaceRowProps = {
  title: string;
  address: string;
  meta?: string;
  icon?: RowIcon;
  iconColor?: string;
  iconBackground?: string;
  selected?: boolean;
  onPress?: () => void;
  onMore?: () => void;
  moreAccessibilityLabel?: string;
  disabled?: boolean;
};

/**
 * Một dòng địa điểm dùng chung cho kết quả tìm kiếm, điểm gần đây và danh sách
 * quanh ghim. Nút "..." tách khỏi vùng bấm chính để mở trang chi tiết.
 */
export function PlaceRow({
  title,
  address,
  meta,
  icon = 'place',
  iconColor,
  iconBackground,
  selected,
  onPress,
  onMore,
  moreAccessibilityLabel,
  disabled,
}: PlaceRowProps) {
  const colors = useThemeColors();
  const s = useThemedStyles(placeStyles);
  return (
    <View style={[s.listRow, selected && s.selectedRow]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${address}`}
        accessibilityState={{ selected, disabled }}
        disabled={disabled || !onPress}
        onPress={onPress}
        style={({ pressed }) => [s.listRowMain, pressed && s.pressed]}
      >
        <View style={[s.listIcon, iconBackground ? { backgroundColor: iconBackground } : null]}>
          <MaterialIcons name={icon} size={22} color={iconColor ?? colors.onSurfaceVariant} />
        </View>
        <View style={s.listCopy}>
          <Text style={[s.listTitle, selected && s.selectedTitle]}>{title}</Text>
          <Text style={[s.listAddress, selected && { color: colors.onWarningContainer }]}>
            {address}
          </Text>
          {meta ? (
            <Text style={[s.listMeta, selected && { color: colors.onWarningContainer }]}>
              {meta}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={moreAccessibilityLabel ?? i18nT('Xem chi tiết địa điểm')}
          onPress={onMore}
          style={({ pressed }) => [s.moreButton, pressed && s.pressed]}
          hitSlop={8}
        >
          <MaterialIcons name="more-vert" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Biểu tượng tròn nhỏ cho điểm đón/điểm đến trong ô nhập. */
export function PlaceKindIcon({ pickup }: { pickup: boolean }) {
  const colors = useThemeColors();
  const accent = placeAccent(colors);
  return (
    <View style={[kindIconStyles.box, { backgroundColor: pickup ? accent.pickup : accent.dropoff }]}>
      <MaterialIcons
        name={pickup ? 'person-pin-circle' : 'place'}
        size={18}
        color={pickup ? accent.onAccent : colors.onRideDropoff}
      />
    </View>
  );
}

// Kích thước cố định để không phụ thuộc theme khi render icon tròn.
const kindIconStyles = StyleSheet.create({
  box: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
