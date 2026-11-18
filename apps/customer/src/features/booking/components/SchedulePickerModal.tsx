import { getLocale, translate as i18nT } from '@datxe/shared';
import type { ThemeColors } from '@datxe/ui';
import {
  Button,
  MotionPressable as Pressable,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function SchedulePickerModal({
  visible,
  close,
  slots,
  selected,
  onSelect,
}: {
  visible: boolean;
  close: () => void;
  slots: string[];
  selected: string | null;
  onSelect: (slot: string | null) => void;
}) {
  const s = useThemedStyles(makeStyles);
  useLanguage();
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<string | null>(
    selected && slots.includes(selected) ? selected : slots[0] ?? null,
  );

  const pendingDate = pending ? new Date(pending) : null;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const timeLabel = (value: string) => new Date(value).toLocaleTimeString(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dayLabel = (value: string) => {
    const date = new Date(value);
    if (sameDay(date, now)) return i18nT('Hôm nay');
    if (sameDay(date, tomorrow)) return i18nT('Ngày mai');
    return date.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const confirm = () => {
    if (pending) onSelect(pending);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.scrim}>
        <Pressable accessibilityLabel={i18nT('Đóng lịch đón')} style={s.backdrop} onPress={close} />
        <View style={[s.sheet, { paddingBottom: Math.max(18, insets.bottom + 10) }]}>
          <View style={s.header}>
            <Text style={s.title}>{i18nT('Chọn thời gian tài xế đến đón')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18nT('Đóng')}
              onPress={close}
              style={s.close}
            >
              <MaterialIcons name="close" size={21} color={colors.onSurface} />
            </Pressable>
          </View>

          <View style={s.columnHeader}>
            <Text style={s.columnText}>{i18nT('Thời gian')}</Text>
            <Text style={s.columnText}>{i18nT('Ngày')}</Text>
          </View>

          <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
            {slots.map((slot) => {
              const active = slot === pending;
              return (
                <Pressable
                  key={slot}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPending(slot)}
                  style={[s.row, active && s.rowActive]}
                >
                  <Text style={[s.time, active && s.timeActive]}>{timeLabel(slot)}</Text>
                  <Text style={[s.day, active && s.dayActive]}>{dayLabel(slot)}</Text>
                </Pressable>
              );
            })}
            {!slots.length ? (
              <Text style={s.empty}>{i18nT('Chưa có khung giờ phù hợp. Vui lòng thử lại.')}</Text>
            ) : null}
          </ScrollView>

          <View style={s.summary}>
            <Text style={s.summaryText}>
              {i18nT('Tài xế sẽ đón bạn lúc')}{' '}
              <Text style={s.summaryStrong}>
                {pendingDate ? `${timeLabel(pending!)}, ${dayLabel(pending!)}` : i18nT('Chưa chọn giờ')}
              </Text>
            </Text>
          </View>

          <View style={s.perks}>
            <View style={s.perk}>
              <View style={s.perkIcon}>
                <MaterialIcons name="bolt" size={20} color={colors.primary} />
              </View>
              <View style={s.perkCopy}>
                <Text style={s.perkTitle}>{i18nT('Ưu tiên tìm tài xế')}</Text>
                <Text style={s.perkText}>
                  {i18nT('Hệ thống sẽ ưu tiên tìm tài xế cho chuyến xe đặt trước so với những chuyến khác')}
                </Text>
              </View>
            </View>
            <View style={s.perk}>
              <View style={s.perkIcon}>
                <MaterialIcons name="percent" size={20} color={colors.primary} />
              </View>
              <View style={s.perkCopy}>
                <Text style={s.perkTitle}>{i18nT('Hủy miễn phí trước chuyến đi 30 phút')}</Text>
                <Text style={s.perkText}>
                  {i18nT('Sau thời gian này, phí hủy chuyến sẽ được áp dụng.')}{' '}
                  <Text
                    accessibilityRole="link"
                    style={s.link}
                    onPress={() => { close(); router.push('/support'); }}
                  >
                    {i18nT('Xem chi tiết tại đây')}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={i18nT('Tìm hiểu thêm về dịch vụ')}
            onPress={() => { close(); router.push('/support'); }}
            style={s.learnMore}
          >
            <MaterialIcons name="info-outline" size={17} color={colors.primary} />
            <Text style={s.learnMoreText}>{i18nT('Tìm hiểu thêm về dịch vụ')}</Text>
          </Pressable>

          <Button
            label="Xác nhận"
            disabled={!pending}
            onPress={confirm}
            style={s.cta}
          />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim60 },
    backdrop: { flex: 1 },
    sheet: {
      maxHeight: '94%',
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: {
      ...typography.cardTitle,
      flex: 1,
      color: colors.onSurface,
    },
    close: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainerHigh,
    },
    columnHeader: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceContainerHigh,
    },
    columnText: {
      ...typography.label,
      flex: 1,
      color: colors.onSurface,
    },
    list: { maxHeight: 160 },
    listContent: { gap: 2 },
    row: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    rowActive: { backgroundColor: colors.surfaceContainerHigh },
    time: {
      ...typography.body,
      flex: 1,
      color: colors.onSurfaceVariant,
      fontVariant: ['tabular-nums'],
    },
    timeActive: { ...typography.cardTitle, color: colors.onSurface },
    day: {
      ...typography.label,
      flex: 1,
      color: colors.onSurfaceVariant,
    },
    dayActive: { color: colors.onSurface },
    empty: {
      ...typography.caption,
      color: colors.onSurfaceVariant,
      paddingVertical: 16,
      textAlign: 'center',
    },
    summary: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerLow,
    },
    summaryText: {
      ...typography.body,
      color: colors.onSurface,
      textAlign: 'center',
    },
    summaryStrong: { ...typography.label, color: colors.primary },
    perks: { gap: 12 },
    perk: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    perkIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryFixedTint,
    },
    perkCopy: { flex: 1, gap: 2 },
    perkTitle: {
      ...typography.label,
      color: colors.onSurface,
    },
    perkText: {
      ...typography.bodySecondary,
      color: colors.onSurfaceVariant,
    },
    link: { ...typography.label, color: colors.primary },
    learnMore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    learnMoreText: {
      ...typography.label,
      color: colors.primary,
    },
    cta: { height: 50, backgroundColor: colors.primary },
  });
