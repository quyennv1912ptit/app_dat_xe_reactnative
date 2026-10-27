import { env } from '@/config/env';
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: env.sentryDsn, enabled: Boolean(env.sentryDsn), sendDefaultPii: false });
export function logError(error: unknown) { Sentry.captureException(error); if (__DEV__) console.error(error); }
