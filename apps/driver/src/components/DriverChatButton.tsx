import type { CustomerRideDetail } from '@datxe/shared';
import { MotionPressable, Typography, borderRadius, spacing, typography, useThemeColors, useThemedStyles, type ThemeColors } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { canDriverChat } from '@/lib/chatAvailability';

export function DriverChatButton({ ride, compact = false, labelText, style, onOpen }: {
  ride: CustomerRideDetail;
  compact?: boolean;
  labelText?: string;
  style?: StyleProp<ViewStyle>;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const s = useThemedStyles(styles);
  const c = useThemeColors();
  if (!canDriverChat(ride)) return null;
  const unread = ride.unreadChatCount ?? 0;
  const accessibilityLabel = unread ? `Nhắn tin với khách · ${unread} tin chưa đọc` : 'Nhắn tin với khách';
  const displayLabel = labelText ?? 'Nhắn tin với khách';
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[s.button, compact && s.compact, style]}
      onPress={() => {
        onOpen?.();
        router.push({ pathname: '/chat', params: { rideId: String(ride.id) } });
      }}
    >
      <MaterialIcons name="chat-bubble-outline" size={20} color={c.onSurfaceVariant} importantForAccessibility="no" />
      {!compact ? <Typography style={s.label}>{displayLabel}</Typography> : null}
      {unread > 0 ? <View style={s.badge}><Typography style={s.count}>{unread > 99 ? '99+' : unread}</Typography></View> : null}
    </MotionPressable>
  );
}

const styles = (c: ThemeColors) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceSm,
    paddingHorizontal: spacing.px3,
    paddingVertical: spacing.spaceSm,
    minHeight: 48,
    minWidth: 48,
    borderRadius: borderRadius.full,
    backgroundColor: c.surfaceContainerHigh,
  },
  compact: { padding: spacing.spaceSm },
  label: { ...typography.label, flexShrink: 1, color: c.onSurface },
  badge: {
    backgroundColor: c.primaryContainer,
    borderRadius: borderRadius.full,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  count: { ...typography.badge, color: c.onPrimaryContainer, fontVariant: ['tabular-nums'] },
});
