import type { AuthProfile } from './authService';
export type AuthConfig = { apiUrl: string; googleWebClientId?: string; facebookAppId?: string; facebookClientToken?: string; onAuthenticated?: (profile: AuthProfile) => void; onSignedOut?: () => void };
let config: AuthConfig | undefined;
export function configureAuth(value: AuthConfig) { config = value; }
export function getAuthConfig(): AuthConfig { if (!config) throw new Error('Auth chưa được cấu hình.'); return config; }
