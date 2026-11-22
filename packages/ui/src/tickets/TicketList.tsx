import { translate as t, type TicketStatus, type TicketSummary } from '@datxe/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MotionPressable as Pressable } from '../components/MotionPressable';
import { Typography as Text } from '../components/Typography';
import { borderRadius, spacing, typography } from '../theme/colors';
import { useThemedStyles, type ThemeColors } from '../theme/ThemeProvider';
import { useLanguage } from '../useLanguage';

const categoryLabels: Record<string, string> = {
  TRIP: 'Chuyến đi', PAYMENT: 'Thanh toán', HANDOVER: 'Bàn giao xe', ACCOUNT: 'Tài khoản', OTHER: 'Vấn đề khác',
};
const statusLabels: Record<TicketStatus, string> = {
  OPEN: 'Đã tiếp nhận', IN_PROGRESS: 'Đang xử lý', WAITING_FOR_USER: 'Chờ bạn phản hồi',
  RESOLVED: 'Đã giải quyết', CLOSED: 'Đã đóng',
};

type Props = {
  tickets: TicketSummary[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  hasNext?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onRefresh: () => void;
  onRetry?: () => void;
  onOpen: (id: number) => void;
  onCreate: () => void;
};

export function TicketList({ tickets, loading, refreshing, error, hasNext, loadingMore, onLoadMore, onRefresh, onRetry, onOpen, onCreate }: Props) {
  useLanguage();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.fill}>
      {error ? (
        <Card style={s.errorCard}>
          <Text accessibilityRole="alert" style={s.error}>{error}</Text>
          {onRetry ? <Button variant="secondary" label={t('Thử lại')} onPress={onRetry} /> : null}
        </Card>
      ) : null}
      <FlatList
        data={tickets}
        keyExtractor={item => String(item.id)}
        ListFooterComponent={hasNext && onLoadMore ? (
          <Button variant="secondary" label={t('Tải thêm')} loading={loadingMore}
            disabled={loadingMore} onPress={onLoadMore} />
        ) : undefined}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={s.refresh.tintColor} />}
        ListEmptyComponent={loading ? (
          <ActivityIndicator accessibilityLabel={t('Đang tải yêu cầu hỗ trợ')} style={s.loading} />
        ) : !error ? (
          <View style={s.empty}>
            <MaterialIcons name="support-agent" size={48} color={s.emptyIcon.color} />
            <Text style={s.emptyTitle}>{t('Chưa có yêu cầu hỗ trợ')}</Text>
            <Text style={s.emptyHint}>{t('Tạo yêu cầu mới để bộ phận hỗ trợ tiếp nhận.')}</Text>
          </View>
        ) : undefined}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={t('Mở yêu cầu {0}', { '0': item.code })} onPress={() => onOpen(item.id)}>
            <Card style={s.card}>
              <View style={s.row}>
                <Text style={s.subject}>{t(categoryLabels[item.category] ?? item.category)}</Text>
                <View style={[s.badge, statusTone(item.status, s)]}>
                  <Text style={[s.badgeText, { color: statusTone(item.status, s).color }]}>{t(statusLabels[item.status])}</Text>
                </View>
              </View>
              <Text selectable style={s.code}>{item.code}</Text>
              <Text style={s.meta}>{t('Cập nhật')} · {new Date(item.updatedAt).toLocaleString('vi-VN')}</Text>
            </Card>
          </Pressable>
        )}
      />
      <View style={s.footer}>
        <Button label={t('Tạo yêu cầu hỗ trợ')} icon="add" iconPosition="leading" onPress={onCreate} />
      </View>
    </View>
  );
}

function statusTone(status: TicketStatus, s: ReturnType<typeof makeStyles>) {
  switch (status) {
    case 'OPEN': return s.open;
    case 'WAITING_FOR_USER': return s.waiting;
    case 'IN_PROGRESS': return s.progress;
    default: return s.closed;
  }
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.spaceMd, gap: spacing.px3, paddingBottom: spacing.spaceLg },
  card: { padding: spacing.spaceMd, gap: spacing.spaceXs + spacing.xxs },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  subject: { ...typography.cardTitle, flexGrow: 1, flexBasis: 120 },
  code: { ...typography.caption, color: c.onSurfaceVariant, fontVariant: ['tabular-nums'] },
  meta: { ...typography.bodySecondary, color: c.onSurfaceVariant },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.px3, paddingVertical: spacing.spaceXs, color: c.onSurface },
  badgeText: { ...typography.badge },
  open: { backgroundColor: c.successContainer, color: c.onSuccessContainer },
  waiting: { backgroundColor: c.warningContainer, color: c.onWarningContainer },
  progress: { backgroundColor: c.primaryContainer, color: c.onPrimaryContainer },
  closed: { backgroundColor: c.surfaceContainerHigh, color: c.onSurfaceVariant },
  errorCard: { margin: spacing.spaceMd, gap: spacing.spaceSm },
  error: { ...typography.body, color: c.error },
  loading: { marginTop: spacing.spaceXl + spacing.spaceMd },
  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.spaceSm, paddingVertical: spacing.spaceXl * 2 },
  emptyIcon: { color: c.onSurfaceVariant },
  emptyTitle: { ...typography.cardTitle },
  emptyHint: { ...typography.bodySecondary, color: c.onSurfaceVariant, textAlign: 'center' },
  refresh: { tintColor: c.primary },
  footer: { padding: spacing.spaceMd, backgroundColor: c.cardSurface },
});
