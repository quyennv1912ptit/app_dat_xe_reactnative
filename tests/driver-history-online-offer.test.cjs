const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');

function loadTs(relPath, mocks = {}) {
  const fullPath = path.join(ROOT, relPath);
  const src = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  const mod = { exports: {} };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
    Fragment: Symbol('Fragment'),
    memo: fn => fn,
  };
  const reactGlobal = mocks.react ?? react;
  vm.runInNewContext(compiled, {
    exports: mod.exports,
    module: mod,
    URLSearchParams,
    React: reactGlobal,
    require: name => {
      if (name === 'react') return reactGlobal;
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected require(${name}) in ${relPath}`);
    },
  });
  return mod.exports;
}

function collectText(node) {
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (typeof node === 'object') {
    if (typeof node.type === 'function') {
      return collectText(node.type({ ...(node.props ?? {}), children: node.children }));
    }
    return [
      ...(node.props?.label ? [String(node.props.label)] : []),
      ...(node.props?.onlineVehicleLabel ? [`onlineVehicleLabel:${node.props.onlineVehicleLabel}`] : []),
      ...collectText(node.children),
    ];
  }
  return [];
}

function findByAttr(node, key) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => findByAttr(child, key));
  const own = node.props && key in node.props ? [node.props] : [];
  if (typeof node.type === 'function') {
    return [...own, ...findByAttr(node.type({ ...(node.props ?? {}), children: node.children }), key)];
  }
  return [...own, ...findByAttr(node.children, key)];
}

test('driverApi.rides sends q, status, createdFrom, createdTo while staying backwards compatible', async () => {
  const paths = [];
  const { driverApi } = loadTs('apps/driver/src/lib/driverApi.ts', {
    './api': {
      request: async rel => {
        paths.push(rel);
        return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false };
      },
    },
  });

  await driverApi.rides(2);
  await driverApi.rides(0, 'COMPLETED');
  await driverApi.rides(1, {
    status: 'COMPLETED',
    q: '  Cầu Giấy  ',
    createdFrom: '2026-11-10T17:00:00.000Z',
    createdTo: '2026-11-17T17:00:00.000Z',
  });
  await driverApi.rides(0, { q: '   ', status: '' });

  assert.equal(paths[0], '/driver/rides?page=2&size=20');
  assert.equal(paths[1], '/driver/rides?page=0&size=20&status=COMPLETED');
  const url = new URL(`https://example.test${paths[2]}`);
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('size'), '20');
  assert.equal(url.searchParams.get('status'), 'COMPLETED');
  assert.equal(url.searchParams.get('q'), 'Cầu Giấy');
  assert.equal(url.searchParams.get('createdFrom'), '2026-11-10T17:00:00.000Z');
  assert.equal(url.searchParams.get('createdTo'), '2026-11-17T17:00:00.000Z');
  assert.equal(paths[3], '/driver/rides?page=0&size=20');
});

test('useHistory encodes all filter params into queryKey to reset pagination and forwards params to historyApi.rides', async () => {
  const queries = [];
  const rideCalls = [];
  const { useHistory } = loadTs('apps/driver/src/features/history/hooks/useHistory.ts', {
    '@tanstack/react-query': {
      useInfiniteQuery: config => {
        queries.push(config);
        return { data: null, refetch: async () => {} };
      },
    },
    '@/lib/useRefreshOnFocus': { useRefreshOnFocus() {} },
    '../api': {
      historyApi: {
        rides: (page, filters) => {
          rideCalls.push({ page, filters });
          return Promise.resolve({ content: [], page, size: 20, totalElements: 0, totalPages: 0, hasNext: true });
        },
      },
    },
  });

  useHistory({ status: 'COMPLETED', q: '  30A-123  ', createdFrom: '2026-11-10T17:00:00.000Z' });
  useHistory({ status: 'CANCELLED', q: '30A-123', createdFrom: '2026-11-10T17:00:00.000Z' });
  useHistory({ status: 'COMPLETED', q: 'Cầu Giấy', createdFrom: '2026-11-10T17:00:00.000Z' });

  assert.notDeepEqual(queries[0].queryKey, queries[1].queryKey, 'status change resets queryKey and pagination');
  assert.notDeepEqual(queries[0].queryKey, queries[2].queryKey, 'search keyword change resets queryKey and pagination');
  assert.equal(queries[0].initialPageParam, 0);
  await queries[0].queryFn({ pageParam: 0 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rideCalls[0])), {
    page: 0,
    filters: { status: 'COMPLETED', q: '30A-123', createdFrom: '2026-11-10T17:00:00.000Z' },
  });
});

test('HistoryScreen sends server-side week cutoff and search query without client-side truncation', () => {
  const src = fs.readFileSync(path.join(ROOT, 'apps/driver/src/features/history/screens/HistoryScreen.tsx'), 'utf8');
  assert.match(src, /createdFrom:\s*weekCreatedFrom/);
  assert.match(src, /q:\s*search\.trim\(\)\s*\|\|\s*undefined/);
  assert.doesNotMatch(src, /loadedTrips\.filter/);
  assert.doesNotMatch(src, /Chưa có chuyến phù hợp trong các trang đã tải/);
});

