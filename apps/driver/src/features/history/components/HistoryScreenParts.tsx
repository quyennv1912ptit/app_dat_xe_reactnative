import { Card,borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
Image,
Pressable,
StyleSheet,
Text,
View
} from 'react-native';
export type HistoryFilter = 'all' | 'today' | 'week' | 'completed';

export type TripRecord = {
  id: string;
  vehicle: string;
  vehicleType: string;
  date: string;
  earning: string;
  pickup: string;
  dropoff: string;
  note: string;
  rating?: string;
  distance?: string;
  today?: boolean;
  week?: boolean;
  photos?: string[];
};

export const INSPECTION_PHOTOS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDD7lk3DiK_OkrQUawD-0AhWtzEH2CEBZ5u0LvF',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5JqxTNWxKhzymzl-azC7vZfcNs_wR7v2qyOQj',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuATIsRo3MDpCnztRudg1st9jrQ4rFpIJj0IzpTa',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA6VqIpkXfwiF5EywottFV_5jnl1Oy9UYrlJJxs',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ2e2FvvvhbFHcxk1hHPaqbms6y0PCOFLlUCJn',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDhDKT0bKvElpcDOlEFEksxD_XybFQcDKEQBuUA',
];

export const TRIPS: TripRecord[] = [
  {
    id: 'DX-8892',
    vehicle: 'Mazda CX-5',
    vehicleType: 'AT',
    date: 'Hôm nay, 23:15',
    earning: '+210.000₫',
    pickup: 'Quán bia Thu Hằng (54 Liễu Giai)',
    dropoff: 'Vinhomes Times City, Minh Khai',
    note: 'Biên bản nhận xe 6 góc đã lưu',
    today: true,
    week: true,
    photos: INSPECTION_PHOTOS,
  },
  {
    id: 'DX-8891',
    vehicle: 'Toyota Camry',
    vehicleType: 'Sedan',
    date: 'Hôm qua, 21:30',
    earning: '+240.000₫',
    pickup: 'Khu ẩm thực Sen Tây Hồ, Lạc Long Quân',
    dropoff: 'Vinhomes Royal City, Nguyễn Trãi',
    note: 'Khách hàng đánh giá: 5.0 ★',
    rating: '5.0 ★',
    week: true,
  },
  {
    id: 'DX-8874',
    vehicle: 'Hyundai SantaFe',
    vehicleType: '7 chỗ',
    date: '16/10, 22:00',
    earning: '+180.000₫',
    pickup: 'Quận Cầu Giấy (Trần Thái Tông)',
    dropoff: 'KĐT Ecopark Hưng Yên, Rừng Cọ',
    note: 'Cự ly: 21.4 km',
    distance: '21.4 km',
  },
];

export const FILTERS: { id: HistoryFilter; label: string; icon?: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'all', label: 'Tất cả', icon: 'tune' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'completed', label: 'Đã hoàn thành', icon: 'check-circle-outline' },
];

export const TABS = [
  { label: 'Trang chủ', icon: 'home', route: '/(tabs)/home' },
  { label: 'Lịch sử', icon: 'history', route: '/(tabs)/history' },
  { label: 'Thông báo', icon: 'notifications-none', route: '/(tabs)/notifications' },
  { label: 'Hồ sơ', icon: 'account-circle', route: '/(tabs)/profile' },
] as const;

export const INSPECTION_LABELS = [
  'Đầu xe chính diện',
  'Đuôi xe & biển số',
  'Thân xe bên lái',
  'Thân xe bên phụ',
  'Nội thất & Taplo',
  'Khoang hành lý',
];

