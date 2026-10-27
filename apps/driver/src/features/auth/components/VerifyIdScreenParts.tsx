import { Card,borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
Image,
StyleSheet,
Text,
View
} from 'react-native';
export type PhotoTarget = 'idFront' | 'idBack' | 'selfie';

export type PhotoSource = 'camera' | 'library';

export type PhotoAsset = {
  uri: string;
  sizeLabel: string;
};

export const HEADER_COLOR = colors.driverHeader;

export const INITIAL_PHOTOS: Record<PhotoTarget, PhotoAsset> = {
  idFront: {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxKqUDcs6epZzfK23C1kljO_7TbjOc7mW44rIlO8H12kT_ud4IbFqisg1ycup8X2oYfbFN5JEfntdQ7onisUAv5ndBBL7pmHoFGa3uAOmplDEUqwCIDFLtIYqUwKurHVO1zq5_d1uScQDrNNAMUT73_rW9ufYQRH01lum2Gulck85YSIx76-nAWEYxdKAowESzTTaCQa4lhZqLlPyreArGyQSxMQ2x8FvgFvw9gXLl0fyQ2DvwI4QdUA',
    sizeLabel: '2.4 MB',
  },
  idBack: {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwedxoY0n2SR0wOfRt0et-M3XfdIODCJ4xbQ9GoeWCHuVsi3UppG3lGSAUONBAsAMsJEJVG_OeB6SCkIJtByrqU6FvINdu6IUlA2iUjbFZkJiVmZD23HcZXqE-e9nkaz6lP-ncIxwvYLJSZ-MGT1AjU-5qjLk9na6DOGA3KW3LkoulvY0m4J7nQx0DE_SRy1Lf8SiNfcMAYl3-krfxjEJBM5Ccv_qmo0weXj4DMfRSTEh6LqDjcHdM9w',
    sizeLabel: '1.9 MB',
  },
  selfie: {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO8BnpBHmSHpRkkLeO7YKl26ZWjTXmFwu9kmJPU_quUMzSx9-Pl0atxfLlzmid0c_m3INrB62jeUfL2xdjIn8ehDWn5XV59ZTqLesLZnAHh5tIw4VyUuKz-nNj37M2NtdumtNWdkH78Y35T6t-H8dFqSbMKH2107vL1vgaYWw_S8aFonrQtFpMA9o9otMI_3LPomlL0fbmtvOBOtrf_gUZIm_XqjFbgmW2doh0AQPMIh0X9Oi3LHousQ',
    sizeLabel: '',
  },
};

export const TARGET_DETAILS: Record<PhotoTarget, { aspect: [number, number]; label: string }> = {
  idFront: { aspect: [4, 3], label: 'mặt trước CCCD' },
  idBack: { aspect: [4, 3], label: 'mặt sau CCCD' },
  selfie: { aspect: [1, 1], label: 'chân dung sinh trắc học' },
};

