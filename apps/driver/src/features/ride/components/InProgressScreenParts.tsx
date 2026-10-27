import { borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
Pressable,
StyleSheet,
Text,
View
} from 'react-native';
export type MapTool = 'layers' | 'location' | 'traffic';

export const HEADER_COLOR = colors.driverHeader;

export const CUSTOMER_PHONE = '0901234567';

export const CUSTOMER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD3Fvxjt9-i6cC3tPw1P6CB7lyHPWwEAJEyE0Og_qOKArcEZoErwMaME5mR9y9bKHUbb2SE0kfvXKsNq7l_ZesREUFX0E8ciSTHEAIZEp0ahElTCwcadSQho90Kni1LbhDAfF_7oCp0u3yPdZpubedNj2SkNoTpzdhgU4qxHcQjNKxjj8xYv1eq6BEHccWIdeC0zPdkg0oE9feqmyPtkMeR0yg0wZsmvsF4BgtxZf_AvfB_mHW1J6yieQ';

export const MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCAm3tmKY-WFmWrxhftGBGQu80Hkk2Qm9yXrwPK_uMrcRcodHkrcpTU7FBDfLtpeSt32x6wZDF_mGoJTA2k2nMQ5vvwgGKQSIjQ67fy8h27J1JN38kJMD7IahViEmXGDE2bjnnX9gkO09RpCVHjbctj7SOkF5mX_ZcY3QOOnGjZ6QEXeYaUt4OX6_CB4Qs7huhY5f-bhjtTrtiF-NVPaJ1E4oImVAxKNHgn3shQhYL_iUJbvjlnduW3WA';

export const TRIP_STEPS: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}[] = [
  { icon: 'location-on', label: 'Đến điểm đón' },
  { icon: 'vpn-key', label: 'Bắt đầu chuyến' },
  { icon: 'verified', label: 'Đến nơi an toàn' },
];

export const STEP_COPY = [
  {
    label: 'Tôi đã đến điểm đón',
    icon: 'check-circle' as const,
    helper: 'Chạm để xác nhận đã tiếp cận xe khách',
  },
  {
    label: 'Bắt đầu chuyến đi',
    icon: 'play-arrow' as const,
    helper: 'Đã nhận bàn giao chìa khóa & kiểm tra xe',
  },
  {
    label: 'Đến nơi an toàn (Hoàn thành)',
    icon: 'verified-user' as const,
    helper: 'Chạm để xuất hóa đơn & nhận thanh toán',
  },
];

export function MapToolButton({
  accessibilityLabel,
  active = false,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  active?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.mapToolButton, active && styles.mapToolButtonActive]}
    >
      <MaterialIcons
        color={active ? colors.primary : colors.onSurface}
        name={icon}
        size={fontSize.iconXl}
      />
    </Pressable>
  );
}

