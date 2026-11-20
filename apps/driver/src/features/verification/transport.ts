export class VerificationError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(messages[code] ?? 'Máy chủ chưa xử lý được yêu cầu. Bạn có thể thử lại.');
    this.code = code;
  }
}

const messages: Record<string, string> = {
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  NETWORK: 'Mất kết nối với máy chủ. Ảnh và thay đổi trong phiên vẫn được giữ. Hãy thử lại khi có mạng.',
  TIMEOUT: 'Kết nối quá thời gian. Hãy thử lại hoặc làm mới trạng thái.',
  ENGINE_TIMEOUT: 'Đọc ảnh quá thời gian. Bạn có thể nhập tay hoặc thử lại.',
  ENGINE_BUSY: 'Máy chủ đang bận. Hãy thử lại sau.',
  REVISION_CONFLICT: 'Hồ sơ đã thay đổi. Hãy làm mới trạng thái trước khi tiếp tục.',
  INVALID_TRANSITION: 'Hồ sơ đang được xử lý. Hãy làm mới trạng thái.',
  INVALID_IMAGE: 'Ảnh không hợp lệ. Hãy chọn hoặc chụp lại.',
  IMAGE_TOO_LARGE: 'Ảnh vượt giới hạn. Hãy chọn ảnh có dung lượng nhỏ hơn.',
  DOCUMENT_REMOVED: 'Ảnh đã hết thời hạn lưu.',
  RATE_LIMITED: 'Bạn đã tải nhiều ảnh trong thời gian ngắn. Hãy đợi rồi thử lại.',
  WARNING_ACK_REQUIRED: 'Hãy xem và xác nhận cảnh báo của bản hồ sơ hiện tại.',
  FIELD_MISSING: 'Kiểm tra các ảnh bắt buộc và xác nhận thông tin trước khi nộp.',
  EXTRACTION_REQUIRED: 'Cần kiểm tra tự động tất cả ảnh giấy tờ trước khi gửi hồ sơ.',
  IDENTITY_LOCKED: 'Thông tin định danh đã xác minh không thể tự ý thay đổi.',
  IDENTITY_MISMATCH: 'Giấy tờ không khớp với danh tính đã xác minh của tài khoản.',
  DUPLICATE_DOCUMENT: 'Số giấy tờ này đã được xác minh cho một tài khoản khác.',
  VERIFICATION_ACTIVATION_BLOCKED: 'Hồ sơ có cảnh báo nghiêm trọng chặn phê duyệt.',
};

function isDevLocalHost(hostname: string) {
  if (['127.0.0.1', 'localhost', '10.0.2.2', '[::1]'].includes(hostname)) return true;
  // Allow private RFC1918 LAN IPv4 addresses during local Expo device testing against Spring Boot.
  return /^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

export function verificationOrigin(value: string | undefined, development: boolean) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const local = isDevLocalHost(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/'
      || (url.protocol !== 'https:' && !(development && local && url.protocol === 'http:'))) return;
    return url.origin;
  } catch { return undefined; }
}

type TransportResponse = Pick<Response, 'ok' | 'status' | 'headers' | 'json' | 'arrayBuffer'>;
type Fetcher = (url: string, options: RequestInit) => Promise<TransportResponse>;
type Options = RequestInit & { timeoutMs?: number };
export function authenticatedTransport(
  origin: string,
  token: (refresh: boolean) => Promise<string>,
  fetcher: Fetcher,
) {
  async function request<T>(path: string, opts: Options = {}, preview = false): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (opts.signal?.aborted) abort();
    opts.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, opts.timeoutMs ?? 35000);
    let cancel: (() => void) | undefined;
    const stopped = new Promise<never>((_, reject) => {
      cancel = () => reject(new VerificationError(timedOut ? 'TIMEOUT' : 'CANCELLED'));
      controller.signal.addEventListener('abort', cancel, { once: true });
      if (controller.signal.aborted) cancel();
    });
    const call = async () => {
      const url = origin + '/ekyc/driver-verification/v1/' + path;
      const headers = new Headers(opts.headers);
      const send = async (refresh: boolean) => {
        const bearer = await token(refresh);
        if (controller.signal.aborted) throw new VerificationError('CANCELLED');
        headers.set('Authorization', 'Bearer ' + bearer);
        headers.set('X-Role', 'DRIVER');
        return fetcher(url, { ...opts, headers, signal: controller.signal, redirect: 'error', credentials: 'omit' });
      };
      let response = await send(false);
      if (response.status === 401) response = await send(true);
      if (response.status === 401) throw new VerificationError('UNAUTHORIZED');
      const mime = response.headers.get('content-type') ?? '';
      if (preview && response.ok && /^image\/(jpeg|png|webp)$/.test(mime)) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!bytes.length || bytes.length > 8_000_000) throw new VerificationError('INVALID_IMAGE');
        return { mime, bytes } as T;
      }
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true || result.data == null || preview) {
        throw new VerificationError(result?.errorCode ?? 'SERVER');
      }
      return result.data as T;
    };
    try {
      return await Promise.race([call(), stopped]);
    } catch (error) {
      if (timedOut) throw new VerificationError('TIMEOUT');
      if (controller.signal.aborted) throw new VerificationError('CANCELLED');
      if (error instanceof VerificationError) throw error;
      throw new VerificationError('NETWORK');
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', abort);
      if (cancel) controller.signal.removeEventListener('abort', cancel);
    }
  }
  return {
    json: <T>(path: string, options?: Options) => request<T>(path, options),
    preview: (path: string, signal: AbortSignal) =>
      request<{ mime: string; bytes: Uint8Array }>(path, { signal }, true),
  };
}
