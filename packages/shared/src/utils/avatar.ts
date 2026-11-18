/** Chuẩn hóa tên hiển thị trước khi lấy chữ cái viết tắt, loại bỏ mã tiền tố và phần ghi chú trong ngoặc cuối. */
export function getCleanDisplayName(value: string | null | undefined): string {
  if (!value) return '';

  const withoutPrefix = value.trim().replace(/^([A-Z0-9]{6,})\s*[-–—]\s*/i, (match: string, code: string) => (
    /[A-Z]/i.test(code) && /\d/.test(code) ? '' : match
  ));

  return withoutPrefix
    .replace(/\s*\([^()\s]+\)\s*$/, '')
    .trim();
}

/** Tạo tối đa 2 chữ cái viết tắt an toàn cho avatar từ tên người dùng, bỏ qua ký tự ngoặc/dấu câu. */
export function getAvatarInitials(
  value: string | null | undefined,
  fallback = 'TX',
  locale = 'vi-VN',
): string {
  const cleaned = getCleanDisplayName(value);
  const words = cleaned.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (words.length === 0) return fallback;

  return words
    .slice(-2)
    .map((word) => [...word][0] ?? '')
    .join('')
    .toLocaleUpperCase(locale);
}
