import { typography, type ThemeColors } from '@datxe/ui';
import { StyleSheet } from 'react-native';

/**
 * Home: 3 tầng theo MD3 — lời chào, thẻ ví trung tính, thẻ đặt chuyến.
 * Không tự đặt nhịp dọc ở đây: content container của bottom sheet đã dùng gap 16
 * (xem `MapSheetLayout`), home giữ đúng nhịp chung của app.
 * Thẻ ví và hàng điểm đón dùng surface trung tính + viền hairline; chỉ điểm đến
 * dùng tonal primary (primaryContainer/onPrimaryContainer) để nổi bật CTA đặt tài xế.
 */
export const homeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Tầng 1 — lời chào
    greeting: {
      ...typography.sectionTitle,
      color: colors.onSurface,
    },

    // Tầng 2 — thẻ ví (filled card trung tính)
    walletCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 64,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLowest,
    },
    walletLeft: {
      flexGrow: 1,
      flexBasis: 160,
      minWidth: 0,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    walletIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
    },
    walletCopy: { flex: 1, minWidth: 0, gap: 2 },
    walletLabel: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    walletBalance: {
      ...typography.cardTitle,
      color: colors.onSurface,
      fontVariant: ['tabular-nums'],
    },
    walletAction: {
      flexShrink: 0,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
    },
    walletActionText: {
      ...typography.label,
      color: colors.primary,
    },

    // Tầng 3 — thẻ đặt chuyến: điểm đón trung tính, điểm đến tonal primary
    bookingCard: {
      borderRadius: 16,
      backgroundColor: colors.surfaceContainerLowest,
      overflow: 'hidden',
    },
    bookingRow: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    bookingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookingCopy: { flex: 1, minWidth: 0, gap: 2 },
    bookingLabel: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    bookingAddress: {
      ...typography.bodySecondary,
      color: colors.onSurface,
    },

    destinationRow: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primaryContainer,
    },
    destinationMain: {
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    destinationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    destinationText: {
      ...typography.cardTitle,
      flex: 1,
      color: colors.onPrimaryContainer,
    },
    clockButton: {
      minWidth: 64,
      minHeight: 48,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerLowest,
    },
    clockLabel: {
      ...typography.navigationLabel,
      color: colors.primary,
    },

    // Chuyến đang diễn ra: cũng dùng tonal primary vì đây là hành động chính
    activeRideCard: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.primaryContainer,
    },
    activeRideCopy: { flex: 1, minWidth: 0, gap: 2 },
    activeRideLabel: {
      ...typography.caption,
      color: colors.onPrimaryFixedVariant,
    },
    activeRideStatus: {
      ...typography.cardTitle,
      color: colors.onPrimaryContainer,
    },

    // Caption số tài xế
    nearbyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
    nearbyText: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
    },
    recentSection: { gap: 8 },
    recentHeading: {
      ...typography.label,
      color: colors.onSurfaceVariant,
      paddingHorizontal: 4,
    },
    recentCard: {
      borderRadius: 16,
      backgroundColor: colors.surfaceContainerLowest,
      overflow: 'hidden',
    },
    recentRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    recentIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
    },
    recentCopy: { flex: 1, minWidth: 0, gap: 2 },
    recentTitle: {
      ...typography.label,
      color: colors.onSurface,
    },
    recentAddress: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    loading: { alignItems: 'center', padding: 16 },
  });
