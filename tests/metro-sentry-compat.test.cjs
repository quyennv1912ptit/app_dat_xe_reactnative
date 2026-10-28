const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(legacyExists = false) {
  const module = { exports: {} };
  const mockedRequire = name => name === 'node:fs' ? { existsSync: () => legacyExists } : require(name);
  mockedRequire.resolve = () => path.resolve(__dirname, '../node_modules/expo-router/package.json');
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../packages/config/metro-sentry-compat.cjs'), 'utf8'), { module, require: mockedRequire });
  return module.exports;
}

test('only Sentry gets an empty optional store when Expo Router removed it', () => {
  const fallback = { type: 'sourceFile', filePath: 'normal.js' };
  const config = load()({ resolver: { resolveRequest: () => fallback } });
  const sentry = { originModulePath: 'D:\\repo\\node_modules\\@sentry\\react-native\\dist\\js\\tracing\\expoRouterStore.js' };
  const app = { originModulePath: 'D:/repo/apps/customer/src/app/index.tsx' };
  assert.equal(config.resolver.resolveRequest(sentry, 'expo-router/build/global-state/router-store', 'android').type, 'empty');
  assert.equal(config.resolver.resolveRequest(app, 'expo-router/build/global-state/router-store', 'android'), fallback);
  assert.equal(config.resolver.resolveRequest(sentry, 'expo-router', 'android'), fallback);
});

test('an installed legacy store and Metro default resolution stay intact', () => {
  const previous = () => 'existing';
  assert.equal(load(true)({ resolver: { resolveRequest: previous } }).resolver.resolveRequest, previous);
  const config = load()({ resolver: {} });
  assert.equal(config.resolver.resolveRequest({ originModulePath: '/app.tsx', resolveRequest: () => 'default' }, 'react', 'android'), 'default');
});
