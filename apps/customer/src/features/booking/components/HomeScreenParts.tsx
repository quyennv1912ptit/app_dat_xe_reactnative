import type { CustomerRideDetail,CustomerRideSummary,CustomerVoucher } from '@datxe/shared';
import { borderRadius,colors,fontWeight,spacing,typography } from '@datxe/ui';
import {
StyleSheet
} from 'react-native';
export const promoImage = require('@/assets/5._trang_ch/promo.jpg');

export function getGreeting(hour: number): string {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function getRecentDestinations(rides: CustomerRideSummary[]): string[] {
  const addresses = new Map<string, string>();
  for (const ride of rides) {
    if (['CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED'].includes(ride.status)) continue;
    const address = ride.dropoffAddress?.trim();
    if (address) addresses.set(address.toLocaleLowerCase('vi-VN'), address);
  }
  return [...addresses.values()].slice(0, 3);
}

export function getRideStatusLabel(status: CustomerRideDetail['status']): string {
  const labels: Record<CustomerRideDetail['status'], string> = {
    PENDING: 'Đang chờ xử lý',
    SEARCHING: 'Đang tìm tài xế',
    DRIVER_ASSIGNED: 'Đã có tài xế',
    DRIVER_ARRIVING: 'Tài xế đang tới điểm đón',
    DRIVER_ARRIVED: 'Tài xế đã đến điểm đón',
    VEHICLE_HANDOVER: 'Đang bàn giao xe',
    IN_PROGRESS: 'Chuyến đi đang diễn ra',
    ARRIVED_DESTINATION: 'Đã đến điểm trả xe',
    VEHICLE_RETURNED: 'Đang hoàn tất bàn giao',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
    NO_DRIVER_FOUND: 'Chưa tìm được tài xế',
    EXPIRED: 'Yêu cầu đã hết hạn',
  };
  return labels[status];
}

export function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('vi-VN').format(date);
}

export function describeVoucher(voucher: CustomerVoucher): string {
  if (voucher.discountType === 'PERCENT') {
    const cap = voucher.maxDiscount === null
      ? ''
      : `, tối đa ${formatCurrency(voucher.maxDiscount)}`;
    return `Giảm ${voucher.value}%${cap} cho chuyến đi`;
  }
  if (voucher.discountType === 'FIXED') {
    return `Giảm ${formatCurrency(voucher.value)} cho chuyến đi`;
  }
  return 'Ưu đãi dành cho chuyến đi của bạn';
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không tải được dữ liệu từ máy chủ.';
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.spaceLg,
    paddingBottom: spacing.spaceXl,
    gap: spacing.spaceLg,
  },
  greetingCard: {
    gap: spacing.spaceSm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  greetingCopy: {
    gap: spacing.spaceXs,
  },
  loadError: {
    ...typography.bodyMd,
    color: colors.error,
  },
  greetingTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  greetingMeta: {
    ...typography.bodyMd,
    color: colors.secondary,
  },
  greetingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    paddingTop: spacing.spaceSm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  locationBadge: {
    width: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixedTint,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: spacing.letterSpacingWide,
  },
  currentLocation: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  locationRefresh: {
    width: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  notifWrap: {
    position: 'relative',
  },
  notifButton: {
    width: spacing.iconButtonLg,
    height: spacing.iconButtonLg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: spacing.spaceSm,
    right: spacing.spaceSm,
    width: spacing.badgeMd,
    height: spacing.badgeMd,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.searchBarHeight,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.spaceMd,
    gap: spacing.spaceSm,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchPlaceholder: {
    ...typography.bodyLgMedium,
    color: colors.secondary,
    flex: 1,
  },
  recentSection: {
    gap: spacing.spaceXs,
  },
  recentHint: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  recentDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    minHeight: 56,
    paddingHorizontal: spacing.spaceSm,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  recentDestinationIcon: {
    width: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixedTint,
  },
  recentDestinationText: {
    ...typography.bodyMdMedium,
    flex: 1,
    color: colors.onSurface,
  },
  tripCard: {
    gap: spacing.spaceMd,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tripAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: spacing.accentBar,
    backgroundColor: colors.primaryContainer,
  },
  tripStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
    marginTop: spacing.spaceXs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1_5,
    paddingHorizontal: spacing.px3,
    paddingVertical: spacing.py1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryFixed,
    flexShrink: 1,
  },
  statusDot: {
    width: spacing.badgeSm,
    height: spacing.badgeSm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  statusText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  tripCode: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceMd,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    flex: 1,
    minWidth: 0,
  },
  driverAvatarWrap: {
    width: spacing.avatarLg,
    height: spacing.avatarLg,
  },
  driverAvatar: {
    width: spacing.avatarLg,
    height: spacing.avatarLg,
    borderRadius: borderRadius.full,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -spacing.spaceXs,
    right: -spacing.spaceXs,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.full,
    padding: spacing.py0_5,
  },
  driverCopy: {
    flex: 1,
    minWidth: 0,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1_5,
  },
  driverName: {
    ...typography.bodyLgMedium,
    color: colors.onSurface,
    flexShrink: 1,
  },
  ratingPill: {
    backgroundColor: colors.tertiaryFixed40,
    paddingHorizontal: spacing.gap1_5,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.default,
  },
  ratingText: {
    ...typography.labelSm,
    color: colors.tertiaryContainer,
  },
  driverMeta: {
    ...typography.bodyMd,
    color: colors.secondary,
  },
  callButton: {
    width: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.px2_5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  pickupCopy: {
    flex: 1,
    minWidth: 0,
  },
  pickupLabel: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  pickupValue: {
    ...typography.bodyMdMedium,
    color: colors.onSurface,
  },
  rideFareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.spaceXs,
  },
  rideFareValue: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  tripAction: {
    width: '100%',
    height: spacing.buttonHeight,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceSm,
  },
  tripActionText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceMd,
    // Nền trong suốt giống bản gốc (LinearGradient tự đảm nhiệm nền).
    backgroundColor: colors.transparent,
  },
  promoCopy: {
    flex: 1,
    gap: spacing.gap1_5,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.px2,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.tertiaryFixed,
  },
  promoBadgeText: {
    ...typography.labelSm,
    color: colors.onTertiaryFixed,
  },
  promoTitle: {
    ...typography.bodyLgMedium,
    color: colors.onSurface,
  },
  promoMeta: {
    ...typography.bodyMd,
    color: colors.secondary,
  },
  promoButton: {
    alignSelf: 'flex-start',
    height: spacing.promoButtonHeight,
    paddingHorizontal: spacing.spaceMd,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.py1,
  },
  promoButtonText: {
    ...typography.labelSm,
    color: colors.onPrimary,
  },
  promoImage: {
    width: spacing.promoImage,
    height: spacing.promoImage,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceSm,
    paddingVertical: spacing.spaceXs,
    opacity: spacing.footerOpacity,
  },
  reassuranceText: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  tabBar: {
    height: spacing.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.spaceXs,
    backgroundColor: colors.surface85,
    shadowColor: colors.navShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    minWidth: spacing.iconButtonMd,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1,
  },
  tabLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  tabLabelActive: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  tabDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: spacing.badgeSm,
    height: spacing.badgeSm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
