import { request } from "@/lib/api";
import { DriverReviews, type DriverReviewSummary } from "@datxe/ui";
import { useQuery } from "@tanstack/react-query";

/**
 * Đánh giá mà tài xế nhận được từ khách hàng. Dùng chung component
 * `DriverReviews` và hợp đồng `/driver/profile/reviews` với app khách,
 * nên điểm trung bình, biểu đồ phân bổ 5★→1★ và danh sách nhận xét
 * gần đây luôn hiển thị giống hệt hai app.
 */
export function CustomerReviews({ enabled = true }: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: ["driver", "profileReviews"],
    queryFn: () => request<DriverReviewSummary>("/driver/profile/reviews"),
    enabled,
    staleTime: 30_000,
  });

  return (
    <DriverReviews
      data={query.data}
      loading={query.isLoading}
      error={query.isError}
      retry={() => void query.refetch()}
    />
  );
}
