import { request } from "@/lib/api";
import { DriverReviews, type DriverReviewSummary } from "@datxe/ui";
import { useQuery } from "@tanstack/react-query";

/**
 * Đánh giá mà khách hàng của chuyến này nhận được từ các tài xế.
 * Khác với endpoint đánh giá của chính tài xế, endpoint này chỉ trả dữ liệu
 * của khách trong chuyến và chỉ chủ chuyến được gọi.
 */
export function CustomerReviews({ rideId, enabled = true }: { rideId: number; enabled?: boolean }) {
  const query = useQuery({
    queryKey: ["driver", "customerReviews", rideId],
    queryFn: () => request<DriverReviewSummary>(`/driver/rides/${rideId}/customer-reviews`),
    enabled,
    staleTime: 30_000,
  });

  return (
    <DriverReviews
      data={query.data}
      loading={query.isLoading}
      error={query.isError}
      retry={() => void query.refetch()}
      title="Đánh giá khách hàng"
      reviewerLabel="Tài xế ẩn danh"
    />
  );
}
