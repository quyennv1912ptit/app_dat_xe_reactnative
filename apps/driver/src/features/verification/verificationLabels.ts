import type * as Picker from 'expo-image-picker';
import type { Application, VerificationWarning } from './api';
import { fields, qrScanDecision, slots, type FieldKey, type SlotKey } from './workflow';

export type QrDecision = ReturnType<typeof qrScanDecision>;

export type FlowStage = 'PREPARE' | 'CAPTURE' | 'OCR' | 'CONFIRM_FIELDS' | 'SUMMARY';
export type PhotoAsset = Picker.ImagePickerAsset & { mimeType: string };
export type SlotMap<T> = Partial<Record<SlotKey, T>>;

export const faceSlots = ['cccd_front', 'gplx_front', 'selfie'] as const;
export const cccdFieldKeys: readonly FieldKey[] = [
  'cccd_name',
  'cccd_id',
  'cccd_dob',
  'cccd_gender',
  'cccd_expiry_date',
];
export const gplxFieldKeys: readonly FieldKey[] = [
  'gplx_name',
  'gplx_number',
  'gplx_dob',
  'gplx_classes',
  'expiry_date',
];
export const optionalFields = new Set<FieldKey>(['cccd_gender', 'cccd_expiry_date']);

export const fieldLabelMap = Object.fromEntries(fields) as Record<FieldKey, string>;
export const slotLabelMap = Object.fromEntries(slots) as Record<SlotKey, string>;

export const shortSlotLabels: Record<SlotKey, string> = {
  cccd_front: 'CCCD trước',
  cccd_back: 'CCCD sau',
  gplx_front: 'GPLX trước',
  gplx_back: 'GPLX sau',
  selfie: 'Chân dung',
};

export const statusLabels: Record<string, string> = {
  DRAFT: 'Hồ sơ chưa nộp',
  SUBMITTED: 'Đã nộp · Chờ xét duyệt',
  UNDER_REVIEW: 'Đang xét duyệt',
  NEEDS_MORE_INFO: 'Cần bổ sung hồ sơ',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Chưa đạt xét duyệt',
  REVOKED: 'Đã thu hồi xác minh',
};

/** 4 user-facing milestones; OCR runs transparently inside milestone 3. */
export function visibleMilestone(stage: FlowStage, step: number): { index: number; total: number; label: string; progress: number } {
  if (stage === 'PREPARE') {
    return { index: 1, total: 4, label: 'Bước 1/4 · Chuẩn bị giấy tờ', progress: 0.16 };
  }
  if (stage === 'CAPTURE') {
    return {
      index: 2,
      total: 4,
      label: `Bước 2/4 · Chụp ảnh (${step + 1}/${slots.length})`,
      progress: 0.25 + ((step + 1) / slots.length) * 0.35,
    };
  }
  if (stage === 'OCR' || stage === 'CONFIRM_FIELDS') {
    return {
      index: 3,
      total: 4,
      label: stage === 'OCR' ? 'Bước 3/4 · Đọc thông tin giấy tờ' : 'Bước 3/4 · Kiểm tra thông tin',
      progress: stage === 'OCR' ? 0.68 : 0.82,
    };
  }
  return { index: 4, total: 4, label: 'Bước 4/4 · Xác nhận & nộp hồ sơ', progress: 1 };
}

export const captureInstructions: Record<SlotKey, string> = {
  cccd_front: 'Đặt mặt trước CCCD vừa khung dọc, đủ 4 góc, chữ rõ và tránh bóng lóa.',
  cccd_back: 'Đặt mặt sau CCCD vừa khung dọc, rõ chip và thông tin mặt sau.',
  gplx_front: 'Đặt mặt trước GPLX vừa khung dọc, thấy rõ số bằng, họ tên và hạng xe.',
  gplx_back: 'Đặt mặt sau GPLX vừa khung dọc, thấy rõ mã QR (nếu có) và bảng hạng xe.',
  selfie: 'Nhìn thẳng camera ở nơi đủ sáng, không đeo kính râm hay khẩu trang.',
};

