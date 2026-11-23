import { StyleSheet, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MotionPressable,
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

const flowPhases: { key: string; label: string; stages: FlowStage[] }[] = [
  { key: 'prepare', label: '1. Chuẩn bị', stages: ['PREPARE'] },
  { key: 'capture', label: '2. Chụp ảnh', stages: ['CAPTURE', 'OCR'] },
  { key: 'fields', label: '3. Thông tin', stages: ['CONFIRM_FIELDS'] },
  { key: 'summary', label: '4. Gửi duyệt', stages: ['SUMMARY'] },
];

/** Flat progress strip kept out of nested cards so drivers see where they are at a glance. */
export function VerificationStepHeader({
  stage,
  step,
  hasPhoto,
  onSelectStep,
  disabled = false,
  isSlotAllowed,
}: {
  stage: FlowStage;
  step: number;
  hasPhoto: (key: SlotKey) => boolean;
  onSelectStep?: (index: number) => void;
  disabled?: boolean;
  isSlotAllowed?: (key: SlotKey) => boolean;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const milestone = visibleMilestone(stage, step);
  const doneCount = stage === 'CAPTURE' ? slots.filter(([key]) => hasPhoto(key)).length : 0;
  const activePhaseIndex = Math.max(0, flowPhases.findIndex(p => p.stages.includes(stage)));

  return (
    <View style={styles.root}>
      <View style={styles.phaseTrail} accessibilityLabel="Tiến trình 4 chặng xác minh">
        {flowPhases.map((phase, idx) => {
          const isDone = idx < activePhaseIndex;
          const isActive = idx === activePhaseIndex;
          const bg = isActive
            ? colors.primaryContainer
            : isDone
              ? colors.successContainer
              : colors.surfaceContainerLow;
          const fg = isActive
            ? colors.onPrimaryContainer
            : isDone
              ? colors.onSuccessContainer
              : colors.onSurfaceVariant;
          return (
            <View
              key={phase.key}
              style={[styles.phaseChip, { backgroundColor: bg }]}
              accessibilityLabel={`${phase.label}: ${isActive ? 'Đang thực hiện' : isDone ? 'Đã xong' : 'Tiếp theo'}`}
            >
              {isDone ? (
                <MaterialIcons name="check" size={13} color={fg} importantForAccessibility="no" />
              ) : null}
              <Text style={[styles.phaseText, { color: fg }]}>{phase.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.topRow}>
        <Text style={[styles.stepText, { color: colors.primary }]} accessibilityRole="header">
          {milestone.label}
        </Text>
        {stage === 'CAPTURE' ? (
          <Text style={styles.counterText}>{`Đã chụp ${doneCount}/${slots.length}`}</Text>
        ) : null}
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
            const allowed = isSlotAllowed ? isSlotAllowed(key) : true;
            const bg = active
              ? colors.primary
              : done
                ? colors.successContainer
                : colors.surfaceContainerHigh;
            const fg = active
              ? colors.onPrimary
              : done
                ? colors.onSuccessContainer
                : colors.onSurfaceVariant;
            const stateLabel = active
              ? 'Đang chụp'
              : done
                ? 'Đã chụp'
                : allowed
                  ? 'Chưa chụp'
                  : 'Không cần bổ sung lần này';
            const pillDisabled = disabled || !onSelectStep || !allowed;

            return (
              <MotionPressable
                key={key}
                accessibilityRole={onSelectStep ? 'button' : 'text'}
                accessibilityLabel={`${shortSlotLabels[key]}: ${stateLabel}`}
                accessibilityState={{ selected: active, disabled: pillDisabled }}
                disabled={pillDisabled}
                onPress={() => onSelectStep?.(idx)}
                style={[styles.slotPill, { backgroundColor: bg }, !allowed && styles.dimmed]}
              >
                {done ? (
                  <MaterialIcons name="check" size={14} color={fg} importantForAccessibility="no" />
                ) : null}
                <Text style={[styles.slotText, { color: fg }]}>{shortSlotLabels[key]}</Text>
              </MotionPressable>
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
    phaseTrail: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xxs,
    },
    phaseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.spaceSm,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.full,
    },
    phaseText: {
      ...typography.caption,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.spaceSm,
    },
    stepText: {
      ...typography.label,
      flexShrink: 1,
    },
    counterText: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
      fontVariant: ['tabular-nums'],
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
      paddingHorizontal: spacing.px3,
      paddingVertical: spacing.spaceXs,
      minHeight: 48,
      borderRadius: borderRadius.full,
    },
    slotText: {
      ...typography.caption,
    },
    dimmed: {
      opacity: 0.45,
    },
  });
