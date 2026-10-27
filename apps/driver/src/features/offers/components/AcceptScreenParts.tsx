import { borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
StyleSheet,
Text,
View
} from 'react-native';
export type DispatchState = 'pending' | 'accepted' | 'declined' | 'expired';

export const HEADER_COLOR = colors.driverHeader;

export const INITIAL_COUNTDOWN = 15;

export const TIMER_DOT_COUNT = 24;

export const MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDY_rinJnDHTHO0Zj94csBnsYADT9PfueifL_rEhBQWoUqFnVT7THTopYWOQgcLYhVUHWu3n1lt8eN9krEyujbvyUpaNSr8rf3_Mf4F4sqjDF9pz5GBDepWQ9BjiAemkaw4knPoeZkfc0tnUE7XFc23ZBB2ekQaRkD-Hu-gwk8oju6yIqsK1T4GBdsH9QujBZJXYD2TM3f2qKqllrkBXMkcA-k1tyjMh14GeyGW20iqZxXiTgpvOS7bHA';

export function CountdownTimer({
  seconds,
  totalSeconds,
}: {
  seconds: number;
  totalSeconds: number;
}) {
  const activeDots = Math.ceil((seconds / totalSeconds) * TIMER_DOT_COUNT);

  return (
    <View
      accessibilityLabel={`Còn ${seconds} giây để nhận chuyến`}
      accessibilityRole="timer"
      style={styles.timer}
    >
      {Array.from({ length: TIMER_DOT_COUNT }, (_, index) => {
        const angle = (index / TIMER_DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
        const offset = 38 + 31 * Math.cos(angle);
        const top = 38 + 31 * Math.sin(angle);

        return (
          <View
            key={index}
            style={[
              styles.timerDot,
              {
                left: offset,
                top,
                backgroundColor: index < activeDots ? colors.primary : colors.surfaceContainer,
              },
            ]}
          />
        );
      })}
      <View style={styles.timerCenter}>
        <Text style={styles.timerNumber}>{seconds}</Text>
        <Text style={styles.timerUnit}>GIÂY</Text>
      </View>
    </View>
  );
}

export function RouteStop({
  address,
  badge,
  badgeColor,
  distance,
  icon,
  iconColor,
  title,
  withConnector = false,
}: {
  address: string;
  badge: string;
  badgeColor: string;
  distance: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  withConnector?: boolean;
}) {
  return (
    <View style={styles.routeStop}>
      <View style={styles.routeRail}>
        <View style={[styles.routeMarker, { backgroundColor: badgeColor }]}>
          <MaterialIcons color={colors.onPrimary} name={icon} size={fontSize.iconXs} />
        </View>
        {withConnector ? <View style={styles.routeConnector} /> : null}
      </View>
      <View style={styles.routeCopy}>
        <View style={styles.routeMetaRow}>
          <View style={[styles.routeBadge, { backgroundColor: `${badgeColor}20` }]}>
            <Text style={[styles.routeBadgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
          <Text numberOfLines={1} style={styles.routeDistance}>
            {distance}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.routeTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.routeAddress}>
          {address}
        </Text>
      </View>
    </View>
  );
}

export function TripInfo({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.tripInfo}>
      <MaterialIcons color={colors.secondary} name={icon} size={fontSize.iconXl} />
      <View style={styles.tripInfoCopy}>
        <Text numberOfLines={1} style={styles.tripInfoLabel}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.tripInfoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    zIndex: 2,
    backgroundColor: HEADER_COLOR,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    height: spacing.headerHeight,
    paddingHorizontal: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  backButton: {
    width: spacing.iconButtonMd,
    height: spacing.iconButtonMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headlineSm,
    flex: 1,
    color: colors.onPrimary,
    letterSpacing: -0.3,
  },
  profileIcon: {
    width: spacing.avatarMd,
    height: spacing.avatarMd,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.spaceMd,
  },
  mapSection: {
    height: 320,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.primaryFixed,
  },
  mapImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  mapWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(248, 249, 255, 0.42)',
  },
  mapLowerWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '44%',
    backgroundColor: 'rgba(248, 249, 255, 0.64)',
  },
  mapBadges: {
    position: 'absolute',
    top: spacing.spaceMd,
    left: spacing.gutter,
    right: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  radarBadge: {
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1_5,
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py1_5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest95,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  radarDot: {
    width: spacing.badgeMd,
    height: spacing.badgeMd,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
  },
  radarBadgeText: {
    ...typography.labelSm,
    flexShrink: 1,
    color: colors.onSurface,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.px2_5,
    paddingVertical: spacing.py1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.inverseSurface80,
  },
  vipBadgeText: {
    ...typography.labelSm,
    color: colors.inverseOnSurface,
  },
  vehicleCard: {
    position: 'absolute',
    left: spacing.gutter,
    right: spacing.gutter,
    bottom: spacing.spaceXl,
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    padding: spacing.spaceSm + spacing.gap1,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLowest90,
  },
  vehicleIconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixed,
  },
  vehicleCopy: {
    flex: 1,
    minWidth: 0,
  },
  vehicleName: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  vehicleDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: fontSize.bodyMd,
  },
  transmissionBadge: {
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.gap1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  transmissionText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  dispatchContent: {
    zIndex: 1,
    marginTop: -spacing.spaceMd,
    paddingHorizontal: spacing.gutter,
    gap: spacing.spaceMd,
  },
  dispatchCard: {
    position: 'relative',
    padding: spacing.spaceMd,
    paddingTop: spacing.spaceMd + spacing.gap1,
    overflow: 'hidden',
    gap: spacing.spaceMd,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLowest,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    flexDirection: 'row',
  },
  accentSegment: {
    flex: 1,
  },
  dispatchSummary: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  earningCopy: {
    flex: 1,
    minWidth: 0,
  },
  earningLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.gap1,
    marginTop: spacing.gap1,
  },
  amount: {
    ...typography.headlineXl,
    color: colors.primary,
    letterSpacing: -0.8,
  },
  currency: {
    ...typography.headlineSm,
    color: colors.primary,
  },
  insuranceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
    marginTop: spacing.gap1,
  },
  insuranceText: {
    ...typography.bodyMd,
    flexShrink: 1,
    color: colors.success,
    fontSize: fontSize.labelSm,
    lineHeight: 16,
  },
  timer: {
    width: 80,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timerDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: borderRadius.full,
  },
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNumber: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '700',
    lineHeight: 21,
  },
  timerUnit: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontSize: fontSize.labelSm,
  },
  routeCard: {
    padding: spacing.p3_5,
    gap: spacing.spaceSm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLow,
  },
  routeStop: {
    minHeight: 74,
    flexDirection: 'row',
    gap: spacing.spaceSm,
  },
  routeRail: {
    width: spacing.spaceMd,
    alignItems: 'center',
  },
  routeMarker: {
    width: spacing.p3_5,
    height: spacing.p3_5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    elevation: 1,
  },
  routeConnector: {
    width: 2,
    height: 38,
    marginTop: spacing.gap1,
    backgroundColor: colors.outlineVariant,
  },
  routeCopy: {
    flex: 1,
    minWidth: 0,
  },
  routeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  routeBadge: {
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
  },
  routeBadgeText: {
    ...typography.labelSm,
    fontSize: fontSize.labelSm,
  },
  routeDistance: {
    ...typography.labelSm,
    flexShrink: 1,
    color: colors.onSurfaceVariant,
  },
  routeTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    marginTop: spacing.gap1,
  },
  routeAddress: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: fontSize.labelLg,
  },
  tripInfoRow: {
    flexDirection: 'row',
    gap: spacing.spaceSm,
  },
  tripInfo: {
    minHeight: 68,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    padding: spacing.spaceSm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  tripInfoCopy: {
    flex: 1,
    minWidth: 0,
  },
  tripInfoLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  tripInfoValue: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  statusMessage: {
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.gap1,
    borderRadius: borderRadius.lg,
  },
  statusAccepted: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  statusDeclined: {
    backgroundColor: colors.errorContainer,
  },
  statusExpired: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  statusMessageText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  actionButtons: {
    gap: spacing.spaceSm,
  },
  acceptButton: {
    height: spacing.ctaHeight + spacing.gap1,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryContainer,
    shadowOpacity: 0.16,
    elevation: 4,
  },
  acceptButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
    textTransform: 'uppercase',
  },
  declineButton: {
    height: spacing.buttonHeight,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  declineButtonText: {
    ...typography.labelMd,
    color: colors.error,
  },
  safetyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1_5,
    paddingHorizontal: spacing.spaceXs,
  },
  safetyFooterText: {
    ...typography.bodyMd,
    flexShrink: 1,
    color: colors.onSurfaceVariant,
    fontSize: fontSize.labelLg,
    textAlign: 'center',
  },
});
