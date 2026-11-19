// Local, on-device quality signals for a freshly captured photo.
// Only facts that are really measured produce 'pass'. Everything we cannot
// measure on the phone is reported as 'unchecked' - never as passed.

export type CheckState = 'pass' | 'warn' | 'fail' | 'unchecked';
export type CaptureKind = 'document' | 'selfie';
export type QualityCheck = { id: string; state: CheckState; label: string; detail?: string };
export type CaptureFacts = {
  width: number;
  height: number;
  bytes?: number | null;
  mimeType?: string | null;
  exif?: Record<string, unknown> | null;
};

// Same limits the backend and the previous capture flow already enforce.
export const MIN_SHORT_SIDE = 480;
export const MAX_BYTES = 8_000_000;
export const MAX_SIDE = 16384;
export const MAX_PIXELS = 40_000_000;
// Heuristic exposure signals from camera EXIF (not OCR thresholds).
export const LONG_EXPOSURE_SECONDS = 1 / 30;
export const HIGH_ISO = 1600;

const numeric = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};
const firstNumeric = (values: unknown[]): number | undefined => {
  for (const value of values) {
    const found = numeric(Array.isArray(value) ? value[0] : value);
    if (found !== undefined) return found;
  }
  return undefined;
};

export function readExposure(exif: Record<string, unknown> | null | undefined) {
  if (!exif) return {};
  return {
    exposureSeconds: firstNumeric([exif.ExposureTime, exif.exposureTime]),
    iso: firstNumeric([exif.ISOSpeedRatings, exif.PhotographicSensitivity, exif.ISO, exif.iso]),
  };
}

export function mimeFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return '';
}

export function assessCapture(facts: CaptureFacts, kind: CaptureKind): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const { width, height } = facts;
  const valid = Number.isFinite(width) && Number.isFinite(height) && width >= 2 && height >= 2;

  const mime = (facts.mimeType ?? '').toLowerCase();
  checks.push(/^image\/(jpeg|png|webp)$/.test(mime)
    ? { id: 'format', state: 'pass', label: 'Định dạng ảnh', detail: mime.replace('image/', '').toUpperCase() }
    : { id: 'format', state: 'fail', label: 'Định dạng ảnh', detail: 'Cần JPEG, PNG hoặc WebP.' });

  if (facts.bytes == null || facts.bytes <= 0) {
    checks.push({ id: 'size', state: 'unchecked', label: 'Dung lượng', detail: 'Chưa đọc được dung lượng.' });
  } else if (facts.bytes > MAX_BYTES) {
    checks.push({ id: 'size', state: 'fail', label: 'Dung lượng', detail: 'Vượt 8 MB, hãy chụp lại.' });
  } else {
    checks.push({ id: 'size', state: 'pass', label: 'Dung lượng', detail: (facts.bytes / 1_000_000).toFixed(1) + ' MB' });
  }

  if (!valid || Math.max(width, height) > MAX_SIDE || width * height > MAX_PIXELS) {
    checks.push({ id: 'resolution', state: 'fail', label: 'Kích thước ảnh', detail: 'Kích thước ảnh không hợp lệ.' });
  } else if (Math.min(width, height) < MIN_SHORT_SIDE) {
    checks.push({
      id: 'resolution', state: 'warn', label: 'Kích thước ảnh',
      detail: width + '×' + height + ' px - cạnh ngắn dưới ' + MIN_SHORT_SIDE + ' px, chữ có thể khó đọc.',
    });
  } else {
    checks.push({ id: 'resolution', state: 'pass', label: 'Kích thước ảnh', detail: width + '×' + height + ' px' });
  }

  const { exposureSeconds, iso } = readExposure(facts.exif);
  if (exposureSeconds !== undefined && exposureSeconds > LONG_EXPOSURE_SECONDS) {
    checks.push({
      id: 'light', state: 'warn', label: 'Ánh sáng và độ rung khi chụp',
      detail: 'Máy phải phơi sáng lâu nên ảnh dễ mờ do rung. Hãy thêm sáng hoặc giữ máy chắc hơn.',
    });
  } else if (iso !== undefined && iso >= HIGH_ISO) {
    checks.push({
      id: 'light', state: 'warn', label: 'Ánh sáng khi chụp',
      detail: 'Máy phải tăng độ nhạy sáng cao (ISO ' + Math.round(iso) + '), môi trường có thể thiếu sáng.',
    });
  } else if (exposureSeconds !== undefined || iso !== undefined) {
    checks.push({ id: 'light', state: 'pass', label: 'Ánh sáng và độ rung khi chụp', detail: 'Thông số chụp của máy ở mức bình thường.' });
  } else {
    checks.push({ id: 'light', state: 'unchecked', label: 'Ánh sáng khi chụp', detail: 'Máy không cung cấp thông số phơi sáng.' });
  }

  checks.push({ id: 'sharpness', state: 'unchecked', label: 'Độ nét', detail: 'Chưa kiểm tra trên máy. Hãy tự xem kỹ chữ trong ảnh.' });
  checks.push(kind === 'document'
    ? { id: 'content', state: 'unchecked', label: 'Đủ bốn góc, lóa, đúng mặt', detail: 'Chưa kiểm tra. Hệ thống kiểm tra sau khi gửi ảnh đi đọc thông tin.' }
    : { id: 'content', state: 'unchecked', label: 'Khuôn mặt', detail: 'Chưa tự kiểm tra khuôn mặt hay người thật.' });
  return checks;
}

export function summarizeChecks(checks: QualityCheck[]) {
  const blocking = checks.some(check => check.state === 'fail');
  const warnings = checks.filter(check => check.state === 'warn');
  const passed = checks.filter(check => check.state === 'pass');
  return { blocking, warnings, passed, hasWarning: warnings.length > 0 };
}
