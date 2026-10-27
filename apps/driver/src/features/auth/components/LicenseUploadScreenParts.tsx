import { Card,Input,borderRadius,colors,fontSize,spacing,typography } from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import {
Image,
StyleSheet,
Text,
View
} from 'react-native';
export type LicenseSide = 'front' | 'back';

export type ImageSource = 'camera' | 'library';

export type LicenseTier = 'B2' | 'C' | 'D' | 'E';

export const HEADER_COLOR = colors.driverHeader;

export const LICENSE_TIERS: {
  description: string;
  popular?: boolean;
  value: LicenseTier;
}[] = [
  { value: 'B2', description: 'Số sàn/Tự động', popular: true },
  { value: 'C', description: 'Tải > 3.5T' },
  { value: 'D', description: 'Xe 30 chỗ' },
  { value: 'E', description: 'Xe > 30 chỗ' },
];

export const CAPABILITIES = ['Số tự động (AT)', 'Số sàn (MT)', 'Xe điện (EV)'];

export function UploadCard({
  busy,
  imageUri,
  onPress,
  side,
}: {
  busy: boolean;
  imageUri: string | null;
  onPress: () => void;
  side: LicenseSide;
}) {
  const isFront = side === 'front';
  const title = isFront ? 'Mặt trước GPLX' : 'Mặt sau GPLX';
  const subtitle = isFront ? 'Chụp rõ số & hình' : 'Chụp đủ con dấu';

  return (
    <Card
      accessibilityLabel={`${imageUri ? 'Thay ảnh' : 'Thêm ảnh'} ${title}`}
      onPress={onPress}
      style={styles.uploadCard}
      variant="surface"
    >
      {imageUri ? (
        <>
          <Image
            accessibilityLabel={`Ảnh ${title.toLowerCase()}`}
            resizeMode="cover"
            source={{ uri: imageUri }}
            style={styles.uploadPreview}
          />
          <View pointerEvents="none" style={styles.previewScrim} />
          <View style={styles.previewFooter}>
            <View style={styles.uploadedBadge}>
              <MaterialIcons
                color={colors.success}
                name="check-circle"
                size={fontSize.iconSm}
              />
              <Text style={styles.uploadedText}>Đã tải</Text>
            </View>
            <MaterialIcons
              color={colors.onPrimary}
              name="cached"
              size={fontSize.iconMd}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.uploadIcon}>
            {busy ? (
              <MaterialIcons
                color={colors.primary}
                name="hourglass-top"
                size={fontSize.iconXl}
              />
            ) : (
              <MaterialIcons
                color={colors.primary}
                name="photo-camera"
                size={fontSize.iconXl}
              />
            )}
          </View>
          <Text style={styles.uploadTitle}>{title}</Text>
          <Text style={styles.uploadSubtitle}>{subtitle}</Text>
        </>
      )}
    </Card>
  );
}

export function DateField({
  icon,
  label,
  onChangeText,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.dateField}>
      <Input
        accessibilityLabel={label}
        keyboardType="numbers-and-punctuation"
        label={label}
        maxLength={10}
        onChangeText={onChangeText}
        placeholder="DD/MM/YYYY"
        style={styles.dateInput}
        inputStyle={styles.dateInputText}
        value={value}
      />
      <View pointerEvents="none" style={styles.dateIcon}>
        <MaterialIcons color={colors.secondary} name={icon} size={fontSize.iconMd} />
      </View>
    </View>
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
  contextCard: {
    padding: spacing.spaceMd,
    backgroundColor: colors.primaryFixed,
  },
  contextContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.spaceSm,
  },
  contextIcon: {
    width: spacing.avatarMd,
    height: spacing.avatarMd,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary10,
  },
  contextCopy: {
    flex: 1,
    minWidth: 0,
  },
  contextTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  contextDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
  },
  form: {
    gap: spacing.spaceLg,
  },
  uploadSection: {
    gap: spacing.spaceSm,
  },
  sectionHeading: {
    minHeight: spacing.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    flexShrink: 1,
  },
  requiredMark: {
    color: colors.error,
  },
  ocrLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  ocrText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: spacing.spaceSm,
  },
  uploadCard: {
    height: 144,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gap1,
    padding: spacing.spaceSm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
  },
  uploadIcon: {
    width: spacing.uploadIconCircle,
    height: spacing.uploadIconCircle,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary10,
    marginBottom: spacing.xxs,
  },
  uploadTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  uploadSubtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  uploadPreview: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: borderRadius.xl,
  },
  previewScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.scrim60,
  },
  previewFooter: {
    position: 'absolute',
    right: spacing.spaceSm,
    bottom: spacing.spaceSm,
    left: spacing.spaceSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.px1_5,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.scrim60,
  },
  uploadedText: {
    ...typography.labelSm,
    color: colors.onPrimary,
  },
  guidance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    padding: spacing.px2_5,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  guidanceText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  fieldSection: {
    position: 'relative',
    gap: spacing.spaceSm,
  },
  requiredText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  licenseInput: {
    paddingRight: spacing.spaceXl,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  licenseNumberText: {
    ...typography.bodyLg,
    letterSpacing: spacing.letterSpacingWide,
  },
  licenseStatus: {
    position: 'absolute',
    right: spacing.spaceMd,
    bottom: spacing.spaceMd,
  },
  secondaryLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  tierRow: {
    flexDirection: 'row',
    gap: spacing.spaceSm,
    paddingTop: spacing.spaceXs,
  },
  tierOption: {
    minHeight: 72,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.spaceSm,
    borderRadius: borderRadius.xl,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  tierOptionSelected: {
    backgroundColor: colors.primaryContainer,
  },
  tierOptionIdle: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  popularBadge: {
    position: 'absolute',
    top: -spacing.py1,
    right: -spacing.xxs,
    paddingHorizontal: spacing.px1_5,
    paddingVertical: spacing.py0_5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    zIndex: 1,
  },
  popularText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  tierName: {
    ...typography.headlineSm,
    color: colors.onSurface,
    lineHeight: 22,
  },
  tierNameSelected: {
    color: colors.onPrimary,
  },
  tierDescription: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  tierDescriptionSelected: {
    color: colors.onPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.spaceSm,
  },
  dateField: {
    position: 'relative',
    flex: 1,
  },
  dateInput: {
    paddingRight: spacing.spaceXl,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  dateInputText: {
    ...typography.bodyMd,
  },
  dateIcon: {
    position: 'absolute',
    right: spacing.spaceSm,
    bottom: spacing.spaceMd,
  },
  capabilitiesCard: {
    gap: spacing.spaceSm,
    padding: spacing.spaceMd,
  },
  capabilitiesTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  capabilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap1_5,
  },
  capabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.px2_5,
    paddingVertical: spacing.py1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryFixed,
  },
  capabilityText: {
    ...typography.labelSm,
    color: colors.onSecondaryFixed,
  },
  submitSection: {
    gap: spacing.spaceSm,
    paddingTop: spacing.spaceXs,
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
  },
  submitButtonText: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceSm,
    paddingHorizontal: spacing.xxs,
  },
  privacyText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
    textAlign: 'center',
  },
});
