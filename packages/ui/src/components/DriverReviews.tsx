import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { getLocale, translate as t } from '@datxe/shared';
import { Button } from './Button';
import { Typography as Text } from './Typography';
import { typography } from '../theme/colors';
import { useThemeColors } from '../theme/ThemeProvider';

export type DriverReviewSummary = {
  averageRating: number | null;
  total: number;
  distribution: Partial<Record<number, number>>;
  recent: { id: number; stars: number; comment: string | null; createdAt: string }[];
};

export function DriverReviews({ data, loading, error, retry }: {
  data?: DriverReviewSummary | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const colors = useThemeColors();
  const locale = getLocale();
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.heading}>{t('Đánh giá tài xế')}</Text>
    {loading && !data ? <ActivityIndicator accessibilityLabel={t('Đang tải đánh giá')} /> : null}
    {error ? <View style={styles.section}>
      <Text accessibilityRole="alert">{t('Chưa tải được đánh giá.')}</Text>
      <Button variant="secondary" label={t('Thử lại')} onPress={retry} />
    </View> : null}
    {data?.total === 0 ? <Text>{t('Chưa có đánh giá')}</Text> : null}
    {data && data.total > 0 ? <>
      <View style={styles.summary}>
        <View style={styles.score}>
          <Text style={styles.heading}>{data.averageRating?.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ★</Text>
          <Text>{t('Đánh giá trung bình')}</Text>
          <Text>{t('{0} lượt đánh giá', { 0: data.total.toLocaleString(locale) })}</Text>
        </View>
        <View style={styles.bars}>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = data.distribution[stars] ?? 0;
            return <View key={stars} accessible accessibilityLabel={t('{0} sao, {1} lượt', { 0: stars, 1: count })} style={styles.barRow}>
              <Text>{stars} ★</Text>
              <View style={[styles.bar, { backgroundColor: colors.surfaceContainerHighest }]}>
                <View style={[styles.fill, { width: `${100 * count / data.total}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>;
          })}
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.heading}>{t('Đánh giá gần đây')}</Text>
      {data.recent.map(review => <View key={review.id} style={styles.review}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewer}>{t('Khách hàng ẩn danh')}</Text>
          <Text>{new Date(review.createdAt).toLocaleDateString(locale)}</Text>
        </View>
        <Text accessibilityLabel={t('{0} sao', { 0: review.stars })} style={{ color: colors.primary }}>
          {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
        </Text>
        {review.comment ? <Text>{review.comment}</Text> : null}
      </View>)}
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: { ...typography.sectionTitle },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  score: { minWidth: 104, gap: 4 },
  bars: { flex: 1, minWidth: 120, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  review: { gap: 6, paddingTop: 12 },
  reviewHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  reviewer: { ...typography.label },
});