export function StageProgress({
  activeStep,
  completed,
}: {
  activeStep: number;
  completed: boolean;
}) {
  return (
    <View accessibilityRole="progressbar" style={styles.stageProgress}>
      {TRIP_STEPS.map((step, index) => {
        const done = completed || index < activeStep;
        const active = !completed && index === activeStep;
        const stepColor = done
          ? colors.success
          : active
            ? colors.primary
            : colors.onSurfaceVariant;

        return (
          <View key={step.label} style={styles.stageStepWrap}>
            {index > 0 ? (
              <View
                style={[
                  styles.stageConnector,
                  (done || active) && styles.stageConnectorActive,
                ]}
              />
            ) : null}
            <View style={styles.stageStep}>
              <View
                style={[
                  styles.stageIconCircle,
                  done && styles.stageIconDone,
                  active && styles.stageIconActive,
                  !done && !active && styles.stageIconInactive,
                ]}
              >
                <MaterialIcons
                  color={done || active ? colors.onPrimary : colors.onSurfaceVariant}
                  name={done ? 'check' : step.icon}
                  size={fontSize.iconMd}
                />
              </View>
              <Text
                numberOfLines={2}
                style={[styles.stageLabel, { color: stepColor }, active && styles.stageLabelActive]}
              >
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    zIndex: 3,
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
  },
  tripHud: {
    minHeight: 52,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.spaceSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
    backgroundColor: colors.inverseSurface,
  },
  tripHudDetails: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  tripIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.px2_5,
    paddingVertical: spacing.py1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHighest60,
  },
  tripIdDot: {
    width: spacing.badgeSm,
    height: spacing.badgeSm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.tertiaryFixedDim,
  },
  tripIdText: {
    ...typography.labelMd,
    color: colors.inverseOnSurface,
    letterSpacing: 0.4,
  },
  tripDistance: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
  },
  tripDistanceText: {
    ...typography.labelLg,
    flexShrink: 1,
    color: colors.inverseOnSurface,
    letterSpacing: -0.3,
  },
  sosButton: {
    minWidth: 68,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.spaceSm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
  sosText: {
    ...typography.labelMd,
    color: colors.onError,
  },
  directionBar: {
    minHeight: 84,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.spaceSm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  turnIconBox: {
    width: spacing.shortcutIcon + spacing.spaceSm,
    height: spacing.shortcutIcon + spacing.spaceSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryContainer,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  directionCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  directionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1_5,
  },
  directionDistance: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  laneBadge: {
    paddingHorizontal: spacing.gap1,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  laneText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  directionSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  voiceButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
  },
  mapViewport: {
    height: spacing.mapHeight,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
  },
  mapImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  mapTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(248, 249, 255, 0.12)',
  },
  trafficBadge: {
    position: 'absolute',
    top: spacing.spaceSm,
    left: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.gap1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest95,
  },
  trafficDot: {
    width: spacing.badgeSm,
    height: spacing.badgeSm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
  },
  trafficBadgeText: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
  mapTools: {
    position: 'absolute',
    top: spacing.gutter,
    right: spacing.gutter,
    gap: spacing.spaceSm,
  },
  mapToolButton: {
    width: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapToolButtonActive: {
    backgroundColor: colors.primaryFixed,
  },
  driverMarker: {
    position: 'absolute',
    top: '43%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  markerHalo: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary15,
  },
  markerCore: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 4,
  },
  speedBadge: {
    marginTop: spacing.spaceSm,
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.inverseSurface80,
  },
  speedText: {
    ...typography.labelMd,
    color: colors.inverseOnSurface,
  },
  mapNotice: {
    position: 'absolute',
    bottom: spacing.spaceSm,
    left: spacing.gutter,
    maxWidth: '70%',
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.gap1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest90,
  },
  mapNoticeText: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
  bottomSheet: {
    marginTop: -spacing.spaceSm,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.spaceMd,
    gap: spacing.spaceSm,
    zIndex: 1,
  },
  vehicleCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    padding: spacing.spaceSm,
  },
  vehicleIconBox: {
    width: spacing.shortcutIcon,
    height: spacing.shortcutIcon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  vehicleCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
  },
  vehicleName: {
    ...typography.headlineSm,
    flexShrink: 1,
    color: colors.onSurface,
  },
  transmissionBadge: {
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.secondaryContainer,
  },
  transmissionText: {
    ...typography.labelSm,
    color: colors.onSecondaryFixed,
  },
  licensePlate: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: fontSize.labelLg,
  },
  reportButton: {
    minWidth: 64,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.spaceSm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  reportButtonText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  reportThumbnail: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
  },
  customerCard: {
    padding: spacing.spaceMd,
    gap: spacing.spaceSm,
  },
  customerHeader: {
    minHeight: spacing.avatarLg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  customerAvatar: {
    width: spacing.avatarLg,
    height: spacing.avatarLg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  customerStatusDot: {
    position: 'absolute',
    left: spacing.avatarLg - 13,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
    backgroundColor: colors.success,
  },
  customerIdentity: {
    flex: 1,
    minWidth: 0,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1,
  },
  customerName: {
    ...typography.headlineSm,
    flexShrink: 1,
    color: colors.onSurface,
  },
  customerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  customerRatingText: {
    ...typography.labelSm,
    color: colors.success,
  },
  customerSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  customerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  callCustomerButton: {
    minHeight: spacing.iconButtonSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1,
    paddingHorizontal: spacing.spaceSm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  callCustomerText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  chatButton: {
    width: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  checkpointsCard: {
    minHeight: 106,
    flexDirection: 'row',
    gap: spacing.spaceSm,
    padding: spacing.spaceSm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  checkpointRail: {
    width: spacing.spaceSm,
    alignItems: 'center',
    paddingTop: spacing.gap1,
  },
  checkpointDot: {
    width: spacing.badgeMd,
    height: spacing.badgeMd,
    borderRadius: borderRadius.full,
  },
  pickupDot: {
    backgroundColor: colors.success,
  },
  destinationDot: {
    backgroundColor: colors.error,
  },
  checkpointLine: {
    width: 2,
    height: 32,
    marginVertical: spacing.xxs,
    backgroundColor: colors.outlineVariant,
  },
  checkpointsCopy: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  checkpointItem: {
    minWidth: 0,
    gap: spacing.xxs,
  },
  pickupLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  destinationLabel: {
    ...typography.labelSm,
    color: colors.error,
    letterSpacing: 0.5,
  },
  checkpointAddress: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  destinationAddress: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: '600',
  },
  stageCard: {
    padding: spacing.spaceMd,
    gap: spacing.spaceMd,
  },
  stageProgress: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
  },
  stageStepWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stageStep: {
    width: 88,
    alignItems: 'center',
    gap: spacing.gap1,
  },
  stageIconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  stageIconActive: {
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.primaryFixed,
  },
  stageIconDone: {
    backgroundColor: colors.success,
  },
  stageIconInactive: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  stageLabel: {
    ...typography.labelSm,
    textAlign: 'center',
    fontSize: fontSize.labelSm,
    lineHeight: 14,
  },
  stageLabelActive: {
    ...typography.labelMd,
  },
  stageConnector: {
    flex: 1,
    height: 2,
    marginTop: spacing.spaceMd,
    backgroundColor: colors.outlineVariant,
  },
  stageConnectorActive: {
    backgroundColor: colors.success,
  },
  stageActionButton: {
    height: spacing.ctaHeight + spacing.spaceXs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryContainer,
    shadowOpacity: 0.14,
  },
  stageFinalButton: {
    backgroundColor: colors.tertiaryContainer,
  },
  stageCompletedButton: {
    backgroundColor: colors.success,
  },
  stageActionText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
  },
  inspectionLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceXs,
  },
  inspectionLinkText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  stageHelper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1,
  },
  stageHelperText: {
    ...typography.bodyMd,
    flexShrink: 1,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