export function DocumentCard({
  image,
  label,
  loading,
  onPress,
  title,
}: {
  image: PhotoAsset;
  label: string;
  loading: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <Card
      accessibilityLabel={`Chọn hoặc thay ảnh ${title}`}
      onPress={onPress}
      style={styles.documentCard}
      variant="surface"
    >
      <View style={styles.documentImageFrame}>
        <Image
          accessibilityLabel={title}
          resizeMode="cover"
          source={{ uri: image.uri }}
          style={styles.documentImage}
        />
        <View pointerEvents="none" style={styles.documentImageScrim} />
        <View style={styles.documentSideBadge}>
          <Text style={styles.documentSideText}>{label}</Text>
        </View>
        <View style={styles.documentCameraButton}>
          <MaterialIcons
            color={colors.onPrimary}
            name={loading ? 'hourglass-top' : 'photo-camera'}
            size={fontSize.icon2xl}
          />
        </View>
      </View>
      <View style={styles.documentCardTitleRow}>
        <Text numberOfLines={1} style={styles.documentCardTitle}>
          {title}
        </Text>
        <View style={styles.refreshIcon}>
          <MaterialIcons
            color={colors.onSecondaryFixed}
            name="refresh"
            size={fontSize.iconMd}
          />
        </View>
      </View>
      <Text style={styles.fileSizeText}>Đã tải lên • {image.sizeLabel}</Text>
    </Card>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: HEADER_COLOR,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    height: spacing.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
  },
  backButton: {
    width: spacing.iconButtonMd,
    height: spacing.iconButtonMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.spaceSm,
  },
  headerTitle: {
    ...typography.headlineSm,
    flex: 1,
    color: colors.onPrimary,
    letterSpacing: -0.4,
  },
  profileIcon: {
    width: spacing.avatarMd,
    height: spacing.avatarMd,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginLeft: spacing.spaceSm,
  },
  scrollContent: {
    gap: spacing.spaceMd,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.spaceMd,
    paddingBottom: spacing.spaceXl,
  },
  progressCard: {
    gap: spacing.spaceSm,
    padding: spacing.spaceMd,
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  progressLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  stepNumber: {
    width: spacing.contextBadge,
    height: spacing.contextBadge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  stepLabel: {
    ...typography.labelMd,
    color: colors.primary,
    letterSpacing: spacing.letterSpacingWide,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  processingBadge: {
    ...typography.labelSm,
    color: colors.success,
    fontWeight: '700',
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
  },
  progressTrack: {
    height: spacing.gap1_5,
    overflow: 'hidden',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
  },
  progressFill: {
    width: '66.6667%',
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  progressDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  identityCard: {
    gap: spacing.spaceMd,
    padding: spacing.spaceMd,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  cardTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    flexShrink: 1,
  },
  identityInput: {
    backgroundColor: colors.surfaceContainerLow,
  },
  inputHint: {
    ...typography.labelSm,
    color: colors.outline,
    textTransform: 'uppercase',
  },
  citizenIdField: {
    position: 'relative',
  },
  citizenIdText: {
    ...typography.bodyLg,
    letterSpacing: spacing.letterSpacingWide,
    paddingRight: spacing.spaceXl,
  },
  validLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  validText: {
    ...typography.labelSm,
    color: colors.success,
  },
  idValidIcon: {
    position: 'absolute',
    right: spacing.spaceMd,
    bottom: spacing.spaceMd,
  },
  documentSection: {
    gap: spacing.spaceSm,
  },
  documentHeading: {
    minHeight: spacing.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  documentTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  requiredText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  documentRow: {
    flexDirection: 'row',
    gap: spacing.spaceSm,
  },
  documentCard: {
    flex: 1,
    gap: spacing.spaceSm,
    padding: spacing.spaceSm,
  },
  documentImageFrame: {
    height: 112,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  documentImageScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.inverseSurface40,
  },
  documentSideBadge: {
    position: 'absolute',
    top: spacing.spaceSm,
    left: spacing.spaceSm,
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  documentSideText: {
    ...typography.labelSm,
    color: colors.onPrimary,
  },
  documentCameraButton: {
    width: spacing.iconButtonLg,
    height: spacing.iconButtonLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  documentCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  documentCardTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    flex: 1,
  },
  refreshIcon: {
    width: spacing.cardActionButton,
    height: spacing.cardActionButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryFixed,
  },
  fileSizeText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  selfieCard: {
    gap: spacing.spaceMd,
    padding: spacing.spaceMd,
  },
  selfieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  selfieTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  matchBadge: {
    ...typography.labelSm,
    color: colors.success,
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
  },
  pendingMatchBadge: {
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerHigh,
  },
  selfieContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceMd,
  },
  selfiePortrait: {
    width: 112,
    height: 112,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  selfieGuide: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    margin: spacing.spaceXs,
  },
  selfieCopy: {
    flex: 1,
    minWidth: 0,
  },
  selfieTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  selfieDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.gap1,
  },
  selfieActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.spaceSm,
    marginTop: spacing.spaceSm,
  },
  retakeButton: {
    height: spacing.buttonMdHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap1_5,
    paddingHorizontal: spacing.spaceMd,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  retakeText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  pendingText: {
    color: colors.onSurfaceVariant,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.spaceSm,
    padding: spacing.spaceMd,
  },
  securityIcon: {
    width: spacing.avatarMd,
    height: spacing.avatarMd,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixed,
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  securityDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
  },
  isoLabel: {
    ...typography.bodyMdMedium,
    color: colors.onSurface,
  },
  submitSection: {
    gap: spacing.spaceSm,
    marginTop: spacing.spaceSm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.spaceSm,
    padding: spacing.spaceSm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary10,
  },
  noticeText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  submitButton: {
    height: spacing.ctaHeight,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
  reviewTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1_5,
    paddingHorizontal: spacing.spaceSm,
  },
  reviewTimeText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