test('useSessionStore and useHome sync onlineVehicleType from backend without guessing', async () => {
  const { create } = require(path.join(ROOT, 'node_modules/zustand'));
  const { useSessionStore } = loadTs('apps/driver/src/lib/store.ts', { zustand: { create } });

  const baseProfile = {
    id: 12,
    role: 'DRIVER',
    firebaseUid: 'drv-12',
    fullName: 'Tài xế A',
    email: null,
    phoneNumber: '+84900000012',
    status: 'ONLINE',
    verificationStatus: 'APPROVED',
  };

  useSessionStore.getState().setUser({ ...baseProfile, onlineVehicleType: 'CAR' });
  assert.equal(useSessionStore.getState().onlineVehicleType, 'CAR');

  useSessionStore.getState().setUser({ ...baseProfile, status: 'BUSY', onlineVehicleType: 'MOTORCYCLE' });
  assert.equal(useSessionStore.getState().onlineVehicleType, 'MOTORCYCLE');

  useSessionStore.getState().setUser({ ...baseProfile, status: 'ONLINE' });
  assert.equal(useSessionStore.getState().onlineVehicleType, null, 'unconfirmed backend onlineVehicleType stays null');

  useSessionStore.getState().setUser({ ...baseProfile, status: 'ONLINE', onlineVehicleType: 'CAR' });
  useSessionStore.getState().setUser({ ...baseProfile, status: 'OFFLINE', onlineVehicleType: 'CAR' });
  assert.equal(useSessionStore.getState().onlineVehicleType, null);

  let availabilityOptions;
  const invalidated = [];
  const { useHome } = loadTs('apps/driver/src/features/offers/hooks/useHome.ts', {
    '@/lib/driverCapabilities': { capabilitiesKey: ['driver', 'capabilities'], getCapabilities: async () => null },
    '@/lib/useDriverCredit': { useDriverCredit: () => ({ allowed: true, refetch: async () => ({ data: { canReceive: true } }) }) },
    '@/lib/driverOffer': { usePendingOffer: () => ({ refetch: async () => {} }) },
    '@/lib/driverApi': { driverApi: { skills: async () => [], documents: async () => [] } },
    '@/lib/store': { useSessionStore },
    '@/lib/useRefreshOnFocus': { useRefreshOnFocus() {} },
    '@tanstack/react-query': {
      useMutation: opts => {
        availabilityOptions = opts;
        return opts;
      },
      useQuery: () => ({ data: null, refetch: async () => {} }),
      useQueryClient: () => ({ invalidateQueries: key => { invalidated.push(key); return Promise.resolve(); } }),
    },
    'expo-router': { useRouter: () => ({}) },
    '../api': {
      getHomeDailySummary: async () => null,
      getHomeActiveRide: async () => null,
      getHomeSession: async () => null,
      getHomeVerification: async () => null,
      setDriverAvailability: async () => ({ status: 'ONLINE', onlineVehicleType: 'CAR' }),
    },
  });

  useHome();
  await availabilityOptions.onSuccess({ status: 'ONLINE', onlineVehicleType: 'MOTORCYCLE' }, { online: true, vehicle_type: 'CAR' });
  assert.equal(useSessionStore.getState().onlineVehicleType, 'MOTORCYCLE');
  await availabilityOptions.onSuccess({ status: 'ONLINE' }, { online: true, vehicle_type: 'CAR' });
  assert.equal(useSessionStore.getState().onlineVehicleType, null, 'never fallback to request variable when backend omits onlineVehicleType');
  assert.equal(invalidated.length, 2);
});

