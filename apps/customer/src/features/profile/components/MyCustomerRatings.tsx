import { Button, Card, ReceivedRatings, spacing } from "@datxe/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { getReceivedRatings } from "../api";

/**
 * Đánh giá khách nhận được từ tài xế — cùng cách trình bày với mục
 * "Xem đánh giá của tôi" bên app tài xế.
 */
export function MyCustomerRatings({ collapsible = false }: { collapsible?: boolean }) {
  const [expanded, setExpanded] = useState(!collapsible);
  const query = useInfiniteQuery({
    queryKey: ["customer", "receivedRatings"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getReceivedRatings(pageParam, 20),
    getNextPageParam: page => (page.hasNext ? page.page + 1 : undefined),
    // Luôn tải trang đầu để trạng thái thu gọn cũng có điểm trung bình và số lượt đánh giá.
    staleTime: 30_000,
  });
  const pages = query.data?.pages ?? [];
  const data = pages.length
    ? { ...pages[0], ratings: pages.flatMap(page => page.ratings ?? []) }
    : undefined;

  return (
    <Card style={styles.card}>
      {collapsible ? (
        <Button
          icon="star"
          variant="secondary"
          label={expanded ? "Thu gọn đánh giá" : "Xem đánh giá của tôi"}
          onPress={() => setExpanded(value => !value)}
        />
      ) : null}
      {collapsible && !expanded ? (
        <ReceivedRatings
          compact
          data={data}
          loading={query.isLoading}
          error={query.isError}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {expanded ? (
        <ReceivedRatings
          title="Đánh giá từ tài xế"
          data={data}
          loading={query.isLoading}
          error={query.isError}
          hasMore={Boolean(query.hasNextPage)}
          loadingMore={query.isFetchingNextPage}
          onMore={() => void query.fetchNextPage()}
          onRetry={() => void query.refetch()}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceMd, gap: spacing.spaceSm },
});
