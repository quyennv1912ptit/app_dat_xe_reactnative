const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const tick = () => new Promise(resolve => setImmediate(resolve));
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, setInterval, clearInterval, require: name => { if (name in mocks) return mocks[name]; throw Error(name); } });
  return exports;
}

function fixture({ ride = null, mode = 'ok', status = 'ONLINE' } = {}) {
  const effects = [], published = [], updates = [];
  const sample = { timestamp: Date.now(), coords: { latitude: 21.03, longitude: 105.84, accuracy: 10 } };
  let callback, heartbeats = 0, removed = 0, backgroundStarts = 0, stops = 0;
  const user = { id: 4, status };
  const store = selector => selector({ user });
  store.getState = () => ({ setActiveRide() {} });
  const health = selector => selector({ retryVersion: 0 });
  health.getState = () => ({ update: value => updates.push(value), retry() {} });
  const api = load('apps/driver/src/components/DriverRealtimeBridge.tsx', {
    '@/config/env': { env: { locationIntervalMs: 4000 } }, '@/lib/api': {},
    '@/lib/backgroundLocation': {
      publishDriverLocation: point => published.push(point), restoreLastLocation: async () => {},
      startDriverBackgroundLocation: () => {
        backgroundStarts++;
        if (mode === 'pending') return new Promise(() => {});
        if (mode === 'denied') return Promise.resolve(false);
        if (mode === 'unsupported') return Promise.reject(Error('unsupported'));
        return Promise.resolve(true);
      },
      startDriverLocationHeartbeat: () => { heartbeats++; },
      stopDriverBackgroundLocation: async () => { stops++; },
    },
    '@/lib/realtime': { driverRealtime: {} }, '@/lib/store': { useSessionStore: store },
    '@/lib/driverHealth': { useDriverHealth: health },
    '@tanstack/react-query': {
      useQuery: ({ queryKey }) => ({ data: queryKey[1] === 'activeRide' ? ride : null }),
      useQueryClient: () => ({}),
    },
    '@datxe/ui': { ensureForegroundLocationPermission: location => location.getForegroundPermissionsAsync() },
    'expo-location': {
      Accuracy: { High: 4 }, hasServicesEnabledAsync: async () => true,
      requestForegroundPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
      getForegroundPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
      getCurrentPositionAsync: async () => sample,
      watchPositionAsync: async (_options, handler) => { callback = handler; return { remove: () => { removed++; } }; },
      getBackgroundPermissionsAsync: async () => { throw Error('unsupported'); },
    },
    react: { useEffect: fn => effects.push(fn), useRef: initial => ({ current: initial }) },
    'react-native': { AppState: {} },
  });
  api.DriverRealtimeBridge();
  return {
    effects, published, sample,
    heartbeats: () => heartbeats,
    removed: () => removed,
    backgroundStarts: () => backgroundStarts,
    stops: () => stops,
    emit: value => callback(value),
  };
}

for (const mode of ['pending', 'denied', 'unsupported']) {
  test(`foreground GPS starts while background permission is ${mode}`, async () => {
    const f = fixture({ mode });
    const cleanup = f.effects[3]();
    await tick();
    assert.equal(f.heartbeats(), 1);
    assert.equal(f.published[0], f.sample);
    f.emit(f.sample);
    assert.equal(f.published.length, 2);
    assert.equal(f.removed(), 0, 'foreground subscription stays alive without background service');
    assert.equal(f.backgroundStarts(), 1, 'ONLINE driver attempts to start background location service');
    f.effects[4]();
    assert.equal(f.stops(), 0, 'ONLINE driver keeps background GPS alive');
    cleanup();
    assert.equal(f.removed(), 1);
    f.emit(f.sample);
    assert.equal(f.published.length, 2, 'old watcher cannot publish after cleanup');
  });
}

test('background location runs while ONLINE or on an active ride and stops when OFFLINE without a ride', async () => {
  const riding = fixture({ ride: { id: 12 } });
  const cleanup = riding.effects[3]();
  await tick();
  assert.equal(riding.backgroundStarts(), 1, 'an active ride needs background GPS');
  riding.effects[4]();
  assert.equal(riding.stops(), 0, 'an active ride must keep background GPS');
  cleanup();

  const offline = fixture({ ride: null, status: 'OFFLINE' });
  offline.effects[4]();
  assert.equal(offline.stops(), 1, 'OFFLINE driver without active ride stops background GPS immediately');
});

test('completing a ride triggers stop hook and background task verifies ride or ONLINE/BUSY status', () => {
  const inProgress = fs.readFileSync('apps/driver/src/features/ride/hooks/useInProgress.ts', 'utf8');
  assert.match(inProgress, /stopDriverBackgroundLocation\(\)/);
  assert.match(inProgress, /endpoint === 'complete'[\s\S]*stopDriverBackgroundLocation/);

  const background = fs.readFileSync('apps/driver/src/lib/backgroundLocation.ts', 'utf8');
  assert.match(background, /ride \|\| profile\?\.status === 'ONLINE'/);
  assert.match(background, /Promise\.allSettled/);
});
