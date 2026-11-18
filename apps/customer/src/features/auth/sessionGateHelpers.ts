import { AuthApiError } from "@datxe/shared";

export type SessionGateOutcome =
  | { kind: "navigate"; destination: string }
  | { kind: "error"; message: string; shouldSuggestLogin: boolean };

const NETWORK_CODES = new Set([
  "NETWORK_ERROR",
  "auth/network-request-failed",
  "ECONNABORTED",
  "TIMEOUT",
]);

const SERVER_TRANSIENT_CODES = new Set([
  "HTTP_500",
  "HTTP_502",
  "HTTP_503",
  "HTTP_504",
  "HTTP_429",
  "INVALID_SERVER_RESPONSE",
]);

const EXPIRED_AUTH_CODES = new Set([
  "HTTP_401",
  "UNAUTHORIZED",
  "INVALID_TOKEN",
  "auth/user-token-expired",
  "auth/invalid-user-token",
]);

export function classifyCustomerSessionFailure(cause: unknown): SessionGateOutcome {
  const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
  if (cause instanceof AuthApiError && code === "ACCOUNT_NOT_FOUND") {
    return { kind: "navigate", destination: "/(auth)/register" };
  }
  if (NETWORK_CODES.has(code)) {
    return {
      kind: "error",
      message: "Không kết nối được với máy chủ. Kiểm tra mạng rồi thử lại.",
      shouldSuggestLogin: false,
    };
  }
  if (SERVER_TRANSIENT_CODES.has(code)) {
    return {
      kind: "error",
      message: "Hệ thống đang tạm gián đoạn. Vui lòng thử lại sau ít phút.",
      shouldSuggestLogin: false,
    };
  }
  if (EXPIRED_AUTH_CODES.has(code)) {
    return {
      kind: "error",
      message: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
      shouldSuggestLogin: true,
    };
  }
  return {
    kind: "error",
    message:
      cause instanceof AuthApiError && cause.message
        ? cause.message
        : "Chưa khôi phục được phiên. Hãy thử lại.",
    shouldSuggestLogin: false,
  };
}
