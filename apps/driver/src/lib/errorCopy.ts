const VIETNAMESE_TEXT =
  /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

export const SERVER_ERROR_FALLBACK =
  'Không tải được dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.';

/**
 * Lỗi kỹ thuật từ máy chủ (ví dụ Spring trả "No static resource api/driver/documents.")
 * không được hiện nguyên văn cho tài xế. Câu đã là tiếng Việt thì giữ nguyên.
 */
export function serverErrorCopy(message?: string | null): string | undefined {
  const value = message?.trim();
  if (!value) return undefined;
  return VIETNAMESE_TEXT.test(value) ? value : SERVER_ERROR_FALLBACK;
}