export function TripCard({
  trip,
  onOpenInspection,
  onOpenDetails,
}: {
  trip: TripRecord;
  onOpenInspection: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <Card style={styles.tripCard} variant="surface">
      <View style={styles.tripTop}>
        <View style={styles.carIcon}>
          <MaterialIcons color={colors.onSurface} name="directions-car" size={fontSize.iconLg} />
        </View>
        <View style={styles.tripIdentity}>
          <View style={styles.vehicleLine}>
            <Text style={styles.vehicleName}>{trip.vehicle}</Text>
            <Text style={styles.vehicleType}>{trip.vehicleType}</Text>
          </View>
          <Text style={styles.metaText}>{trip.date}</Text>
        </View>
        <View style={styles.tripEarningBlock}>
          <Text style={styles.tripEarning}>{trip.earning}</Text>
          <Text style={styles.completedTag}>✓ Đã hoàn thành</Text>
        </View>
      </View>

      <View style={styles.routeBox}>
        <View style={styles.routeMarkerColumn}>
          <View style={styles.pickupDot} />
          <View style={styles.routeLine} />
          <MaterialIcons color={colors.error} name="location-on" size={fontSize.iconSm} />
        </View>
        <View style={styles.routeCopy}>
          <Text style={styles.routeCaption}>Điểm đón</Text>
          <Text style={styles.routeAddress}>{trip.pickup}</Text>
          <Text style={[styles.routeCaption, styles.dropCaption]}>Điểm trả</Text>
          <Text style={styles.routeAddress}>{trip.dropoff}</Text>
        </View>
      </View>

      {trip.photos ? (
        <>
          <Pressable accessibilityRole="button" onPress={onOpenInspection} style={styles.inspectionSummary}>
            <View style={styles.thumbnailStack}>
              {trip.photos.slice(0, 3).map((uri, index) => (
                <Image key={uri} source={{ uri }} style={[styles.thumbnail, { marginLeft: index === 0 ? 0 : -10 }]} />
              ))}
            </View>
            <Text style={styles.inspectionText}>{trip.note}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenInspection} style={styles.inspectionButton}>
            <MaterialIcons color={colors.primary} name="view-quilt" size={fontSize.iconLg} />
            <Text style={styles.inspectionButtonText}>Xem chi tiết biên bản 6 góc</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.tripFooter}>
          <View style={styles.tripNote}>
            <MaterialIcons
              color={trip.rating ? colors.success : colors.secondary}
              name={trip.rating ? 'verified-user' : 'route'}
              size={fontSize.iconSm}
            />
            <Text style={styles.tripNoteText}>{trip.note}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onOpenDetails} style={styles.detailsButton}>
            <Text style={styles.detailsText}>Chi tiết cuốc</Text>
            <MaterialIcons color={colors.primary} name="chevron-right" size={fontSize.iconLg} />
          </Pressable>
        </View>
      )}
    </Card>
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
  scrollContent: { paddingHorizontal: spacing.gutter, paddingTop: spacing.spaceMd, gap: spacing.spaceMd },
  filterRow: { gap: spacing.spaceSm, paddingBottom: spacing.spaceXs },
  filterChip: { minHeight: 36, paddingHorizontal: spacing.spaceMd, borderRadius: borderRadius.full, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceXs },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  filterTextActive: { color: colors.onPrimary },
  performanceCard: { padding: spacing.spaceMd, gap: spacing.spaceMd, backgroundColor: '#FFFFFF' },
  performanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.spaceSm },
  performanceTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  performanceIcon: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  performanceLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, letterSpacing: 0.4 },
  goalTag: { ...typography.labelSm, color: colors.onSuccessContainer, backgroundColor: colors.successContainer, overflow: 'hidden', paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.spaceXs, borderRadius: borderRadius.full },
  performanceBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  totalEarnings: { ...typography.headlineXl, color: colors.onSurface },
  metaText: { ...typography.bodyMd, color: colors.secondary },
  tripCount: { alignItems: 'flex-end' },
  tripCountValue: { ...typography.headlineMd, color: colors.primary },
  tripCountLabel: { ...typography.bodyMd, color: colors.onSurface },
  safetyRate: { ...typography.bodyMd, color: colors.successStrong },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.spaceXs },
  sectionHeading: { ...typography.labelLg, color: colors.onSurfaceVariant, letterSpacing: 0.6 },
  tripCard: { padding: spacing.spaceMd, gap: spacing.spaceMd },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  carIcon: { width: 48, height: 48, borderRadius: borderRadius.full, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  tripIdentity: { flex: 1, gap: spacing.spaceXs },
  vehicleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.spaceXs },
  vehicleName: { ...typography.headlineSm, color: colors.onSurface },
  vehicleType: { ...typography.labelSm, color: colors.onSurfaceVariant, backgroundColor: colors.secondaryFixed, paddingHorizontal: spacing.spaceXs, paddingVertical: 2, borderRadius: borderRadius.default },
  tripEarningBlock: { alignItems: 'flex-end', gap: spacing.spaceXs },
  tripEarning: { ...typography.labelLg, color: colors.primary },
  completedTag: { ...typography.labelSm, color: colors.onSuccessContainer, backgroundColor: colors.successContainer, paddingHorizontal: spacing.spaceSm, paddingVertical: spacing.spaceXs, borderRadius: borderRadius.full, overflow: 'hidden' },
  routeBox: { backgroundColor: colors.primarySoft, borderRadius: borderRadius.lg, padding: spacing.spaceSm, flexDirection: 'row', gap: spacing.spaceSm },
  routeMarkerColumn: { alignItems: 'center', paddingTop: spacing.spaceXs },
  pickupDot: { width: 12, height: 12, borderRadius: borderRadius.full, backgroundColor: colors.successStrong },
  routeLine: { width: 2, height: 26, backgroundColor: colors.outlineVariant },
  routeCopy: { flex: 1 },
  routeCaption: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  routeAddress: { ...typography.bodyLg, color: colors.onSurface },
  dropCaption: { marginTop: spacing.spaceXs },
  inspectionSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  thumbnailStack: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 38, height: 38, borderRadius: borderRadius.full, borderWidth: 2, borderColor: colors.surfaceContainerLowest },
  inspectionText: { ...typography.bodyMd, color: colors.secondary, flex: 1 },
  inspectionButton: { minHeight: 52, borderRadius: borderRadius.lg, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.spaceSm },
  inspectionButtonText: { ...typography.labelLg, color: colors.primary },
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  tripNote: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.spaceXs },
  tripNoteText: { ...typography.bodyMd, color: colors.onSurfaceVariant, flexShrink: 1 },
  detailsButton: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { ...typography.labelMd, color: colors.primary },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: spacing.tabBarHeight, paddingTop: spacing.spaceSm, backgroundColor: colors.surfaceContainerLowest, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceContainerHigh, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { ...typography.labelSm, color: colors.onSurfaceVariant },
  tabLabelActive: { ...typography.labelMd, color: colors.primary },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' },
  modalSheet: { maxHeight: '88%', backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.spaceMd, gap: spacing.spaceMd },
  modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { ...typography.headlineSm, color: colors.onSurface },
  modalSubtitle: { ...typography.bodyMd, color: colors.secondary },
  closeButton: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.spaceSm },
  modalPhotoCard: { width: '48.5%', gap: spacing.spaceXs },
  modalPhoto: { width: '100%', aspectRatio: 4 / 3, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainer },
  modalPhotoLabel: { ...typography.labelMd, color: colors.onSurface },
  signedNotice: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, padding: spacing.spaceMd, borderRadius: borderRadius.lg, backgroundColor: colors.successContainer },
  signedTitle: { ...typography.labelLg, color: colors.success },
});