test('HomeScreen does not guess vehicleTypes[0] when backend has not confirmed onlineVehicleType', () => {
  let onlineVehicleTypeStore = null;
  let sessionData = { id: 1, status: 'ONLINE', fullName: 'Tài xế' };
  const makeProps = () => {
    const mod = loadTs('apps/driver/src/features/offers/screens/HomeScreen.tsx', {
      '../components/HomeDriverHeader': { HomeDriverHeader: () => null },
      '../components/HomeOperationalStatus': { HomeOperationalStatus: props => ({ type: 'HomeOperationalStatus', props, children: props.children }) },
      '@/components/DriverPage': { DriverPage: ({ intro, children }) => ({ type: 'DriverPage', props: {}, children: [intro, children] }) },
      '@/components/MyDriverReviews': { MyDriverReviews: () => null },
      '@/components/DriverChatButton': { DriverChatButton: () => null },
      '@/components/StatusBadge': { StatusBadge: () => null },
      '@/lib/displayLabels': {
        transmissionLabel: v => v,
        vehicleTypeLabel: v => (v === 'CAR' ? 'Ô tô' : 'Xe máy'),
      },
      '@/components/rideStyles': { rideStyles: () => ({}) },
      '@/lib/store': { useSessionStore: selector => selector({ onlineVehicleType: onlineVehicleTypeStore }) },
      '@datxe/shared': { formatMoney: v => String(v) },
      '@datxe/ui': {
        Button: () => null,
        Card: () => null,
        Typography: 'Text',
        borderRadius: { full: 999 },
        spacing: { spaceSm: 8, spaceMd: 16, px3: 12 },
        useThemeColors: () => ({ surfaceContainerHigh: '#eee', primary: '#007F46' }),
        useThemedStyles: () => ({}),
      },
      '@expo/vector-icons': { MaterialIcons: 'MaterialIcons' },
      'react-native': { StyleSheet: { create: x => x }, View: 'View' },
      'react-native-paper': { RadioButton: { Group: 'Group', Item: 'Item' } },
      '../hooks/useHome': {
        useHome: () => ({
          router: { push() {}, navigate() {} },
          credit: { allowed: true, data: { canReceive: true }, isFetching: false, refetch: async () => {} },
          capabilities: { data: null, isLoading: false, refetch: async () => {} },
          summary: { data: null, isLoading: false, isError: false, refetch: async () => {} },
          session: { data: sessionData, isLoading: false, error: null, refetch: async () => {} },
          verification: { data: { verification_status: 'APPROVED' }, isLoading: false, error: null, refetch: async () => {} },
          active: { data: null, isLoading: false, isError: false, error: null, refetch: async () => {} },
          offer: { data: null, error: null, refetch: async () => {} },
          skills: { data: [{ id: 1, verified: true, vehicle_type: 'CAR', transmission: 'AUTO' }], isLoading: false, error: null, refetch: async () => {} },
          documents: { data: [], isLoading: false, error: null, refetch: async () => {} },
          availability: { isPending: false, error: null, mutate() {} },
        }),
      },
      react: {
        createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
        Fragment: 'Fragment',
        useState: init => [init, () => {}],
      },
    });
    return mod.default;
  };

  const Screen = makeProps();
  const unconfirmedTree = Screen();
  const unconfirmedStatus = findByAttr(unconfirmedTree, 'onlineVehicle')[0];
  assert.equal(unconfirmedStatus.onlineVehicle, null);

  sessionData = { id: 1, status: 'ONLINE', fullName: 'Tài xế', onlineVehicleType: 'CAR' };
  onlineVehicleTypeStore = 'CAR';
  const confirmedTree = Screen();
  const confirmedStatus = findByAttr(confirmedTree, 'onlineVehicle')[0];
  assert.equal(confirmedStatus.onlineVehicle, 'CAR');
});

test('OfferDecision avoids claiming "Đã trả qua ví" unless paymentStatus === PAID', () => {
  const { OfferDecision } = loadTs('apps/driver/src/features/offers/components/OfferDecision.tsx', {
    '@/lib/displayLabels': { transmissionLabel: v => v, vehicleTypeLabel: v => v },
    '@/lib/scheduledPickup': { formatScheduledPickup: () => null },
    '@datxe/shared': { formatDistance: v => `${v} km`, formatMoney: v => `${v} đ` },
    '@datxe/ui': {
      offerPalette: {
        scrim: '#111',
        outline: '#222',
        emerald: '#0f0',
        ink: '#fff',
        muted: '#999',
        inkSoft: '#ccc',
        amber: '#fa0',
        blue: '#0af',
        surfaceContainer: '#222',
      },
      Typography: 'Text',
      typography: new Proxy({}, { get: () => ({}) }),
      useLanguage: () => 'vi',
    },
    '@expo/vector-icons': { MaterialIcons: 'MaterialIcons' },
    'react-native': { StyleSheet: { create: x => x }, View: 'View' },
  });

  const baseOffer = {
    rideId: 1,
    offerId: 'o1',
    expiresAt: Date.now() + 30000,
    serverTime: Date.now(),
    clientExpiresAt: Date.now() + 30000,
    pickup: { lat: 21, lng: 105, address: 'Đón' },
    dropoff: { lat: 21, lng: 105, address: 'Trả' },
    tripDistanceKm: 4.5,
    estDurationMin: 12,
    fareEstimate: 100000,
    driverEarning: 80000,
    customer: { displayName: 'Khách' },
    vehicle: { type: 'CAR', transmission: 'AUTO' },
  };

  const walletUnconfirmedText = collectText(OfferDecision({ offer: { ...baseOffer, paymentMethod: 'WALLET' } })).join(' | ');
  assert.match(walletUnconfirmedText, /Thanh toán qua ví/);
  assert.doesNotMatch(walletUnconfirmedText, /Đã trả qua ví/);

  const walletPendingText = collectText(OfferDecision({ offer: { ...baseOffer, paymentMethod: 'WALLET', paymentStatus: 'PENDING' } })).join(' | ');
  assert.match(walletPendingText, /Thanh toán qua ví/);
  assert.doesNotMatch(walletPendingText, /Đã trả qua ví/);

  const walletPaidText = collectText(OfferDecision({ offer: { ...baseOffer, paymentMethod: 'WALLET', paymentStatus: 'PAID' } })).join(' | ');
  assert.match(walletPaidText, /Đã trả qua ví/);

  const cashText = collectText(OfferDecision({ offer: { ...baseOffer, paymentMethod: 'CASH' } })).join(' | ');
  assert.match(cashText, /Thu tiền mặt/);
});
