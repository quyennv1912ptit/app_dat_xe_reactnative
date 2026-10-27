import { Card,borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet,Text } from 'react-native';
export const FARE_ROWS = [
  { label: 'Tổng cước khách trả', amount: '250.000₫', color: colors.onSurface },
  { label: 'Phí nền tảng DriveMate (15%)', amount: '-37.500₫', color: colors.error },
  { label: 'Thưởng chuyến đêm  +Đêm', amount: '+15.000₫', color: colors.success },
  { label: 'Bảo hiểm chuyến đi', amount: '0₫', color: colors.success, detail: 'Công ty đài thọ 100%' },
];

export function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.statCard} variant="surface">
      <MaterialIcons color={colors.secondary} name={icon} size={fontSize.iconLg} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.statValue}>{value}</Text>
    </Card>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    minHeight: spacing.headerHeight,
    paddingHorizontal: spacing.spaceMd,
    paddingBottom: spacing.spaceSm,
    backgroundColor: colors.driverHeader,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceMd,
  },
  headerTitle: { ...typography.headlineSm, color: colors.onPrimary, flex: 1 },
  backButton: { width: spacing.iconButtonMd, height: spacing.iconButtonMd, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: spacing.avatarMd, height: spacing.avatarMd, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.gutter, gap: spacing.spaceMd },
  summaryCard: { alignItems: 'center', padding: spacing.spaceLg, gap: spacing.spaceSm },
  successCircle: { width: 76, height: 76, borderRadius: borderRadius.full, backgroundColor: colors.successContainer, alignItems: 'center', justifyContent: 'center' },
  tripCompletePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs, paddingHorizontal: spacing.spaceMd, paddingVertical: spacing.spaceXs, borderRadius: borderRadius.full, backgroundColor: colors.secondaryFixed },
  greenDot: { width: 8, height: 8, borderRadius: borderRadius.full, backgroundColor: colors.success },
  tripCompleteText: { ...typography.labelLg, color: colors.onSurface },
  earningsLabel: { ...typography.bodyLg, color: colors.secondary },
  earnings: { color: colors.successStrong, fontSize: 48, lineHeight: 56, fontWeight: '700', letterSpacing: -1.5 },
  currency: { fontSize: 30, lineHeight: 38 },
  paymentBanner: { width: '100%', minHeight: 68, padding: spacing.spaceSm, paddingHorizontal: spacing.spaceMd, borderRadius: borderRadius.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  paymentText: { ...typography.labelLg, color: colors.onSurface, flex: 1, textAlign: 'center' },
  cashTag: { ...typography.labelMd, color: colors.onSuccessContainer, backgroundColor: colors.successContainer, borderRadius: borderRadius.full, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.spaceSm, textAlign: 'center', overflow: 'hidden' },
  reviewCard: { gap: spacing.spaceSm },
  reviewHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  reviewTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, flex: 1 },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface },
  stars: { color: '#F59E0B', fontSize: fontSize.headlineMd, letterSpacing: -2 },
  quoteBox: { borderRadius: borderRadius.lg, backgroundColor: colors.primarySoft, padding: spacing.spaceSm, flexDirection: 'row', gap: spacing.spaceSm },
  quoteTextBox: { flex: 1 },
  quote: { ...typography.bodyLg, color: colors.onSurface, fontStyle: 'italic' },
  quoteSource: { ...typography.bodyMd, color: colors.secondary, marginTop: spacing.spaceXs },
  fareCard: { padding: spacing.spaceMd, gap: spacing.spaceSm },
  fareHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.spaceXs },
  tripId: { ...typography.bodyMd, color: colors.secondary },
  fareRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceMd },
  fareLabelWrap: { flex: 1 },
  fareLabel: { ...typography.bodyMd, color: colors.secondary },
  fareDetail: { ...typography.bodyMd, color: colors.success },
  fareAmount: { ...typography.labelLg },
  walletTotal: { marginHorizontal: -spacing.spaceMd, marginBottom: -spacing.spaceMd, marginTop: spacing.spaceXs, padding: spacing.spaceMd, borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  walletTotalCopy: { flex: 1 },
  walletTotalTitle: { ...typography.labelLg, color: colors.onSurface },
  walletTotalCaption: { ...typography.bodyMd, color: colors.secondary },
  walletTotalAmount: { ...typography.headlineSm, color: colors.successStrong },
  statsRow: { flexDirection: 'row', gap: spacing.spaceSm },
  statCard: { flex: 1, paddingHorizontal: spacing.spaceXs, paddingVertical: spacing.spaceMd, alignItems: 'center', gap: spacing.spaceXs },
  statLabel: { ...typography.bodyMd, color: colors.secondary, textAlign: 'center' },
  statValue: { ...typography.labelLg, color: colors.onSurface, textAlign: 'center' },
  nextButton: { minHeight: 64, marginTop: spacing.spaceXs },
  nextButtonText: { ...typography.headlineSm, color: colors.onPrimary },
  footerText: { ...typography.bodyMd, color: colors.secondary, textAlign: 'center', marginTop: -spacing.spaceSm },
});