export const warningLabels: Record<string, string> = {
  ORIENTATION_UNCERTAIN: 'Chưa nhận diện rõ chiều thẻ. Hãy kiểm tra ảnh thẳng ngay ngắn.',
  RAW_FRAME_FALLBACK: 'Không căn chỉnh tự động được góc thẻ. Hãy kiểm tra chữ vẫn rõ.',
  DOCUMENT_SLOT_MISMATCH: 'Ảnh có thể chưa đúng mặt hoặc đúng loại giấy tờ.',
  LOW_RESOLUTION: 'Ảnh hơi nhỏ, chữ có thể bị mờ.',
  LOW_KEYPOINT_CONFIDENCE: 'Một số góc thẻ hơi bị che hoặc sát mép.',
  OCR_UNAVAILABLE: 'Chưa đọc được chữ tự động ở lượt này.',
  DETECTOR_NO_BOX: 'Chưa thấy rõ khung thẻ trong ảnh.',
  DETECTOR_CARD_NOT_FOUND: 'Chưa xác định được vùng thẻ trong ảnh.',
  KEYPOINT_INVALID_GEOMETRY: 'Thẻ bị nghiêng hoặc thiếu góc. Hãy kiểm tra lại ảnh.',
  KEYPOINT_CONFIDENCE_REJECTED: 'Các góc thẻ chưa đủ rõ.',
  CARD_RECTIFICATION_REJECTED: 'Ảnh thẻ chưa đủ điều kiện căn chỉnh.',
  CARD_WARP_FAILED: 'Không căn chỉnh được thẻ. Hãy chụp thẳng hơn nếu cần.',
  CARD_GEOMETRY_REJECTED: 'Thẻ quá nhỏ hoặc nằm sát mép khung.',
  CARD_QUALITY_REJECTED: 'Ảnh chưa đạt kiểm tra độ rõ.',
  QR_NOT_FOUND: 'Chưa đọc được mã QR từ ảnh chụp.',
  QR_DETECTED_UNREADABLE: 'Có mã QR trên ảnh nhưng hơi mờ, nên quét trực tiếp.',
  QR_INVALID_FORMAT: 'Mã QR đọc được chưa đúng định dạng giấy tờ.',
  QR_UNSUPPORTED_FORMAT: 'Định dạng mã QR này chưa hỗ trợ đọc tự động.',
  QR_ENGINE_UNAVAILABLE: 'Hệ thống đọc mã QR từ ảnh đang bận.',
  QR_OCR_MISMATCH: 'Thông tin giữa mã QR và ảnh chụp đang khác nhau.',
  QR_OCR_NAME_DIACRITIC_MISMATCH: 'Họ tên giữa mã QR và ảnh chụp khác dấu tiếng Việt.',
  QR_OCR_INSUFFICIENT_EVIDENCE: 'Chưa đủ chữ đọc từ ảnh để đối chiếu chéo với mã QR.',
  QR_LIVE_SCAN_UNBOUND: 'Mã QR quét trực tiếp sẽ được đối chiếu cùng ảnh chụp.',
};

export const historyActionLabels: Record<string, string> = {
  CREATE: 'Tạo hồ sơ',
  LEGACY_BACKFILL: 'Đồng bộ hồ sơ đã xác minh',
  START_REVERIFICATION: 'Bắt đầu cập nhật giấy tờ',
  CANCEL_REVERIFICATION: 'Hủy cập nhật giấy tờ',
  ADD_CAPTURE: 'Thêm ảnh giấy tờ',
  REPLACE_CAPTURE: 'Thay ảnh giấy tờ',
  EXTRACT: 'Đọc thông tin tự động',
  CONFIRM_FIELDS: 'Xác nhận thông tin',
  SUBMIT: 'Nộp hồ sơ',
  RESUBMIT: 'Nộp bổ sung',
  IDENTITY_HOLD_APPLIED: 'Tạm giữ để kiểm tra danh tính',
  UNDER_REVIEW: 'Bắt đầu xét duyệt',
  APPROVED: 'Phê duyệt hồ sơ',
  REJECTED: 'Từ chối bản nộp',
  NEEDS_MORE_INFO: 'Yêu cầu bổ sung',
  REVOKED: 'Thu hồi xác minh',
  ADMIN_IDENTITY_OVERRIDE: 'Điều chỉnh ngoại lệ danh tính',
};

export const restrictionLabels: Record<string, string> = {
  IDENTITY_UNDER_REVIEW: 'Hồ sơ có thay đổi cần kiểm tra danh tính. Tạm khóa nhận chuyến cho đến khi duyệt xong.',
  CCCD_EXPIRED: 'CCCD đã hết hạn. Hãy cập nhật CCCD mới để tiếp tục nhận chuyến.',
  GPLX_EXPIRED: 'GPLX đã hết hạn. Hãy cập nhật GPLX mới để mở lại quyền nhận chuyến.',
  VERIFICATION_NOT_APPROVED: 'Hồ sơ đang chờ xét duyệt.',
};

export const editable = (app: Application | null) =>
  !app || app.status === 'DRAFT' || app.status === 'NEEDS_MORE_INFO';

export const appPath = (id: string) => 'applications/' + encodeURIComponent(id);

export const scoped = (app: Application | null) =>
  app?.status === 'NEEDS_MORE_INFO' ? app.requestedChanges : null;

export const slotAllowed = (app: Application | null, key: SlotKey) =>
  scoped(app)?.captures.includes(key) ?? true;

export const fieldAllowed = (app: Application | null, key: FieldKey) =>
  scoped(app)?.fields.includes(key) ?? true;

export function isIdentityLockedField(key: FieldKey, targetApp: Application | null) {
  if (!targetApp?.identityLocked) return false;
  if (key === 'cccd_id' && targetApp.lockedIdentity?.maskedCccdId) return true;
  if (key === 'cccd_name' && targetApp.lockedIdentity?.fullName) return true;
  if (key === 'cccd_dob' && targetApp.lockedIdentity?.dob) return true;
  return false;
}

export const isSmall = (photo: PhotoAsset) => Math.min(photo.width, photo.height) < 480;

export function todayVnIso() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

/** Formats user-facing slot warnings while hiding internal-only codes such as OCR_UNSUPPORTED. */
export function visibleObservationWarnings(codes: readonly string[]): string[] {
  const list = codes
    .map(code => warningLabels[code])
    .filter((msg): msg is string => Boolean(msg));
  return [...new Set(list)];
}

export function formatServerWarning(warning: VerificationWarning): string {
  return [warning.humanReadableMessage, warning.recommendedAction]
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function formatGenderValue(value: string | undefined): string {
  if (value === 'MALE') return 'Nam';
  if (value === 'FEMALE') return 'Nữ';
  return '—';
}
