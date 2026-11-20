import type { VerificationWarning } from "./api";

const reviewNotes: Record<string, string> = {
  CARD_NOT_FOUND: 'Hệ thống chưa nhận diện được khung thẻ. Kiểm tra ảnh đủ bốn góc, rõ chữ. Nếu ảnh đã rõ, có thể gửi để xét duyệt.',
  OCR_INCOMPLETE: 'Chưa đọc đủ thông tin tự động. Kiểm tra và bổ sung thông tin theo giấy tờ.',
  QR_LIVE_SCAN_UNBOUND: 'Mã QR đã quét sẽ được người xét duyệt đối chiếu với ảnh giấy tờ.',
  QR_OCR_INSUFFICIENT_EVIDENCE: 'Chưa đủ thông tin đọc từ ảnh để đối chiếu với QR. Kiểm tra thông tin đã điền theo giấy tờ.',
  FACE_NOT_EVALUATED: 'Ảnh chân dung sẽ được kiểm tra khi xét duyệt. Bạn có thể tiếp tục gửi hồ sơ.',
};

export function driverWarningMessage(warning: VerificationWarning): string {
  if (!warning.blocksSubmission && !warning.blocksActivation
    && warning.severity !== 'CRITICAL' && warning.severity !== 'BLOCKING' && reviewNotes[warning.code]) {
    return reviewNotes[warning.code];
  }
  return [warning.humanReadableMessage, warning.recommendedAction].filter(Boolean).join(' ').trim();
}

/** Quality captions describe image evidence only, never QR binding or extraction availability. */
export function isPhotoQualityWarning(warning: { code: string }): boolean {
  return ['IMAGE_BLURRY', 'IMAGE_GLARE', 'IMAGE_TOO_SMALL', 'CARD_CROPPED',
    'FACE_INSUFFICIENT_QUALITY'].includes(warning.code);
}

export function groupVerificationWarnings(warnings: readonly VerificationWarning[]) {
  const groups = new Map<string, { key: string; warning: VerificationWarning; slots: string[] }>();
  for (const warning of warnings) {
    const key = JSON.stringify([
      warning.code, warning.severity, warning.humanReadableMessage, warning.recommendedAction,
      warning.fieldKey, warning.blocksSubmission, warning.blocksActivation,
    ]);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { key, warning, slots: warning.slot ? [warning.slot] : [] });
    } else if (warning.slot && !group.slots.includes(warning.slot)) {
      group.slots.push(warning.slot);
    }
  }
  return [...groups.values()];
}
