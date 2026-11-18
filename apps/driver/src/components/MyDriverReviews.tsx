import { request } from '@/lib/api';
import { useSessionStore } from '@/lib/store';
import { Button, Card, DriverReviews, useThemedStyles, type DriverReviewSummary } from '@datxe/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { rideStyles } from './rideStyles';

export function MyDriverReviews({ collapsible = false }: { collapsible?: boolean }) {
  const styles = useThemedStyles(rideStyles);
  const userId = useSessionStore(state => state.user?.id);
  const [expanded, setExpanded] = useState(false);
  const visible = !collapsible || expanded;
  const reviews = useQuery({
    queryKey: ['driver', 'myReviews', userId],
    queryFn: () => request<DriverReviewSummary>('/driver/profile/reviews'),
    enabled: Boolean(userId) && visible,
  });
  if (!userId) return null;

  return <Card style={styles.card}>
    {collapsible ? <Button icon="star" variant="secondary" label={expanded ? 'Thu gọn đánh giá' : 'Xem đánh giá của tôi'} onPress={() => setExpanded(value => !value)} /> : null}
    {visible ? <DriverReviews data={reviews.data} loading={reviews.isLoading} error={reviews.isError} retry={() => void reviews.refetch()} /> : null}
  </Card>;
}
