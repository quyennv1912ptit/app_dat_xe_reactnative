import { borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
Pressable,
StyleSheet,
Text,
View
} from 'react-native';
export const DRIVER_PORTRAIT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC_JFvcgdQRnuuUfFZFp185ICuisjd2hwf9LThHhDdGnK-KtK_yjTm36H8xstQOXTg-uvGgavzZhEnHxNkLcvl23Y1FWB3kI6lHlPbzC7sf0-qOjnPGSkdl4GE24Au2bAy5UPYXJXE_XkOMfamNPbo8at1e65brMzTopvXZ6v784k2gOhNjfqO5s6zNB7Bq-5dMaDPsM-MGXF5eZeLxeIgEZgvhcychBCUZ9diTRcouNO0V0mQCAofqwQ';

export const TABS = [
  { label: 'Trang chủ', icon: 'home', route: '/(tabs)/home' },
  { label: 'Lịch sử', icon: 'history', route: '/(tabs)/history' },
  { label: 'Thông báo', icon: 'notifications-none', route: '/(tabs)/notifications' },
  { label: 'Hồ sơ', icon: 'account-circle', route: '/(tabs)/profile' },
] as const;

export function MetricCard({
  icon,
  label,
  value,
  status,
  tint,
  progress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  status: string;
  tint: string;
  progress: number;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text numberOfLines={1} style={styles.metricLabel}>{label}</Text>
        <MaterialIcons color={tint} name={icon} size={fontSize.iconMd} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { backgroundColor: tint, width: progress * 100 + '%' }]} />
      </View>
      <Text numberOfLines={1} style={[styles.metricStatus, { color: tint }]}>{status}</Text>
    </View>
  );
}

export function SettingRow({
  icon,
  title,
  detail,
  detailTone,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail: string;
  detailTone?: 'success';
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <MaterialIcons color={colors.primary} name={icon} size={fontSize.iconLg} />
      </View>
      <View style={styles.settingCopy}>
        <Text numberOfLines={1} style={styles.settingTitle}>{title}</Text>
        <Text numberOfLines={1} style={[styles.settingDetail, detailTone === 'success' && styles.settingSuccess]}>{detail}</Text>
      </View>
      <MaterialIcons color={colors.outline} name="chevron-right" size={fontSize.iconLg} />
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { minHeight: spacing.headerHeight, paddingHorizontal: spacing.gutter, paddingBottom: spacing.spaceSm, backgroundColor: colors.driverHeader, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  liveDot: { width: 12, height: 12, borderRadius: borderRadius.full, backgroundColor: colors.successContainer },
  headerTitle: { ...typography.headlineSm, color: colors.onPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  headerIcon: { width: spacing.iconButtonMd, height: spacing.iconButtonMd, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: spacing.avatarLg, height: spacing.avatarLg, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.gutter, gap: spacing.spaceMd },
  identityCard: { padding: spacing.spaceMd, borderRadius: borderRadius.xl, backgroundColor: colors.surfaceContainerLowest, shadowColor: colors.onSurface, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2, gap: spacing.spaceMd },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.spaceMd },
  portraitWrap: { position: 'relative' },
  portrait: { width: 76, height: 76, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer },
  verifiedBadge: { position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: borderRadius.full, backgroundColor: colors.successContainer, borderWidth: 2, borderColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
  identityInfo: { flex: 1, gap: spacing.spaceXs },
  driverName: { ...typography.headlineMd, color: colors.onSurface },
  tierBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs, backgroundColor: colors.primaryFixed, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.spaceXs, borderRadius: borderRadius.full },
  tierText: { ...typography.labelSm, color: colors.onPrimaryFixed },
  proofRow: { flexDirection: 'row' },
  proofBadge: { ...typography.labelMd, color: colors.onSurface, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.spaceXs, borderRadius: borderRadius.default, overflow: 'hidden' },
  proofSub: { ...typography.bodyMd, color: colors.secondary },
  star: { color: '#F59E0B' },
  greenDotText: { color: colors.success },
  safetyBanner: { minHeight: 64, padding: spacing.spaceSm, borderRadius: borderRadius.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  safetyIcon: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.successContainer, alignItems: 'center', justifyContent: 'center' },
  safetyCopy: { flex: 1 },
  safetyTitle: { ...typography.labelMd, color: colors.onSurface },
  safetySub: { ...typography.bodyMd, color: colors.secondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.labelLg, color: colors.onSurface },
  detailLink: { ...typography.bodyMd, color: colors.primary },
  metricsRow: { flexDirection: 'row', gap: spacing.spaceSm },
  metricCard: { flex: 1, minHeight: 142, padding: spacing.spaceSm, borderRadius: borderRadius.xl, backgroundColor: colors.surfaceContainerLowest, justifyContent: 'space-between', gap: spacing.spaceSm },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceXs },
  metricLabel: { ...typography.labelSm, color: colors.onSurfaceVariant, flex: 1 },
  metricValue: { ...typography.headlineMd, color: colors.onSurface },
  metricTrack: { height: 7, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer, overflow: 'hidden' },
  metricFill: { height: '100%', borderRadius: borderRadius.full },
  metricStatus: { ...typography.labelSm },
  walletBanner: { minHeight: 140, padding: spacing.spaceMd, borderRadius: borderRadius.xl, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm, overflow: 'hidden' },
  walletCopy: { flex: 1 },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs },
  walletLabel: { ...typography.labelMd, color: colors.onPrimary },
  walletAmount: { ...typography.headlineXlMobile, color: colors.onPrimary, marginTop: spacing.spaceXs },
  walletSub: { ...typography.bodyMd, color: colors.onPrimaryContainer, marginTop: spacing.spaceXs },
  withdrawButton: { minHeight: 44, paddingHorizontal: spacing.spaceMd, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerLowest, flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs },
  withdrawText: { ...typography.labelMd, color: colors.primary },
  settingsHeading: { ...typography.labelLg, color: colors.onSurface, marginBottom: -spacing.spaceSm },
  settingsCard: { paddingHorizontal: spacing.spaceMd, borderRadius: borderRadius.xl, backgroundColor: colors.surfaceContainerLowest },
  settingRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceContainerHigh },
  settingIcon: { width: 44, height: 44, borderRadius: borderRadius.full, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  autoIcon: { backgroundColor: colors.primarySoft },
  emergencyIcon: { backgroundColor: colors.errorContainer },
  settingCopy: { flex: 1, gap: spacing.spaceXs },
  settingTitle: { ...typography.bodyLg, color: colors.onSurface },
  settingDetail: { ...typography.bodyMd, color: colors.secondary },
  settingSuccess: { color: colors.success },
  emergencyText: { color: colors.error },
  toggleTrack: { width: 48, height: 28, padding: 3, borderRadius: borderRadius.full, backgroundColor: colors.outlineVariant, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: colors.primary, alignItems: 'flex-end' },
  toggleThumb: { width: 22, height: 22, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLowest },
  toggleThumbActive: { backgroundColor: colors.onPrimary },
  logoutButton: { minHeight: 56, borderRadius: borderRadius.xl, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceSm },
  logoutText: { ...typography.labelLg, color: colors.error },
  versionText: { ...typography.bodyMd, color: colors.outline, textAlign: 'center' },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: spacing.tabBarHeight, paddingTop: spacing.spaceSm, backgroundColor: colors.surfaceContainerLowest, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceContainerHigh, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  tabLabelActive: { ...typography.labelMd, color: colors.primary },
});
