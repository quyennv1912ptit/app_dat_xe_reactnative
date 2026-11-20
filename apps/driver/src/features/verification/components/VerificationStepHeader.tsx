import { StyleSheet, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from '@datxe/ui';
import { shortSlotLabels, visibleMilestone, type FlowStage } from '../verificationLabels';
import { slots, type SlotKey } from '../workflow';

/** Flat progress strip kept out of nested cards so drivers see where they are at a glance. */
export function VerificationStepHeader({
  stage,
  step,
  hasPhoto,
}: {
  stage: FlowStage;
  step: number;
  hasPhoto: (key: SlotKey) => boolean;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const milestone = visibleMilestone(stage, step);

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <Text style={[styles.stepText, { color: colors.primary }]} accessibilityRole="header">
          {milestone.label}
        </Text>
      </View>
      <ProgressBar
        progress={milestone.progress}
        color={colors.primary}
        style={[styles.bar, { backgroundColor: colors.surfaceContainerHigh }]}
      />
      {stage === 'CAPTURE' ? (
        <View style={styles.slotStrip} accessibilityLabel="Tiến độ chụp 5 ảnh giấy tờ">
          {slots.map(([key], idx) => {
            const done = hasPhoto(key);
            const active = idx === step;
            const bg = active
              ? colors.primaryContainer
              : done
                ? colors.successContainer
                : colors.surfaceContainerHigh;
            const fg = active
              ? colors.onPrimaryContainer
              : done
                ? colors.onSuccessContainer
                : colors.onSurfaceVariant;
            const stateLabel = active ? 'Đang chụp' : done ? 'Đã chụp' : 'Chưa chụp';
            return (
              <View
                key={key}
                accessible
                accessibilityLabel={`${shortSlotLabels[key]}: ${stateLabel}`}
                style={[styles.slotPill, { backgroundColor: bg }]}
              >
                {done && !active ? (
                  <MaterialIcons name="check" size={14} color={fg} importantForAccessibility="no" />
                ) : null}
                <Text style={[styles.slotText, { color: fg }]}>{shortSlotLabels[key]}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.spaceMd,
      paddingTop: spacing.spaceXs,
      paddingBottom: spacing.spaceSm,
      gap: spacing.spaceSm,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.spaceSm,
    },
    stepText: {
      ...typography.label,
      flex: 1,
    },
    bar: {
      height: 6,
      borderRadius: borderRadius.full,
    },
    slotStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.spaceXs,
    },
    slotPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.spaceSm,
      paddingVertical: spacing.xxs + 2,
      minHeight: 36,
      borderRadius: borderRadius.full,
    },
    slotText: {
      ...typography.caption,
    },
    dimmed: {
      opacity: 0.45,
    },
  });
