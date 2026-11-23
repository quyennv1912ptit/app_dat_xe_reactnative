const AUTH_CALLBACK_PATTERNS = [
  /firebaseauth\/link/i,
  /\/__\/auth\/callback/i,
  /[?&]recaptchaToken=/i,
  /^com\.googleusercontent\.apps\./i,
  /^fb\d+:\/\//i,
];

const BARE_SCHEME_ROOT = /^[a-z][a-z0-9+.-]*:\/{0,3}$/i;

/**
 * Intercepts native deep links before Expo Router navigates.
 * Firebase Phone Auth reCAPTCHA, Google Sign-In, and Facebook SDK return to the
 * app via custom URL schemes that are already handled by the native SDKs.
 * Returning `null` while the app is open (`!initial`) keeps the user on their
 * active screen (e.g. OTP verification or phone linking) instead of pushing
 * Expo Router's "Unmatched Route" screen.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  const trimmed = path.trim();
  const isSdkAuthCallback =
    AUTH_CALLBACK_PATTERNS.some((pattern) => pattern.test(trimmed)) ||
    BARE_SCHEME_ROOT.test(trimmed);

  if (isSdkAuthCallback) {
    return initial ? "/" : null;
  }

  return path;
}
