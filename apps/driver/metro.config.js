const { getDefaultConfig } = require('expo/metro-config');
const withSentryRouterCompat = require('../../packages/config/metro-sentry-compat.cjs');
module.exports = withSentryRouterCompat(getDefaultConfig(__dirname));
