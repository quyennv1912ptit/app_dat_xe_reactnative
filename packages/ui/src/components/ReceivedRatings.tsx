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
}) {
  const colors = useThemeColors();
  const locale = getLocale();
  const ratings = data?.ratings ?? [];
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={typography.sectionTitle}>{t(title)}</Text>
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
          {ratings.map((review, index) => {
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
          })}
          {hasMore ? (
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
  score: { gap: 4 },
  review: { gap: 6, paddingTop: 12 },
  reviewHeader: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 },
});
