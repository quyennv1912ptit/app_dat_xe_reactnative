import { driverWarningMessage, groupVerificationWarnings } from '../warningPresentation';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DriverPhoto } from '@/components/DriverPhoto';
import {
  Button,
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import type { VerificationWarning } from '../api';
import { shortSlotLabels } from '../verificationLabels';

type AlertTone = 'info' | 'warning' | 'error' | 'success';

/** Flat tonal notice banner pairing an icon with clear, wrapping Vietnamese guidance. */
export function AlertBanner({
  tone,
  icon,
  message,
  live = false,
  role,
}: {
  tone: AlertTone;
  icon: keyof typeof MaterialIcons.glyphMap;
  message: string;
  live?: boolean;
  role?: 'alert';
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const bg = tone === 'error'
    ? colors.errorContainer
    : tone === 'warning'
      ? colors.warningContainer
      : tone === 'success'
        ? colors.successContainer
        : colors.surfaceContainerHigh;
  const fg = tone === 'error'
    ? colors.onErrorContainer
    : tone === 'warning'
      ? colors.onWarningContainer
      : tone === 'success'
        ? colors.onSuccessContainer
        : colors.onSurface;

  return (
    <View
      style={[styles.alertBox, { backgroundColor: bg }]}
      accessibilityRole={role}
      accessibilityLiveRegion={live ? 'polite' : undefined}
    >
      <MaterialIcons name={icon} size={20} color={fg} importantForAccessibility="no" />
      <Text style={[styles.alertText, { color: fg }]}>{message}</Text>
    </View>
  );
}

/** Renders server-issued verification warnings using consistent warning/error tonal containers. */
export function WarningBannerList({ items }: { items: readonly VerificationWarning[] }) {
  if (!items.length) return null;
  return (
    <>
      {groupVerificationWarnings(items).map(({ key, warning, slots }) => {
        const context = slots.map(slot => shortSlotLabels[slot as keyof typeof shortSlotLabels] ?? slot).join(', ');
        const severe = warning.blocksSubmission || warning.severity === 'CRITICAL' || warning.severity === 'BLOCKING';
        const info = warning.severity === 'INFO';
        return (
          <AlertBanner
            key={key}
            tone={severe ? 'error' : info ? 'info' : 'warning'}
            icon={severe ? 'error-outline' : info ? 'info-outline' : 'warning-amber'}
            role={severe ? 'alert' : undefined}
            message={context ? `${context} · ${driverWarningMessage(warning)}` : driverWarningMessage(warning)}
          />
        );
      })}
    </>
  );
}

/** Renders an image capture if present locally/decrypted, or a clean tap-to-load/capture placeholder. */
export function SlotPhotoFrame({
  uri,
  label,
  hasSavedCapture,
  isSelfie = false,
  large = false,
  tile = false,
  busy = false,
  interactive = false,
  onLoadSaved,
}: {
  uri?: string;
  label: string;
  hasSavedCapture: boolean;
  isSelfie?: boolean;
  large?: boolean;
  tile?: boolean;
  busy?: boolean;
  interactive?: boolean;
  onLoadSaved?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const colors = useThemeColors();
  if (uri) return <DriverPhoto uri={uri} label={label} portrait={large && !tile} tile={tile} showCaption={false} sensitive />;
  return (
    <View style={[styles.frame, large && styles.frameLarge, isSelfie && styles.selfieFrame]}>
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: !hasSavedCapture && interactive
              ? colors.primaryContainer
              : colors.surfaceContainer,
          },
        ]}
      >
        <MaterialIcons
          name={hasSavedCapture ? 'cloud-done' : isSelfie ? 'face' : 'add-a-photo'}
          size={24}
          color={!hasSavedCapture && interactive ? colors.onPrimaryContainer : colors.onSurfaceVariant}
          importantForAccessibility="no"
        />
      </View>
      <Text style={[styles.mutedText, !hasSavedCapture && interactive && { color: colors.onSurface }]}>
        {hasSavedCapture ? 'Ảnh đã lưu trên máy chủ' : interactive ? 'Chạm để mở camera' : 'Chưa có ảnh'}
      </Text>
      {hasSavedCapture && onLoadSaved ? (
        <Button
          variant="secondary"
          label="Xem ảnh đã lưu"
          disabled={busy}
          onPress={onLoadSaved}
        />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    alertBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.spaceSm,
      padding: spacing.px3,
      borderRadius: spacing.spaceMd,
    },
    alertText: {
      ...typography.label,
      flex: 1,
    },
    frame: {
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: spacing.spaceMd,
      minHeight: 140,
      padding: spacing.px3,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.spaceSm,
      overflow: 'hidden',
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frameLarge: {
      width: 210,
      maxWidth: '100%',
      aspectRatio: 3 / 4,
      alignSelf: 'center',
    },
    selfieFrame: {
      borderRadius: borderRadius.sheet,
    },
    mutedText: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
