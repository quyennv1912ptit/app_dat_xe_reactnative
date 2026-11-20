import type { CustomerNotification } from "@datxe/shared";

/**
 * Ứng dụng tài xế cố ý không hiển thị thông báo "đánh giá mới".
 * Bộ lọc này cũng che các bản ghi cũ đã lưu trước khi backend ngừng phát thông báo.
 */
export const isVisibleDriverNotification = (item: CustomerNotification) =>
  item.type !== "RATING_RECEIVED";

export const unreadDriverNotifications = (items: CustomerNotification[] | null | undefined) =>
  (items ?? []).filter((item) => isVisibleDriverNotification(item) && !item.readAt).length;
