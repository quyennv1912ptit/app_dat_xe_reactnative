/**
 * Quy đổi số mét nội bộ (haversine trên polyline) sang số mét của provider (Goong)
 * để mọi con số hiển thị/đọc lên khớp với tổng `directions.distance` mà backend trả.
 */
export function providerScale(routeTotalMeters: number, providerTotalMeters: number | null | undefined): number {
  return routeTotalMeters > 0 && providerTotalMeters && providerTotalMeters > 0
    ? providerTotalMeters / routeTotalMeters
    : 1;
}

/**
 * Chuẩn hoá độ dài từng bước về đúng tổng mét của provider.
 * Nhờ vậy "còn X m" chạy về 0 đúng lúc tới đích thay vì dừng ở phần dư
 * do tổng các bước lệch tổng tuyến vài chục mét.
 */
export function normalizeStepDistances(
  steps: readonly { distanceMeters: number }[],
  providerTotalMeters: number | null | undefined,
): number[] {
  const distances = steps.map(step =>
    Number.isFinite(step.distanceMeters) && step.distanceMeters > 0 ? step.distanceMeters : 0,
  );
  const total = distances.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || !providerTotalMeters || providerTotalMeters <= 0) return distances;
  const ratio = providerTotalMeters / total;
  return distances.map(value => value * ratio);
}

/**
 * Làm tròn khoảng cách còn lại theo kiểu Google Maps để con số không nhảy lắt nhắt:
 * 10 m dưới 100 m, 50 m dưới 1 km, 100 m từ 1 km trở lên.
 */
export function roundRemainingMeters(meters: number): number {
  if (!Number.isFinite(meters) || meters <= 0) return 0;
  if (meters < 100) return Math.max(10, Math.round(meters / 10) * 10);
  if (meters < 1000) return Math.round(meters / 50) * 50;
  return Math.round(meters / 100) * 100;
}

/** Chuỗi hiển thị/đọc lên cho khoảng cách còn lại tới điểm rẽ kế tiếp. */
export function formatRemainingMeters(meters: number, locale = 'vi-VN'): string {
  const rounded = roundRemainingMeters(meters);
  if (rounded <= 0) return '';
  if (rounded < 1000) return `${rounded} m`;
  return `${(rounded / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })} km`;
}
