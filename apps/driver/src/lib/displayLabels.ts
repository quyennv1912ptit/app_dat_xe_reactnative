import type { RideStatus } from '@datxe/shared';

export type StatusTone = 'neutral' | 'pending' | 'active' | 'success' | 'danger';
export type StatusLabel = { label: string; tone: StatusTone };
export const rideStatuses = {
  PENDING: { label: 'Chờ xử lý', tone: 'pending' },
  SEARCHING: { label: 'Đang tìm tài xế', tone: 'pending' },
  DRIVER_ASSIGNED: { label: 'Đã nhận chuyến', tone: 'active' },
  DRIVER_ARRIVING: { label: 'Đang tới điểm đón', tone: 'active' },
  DRIVER_ARRIVED: { label: 'Đã tới điểm đón', tone: 'active' },
  VEHICLE_HANDOVER: { label: 'Đang bàn giao xe', tone: 'active' },
  IN_PROGRESS: { label: 'Đang thực hiện chuyến', tone: 'active' },
  ARRIVED_DESTINATION: { label: 'Đã tới điểm trả', tone: 'active' },
  VEHICLE_RETURNED: { label: 'Đang hoàn trả xe', tone: 'active' },
  COMPLETED: { label: 'Đã hoàn tất', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  FAILED_SYSTEM: { label: 'Lỗi hệ thống', tone: 'neutral' },
  NO_DRIVER_FOUND: { label: 'Không tìm được tài xế', tone: 'neutral' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'neutral' },
} satisfies Record<RideStatus, StatusLabel>;

const statusTables: Record<string, Record<string, StatusLabel>> = {
  ride: rideStatuses,
  availability: {
    ONLINE: { label: 'Đang nhận chuyến', tone: 'success' },
    OFFLINE: { label: 'Tạm ngừng nhận chuyến', tone: 'neutral' },
    BUSY: { label: 'Đang thực hiện chuyến', tone: 'active' },
  },
  approval: {
    APPROVED: { label: 'Hồ sơ đã được duyệt', tone: 'success' },
    REJECTED: { label: 'Cần bổ sung hồ sơ', tone: 'danger' },
    PENDING: { label: 'Chưa hoàn tất xác minh', tone: 'pending' },
    SUSPENDED: { label: 'Tạm ngừng xác minh', tone: 'danger' },
  },
  payment: {
    PENDING: { label: 'Chờ thanh toán', tone: 'pending' },
    PAID: { label: 'Đã thanh toán', tone: 'success' },
    FAILED: { label: 'Thanh toán thất bại', tone: 'danger' },
    REFUNDED: { label: 'Đã hoàn tiền', tone: 'neutral' },
  },
};
export type StatusKind = 'ride' | 'availability' | 'approval' | 'payment';
function lookup<T>(table: Record<string, T>, value: string | null | undefined): T | undefined {
  return value && Object.hasOwn(table, value) ? table[value] : undefined;
}
export function statusLabel(kind: StatusKind, value: string | null | undefined): StatusLabel {
  return lookup(statusTables[kind], value) ?? { label: value ? 'Chưa xác định trạng thái' : 'Chưa có trạng thái', tone: 'neutral' };
}

export const vehicleTypeLabel = (value: string | null | undefined) => lookup({ CAR: 'Ô tô', MOTORCYCLE: 'Xe máy' }, value) ?? 'Chưa rõ loại xe';
export const transmissionLabel = (value: string | null | undefined) => lookup({ AUTO: 'Số tự động', MANUAL: 'Số sàn' }, value) ?? 'Chưa rõ hộp số';

const notificationTypes: Record<string, string> = {
  RIDE_OFFER: 'Yêu cầu chuyến mới', OFFER_EXPIRED: 'Yêu cầu chuyến đã hết hạn', OFFER_CANCELLED: 'Yêu cầu chuyến đã bị hủy',
  RIDE_UPDATED: 'Cập nhật chuyến đi', HANDOVER_CONFIRMED: 'Biên bản đã được xác nhận',
  RIDE_CANCELLED: 'Chuyến đi đã bị hủy', RIDE_COMPLETED: 'Chuyến đi đã hoàn tất',
  RIDE_NO_DRIVER: 'Chưa tìm được tài xế', RIDE_ASSIGNED: 'Chuyến đi đã có tài xế',
  DRIVER_VERIFICATION_UPDATED: 'Cập nhật xét duyệt hồ sơ',
  DRIVER_FORCE_OFFLINE: 'Tạm ngừng nhận chuyến',
  DRIVER_ACCOUNT_STATUS_UPDATED: 'Cập nhật trạng thái tài khoản',
  CHAT_MESSAGE: 'Tin nhắn mới', CHAT_READ: 'Tin nhắn đã được đọc',
  RATING_RECEIVED: 'Đánh giá mới', VOUCHER_GRANTED: 'Ưu đãi mới', VOUCHER_CAMPAIGN: 'Chương trình ưu đãi',
};
export const notificationTypeLabel = (value: string | null | undefined) => lookup(notificationTypes, value) ?? 'Thông báo từ hệ thống';
const walletTypes: Record<string, string> = {
  DEPOSIT: 'Nạp tiền', WITHDRAW: 'Rút tiền', TRIP_PAYMENT: 'Thanh toán chuyến đi',
  TRIP_EARNING: 'Thu nhập chuyến đi', REFUND: 'Hoàn tiền', COMMISSION_FEE: 'Phí dịch vụ',
};
export const walletTransactionLabel = (value: string | null | undefined) => lookup(walletTypes, value) ?? 'Giao dịch ví';
