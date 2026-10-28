const fs = require('node:fs');
const path = require('node:path');

module.exports = function withSentryRouterCompat(config) {
  const legacyStore = path.join(path.dirname(require.resolve('expo-router/package.json')), 'build/global-state/router-store.js');
  if (fs.existsSync(legacyStore)) return config;

  const previous = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, name, platform) => {
    const origin = context.originModulePath.replaceAll('\\', '/');
    if (name === 'expo-router/build/global-state/router-store' && origin.includes('/@sentry/react-native/')) {
      // Sentry treats this internal store as optional and returns null if absent.
      // SDK 58 removed it. An empty module preserves that fallback without asking
      // Metro to resolve a stale package export. Error capture remains enabled.
      return { type: 'empty' };
    }
    return (previous ?? context.resolveRequest)(context, name, platform);
  };
  return config;
};
