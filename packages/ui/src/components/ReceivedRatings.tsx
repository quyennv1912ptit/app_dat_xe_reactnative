import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { getLocale, translate as t } from "@datxe/shared";
import { Button } from "./Button";
import { Typography as Text } from "./Typography";
import { typography } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";

export type ReceivedRatingItem = {
  stars: number;
  comment?: string | null;
  tags?: string[] | null;
  createdAt: string;
};

export type ReceivedRatingsPage = {
  averageRating: number | null;
  totalRatings: number;
  ratings: ReceivedRatingItem[];
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  /** Khi backend cung cấp thì dùng số liệu này; nếu không, tính từ các đánh giá đã tải. */
  distribution?: Partial<Record<number, number>>;
};

/**
 * Đánh giá mà người dùng nhận được (khách nhận từ tài xế, tài xế nhận từ khách).
 * Dùng chung một hợp đồng `/ratings/received` nên số liệu luôn khớp backend.
 */
export function ReceivedRatings({
  data,
  loading,
  error,
  hasMore = false,
  loadingMore = false,
  onMore,
  onRetry,
  title = "Đánh giá đã nhận",
  emptyLabel = "Chưa có đánh giá nào. Đánh giá sau mỗi chuyến đi sẽ hiển thị tại đây.",
  compact = false,
}: {
  data?: ReceivedRatingsPage | null;
  loading: boolean;
  error: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onMore?: () => void;
  onRetry: () => void;
  title?: string;
  emptyLabel?: string;
  /** Chỉ hiện phần tóm tắt điểm/trung bình, dùng cho trạng thái thu gọn trong hồ sơ. */
  compact?: boolean;
}) {
  const colors = useThemeColors();
  const locale = getLocale();
  const ratings = data?.ratings ?? [];
  const distribution = data?.distribution ?? ratings.reduce<Partial<Record<number, number>>>((acc, item) => {
    const stars = Math.max(1, Math.min(5, Math.round(item.stars)));
    acc[stars] = (acc[stars] ?? 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(distribution).filter((value): value is number => typeof value === "number"));
  return (
    <View style={styles.section}>
      {!compact ? <Text accessibilityRole="header" style={typography.sectionTitle}>{t(title)}</Text> : null}
      {loading && !data ? <ActivityIndicator accessibilityLabel={t("Đang tải đánh giá")} /> : null}
      {error ? (
        <View style={styles.section}>
          <Text accessibilityRole="alert">{t("Chưa tải được đánh giá.")}</Text>
          <Button variant="secondary" label={t("Thử lại")} onPress={onRetry} />
        </View>
      ) : null}
      {!error && data && data.totalRatings === 0 ? <Text>{t(emptyLabel)}</Text> : null}
      {!error && data && data.totalRatings > 0 ? (
        <>
          <View style={styles.summary}>
            <View style={styles.score}>
              <Text style={[typography.screenTitle, { color: colors.primary, fontVariant: ["tabular-nums"] }]}>
                {data.averageRating == null
                  ? "—"
                  : `${data.averageRating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ★`}
              </Text>
              <Text style={[typography.bodySecondary, { color: colors.onSurfaceVariant }]}>{t("Đánh giá trung bình")}</Text>
              <Text style={[typography.bodySecondary, { color: colors.onSurfaceVariant, fontVariant: ["tabular-nums"] }]}>
                {t("{0} lượt đánh giá", { 0: data.totalRatings.toLocaleString(locale) })}
              </Text>
            </View>
            <View style={styles.bars}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = distribution[stars] ?? 0;
                return (
                  <View
                    key={stars}
                    accessible
                    accessibilityLabel={t("{0} sao, {1} lượt", { 0: stars, 1: count })}
                    style={styles.barRow}
                  >
                    <Text style={[typography.label, { color: colors.onSurfaceVariant, fontVariant: ["tabular-nums"] }]}>
                      {stars} ★
                    </Text>
                    <View style={[styles.bar, { backgroundColor: colors.surfaceContainerHighest }]}>
                      <View style={[styles.fill, { width: `${(100 * count) / maxCount}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
          {!compact ? ratings.map((review, index) => {
            const stars = Math.max(0, Math.min(5, Math.round(review.stars)));
            const tags = review.tags?.filter(Boolean) ?? [];
            return (
              <View key={`${review.createdAt}-${index}`} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text accessibilityLabel={t("{0} sao", { 0: stars })} style={{ color: colors.primary }}>
                    {"★".repeat(stars)}{"☆".repeat(5 - stars)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.onSurfaceVariant, fontVariant: ["tabular-nums"] }]}>
                    {new Date(review.createdAt).toLocaleDateString(locale)}
                  </Text>
                </View>
                {review.comment?.trim() ? <Text>{review.comment.trim()}</Text> : null}
                {tags.length ? (
                  <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>{tags.join(" · ")}</Text>
                ) : null}
              </View>
            );
          }) : null}
          {!compact && hasMore ? (
            <Button
              variant="secondary"
              label={t("Xem thêm đánh giá")}
              loading={loadingMore}
              onPress={() => onMore?.()}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  summary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16 },
  score: { minWidth: 104, gap: 4 },
  bars: { flex: 1, minWidth: 120, gap: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  review: { gap: 6, paddingTop: 12 },
  reviewHeader: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 },
});
