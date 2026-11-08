const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

function load(file, mocks = {}) {
  const exports = {};
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  vm.runInNewContext(outputText, { exports, require: id => {
    if (!(id in mocks)) throw new Error(`Unexpected import: ${id}`);
    return mocks[id];
  } });
  return exports;
}

test('trip distance uses a decimal comma and VND amounts have no fractional dong', () => {
  const { formatDistance, formatMoney } = load('packages/shared/src/utils/index.ts');
  assert.equal(formatDistance(13.811), '13,8 km');
  assert.equal(formatDistance(13.811, 'en-US'), '13.8 km');
  assert.equal(formatDistance(0), '0 km');
  assert.equal(formatMoney(79055.4), '79.055 đ');
});

test('customer returns to the ride only after successful handover confirmation', async () => {
  const routes = [];
  const alerts = [];
  let fail = false;
  let invalidations = 0;
  const report = { phase: 'DROPOFF', revision: 2 };
  const { useVehicleInspection } = load('apps/customer/src/features/vehicles/hooks/useVehicleInspection.ts', {
    '@datxe/ui': { localizedAlert: (...args) => alerts.push(args) },
    '@datxe/shared': { translate: text => text },
    '@tanstack/react-query': {
      useQueryClient: () => ({ invalidateQueries: async () => { invalidations++; } }),
      useQuery: () => ({ data: { status: 'VEHICLE_RETURNED', handoverReports: [report] }, refetch: async () => {} }),
      useMutation: () => ({ isPending: false }),
    },
    '@/lib/api': {}, '@/lib/supportImages': {},
    'expo-router': {
      useRouter: () => ({ dismissTo: route => routes.push(route) }),
      useLocalSearchParams: () => ({ rideId: '73', phase: 'dropoff' }),
    },
    react: { useState: initial => [initial, () => {}] },
    '../api': { confirmCustomerHandover: async (id, phase, revision) => {
      assert.equal(id, 73); assert.equal(phase, 'dropoff'); assert.equal(revision, 2);
      if (fail) throw new Error('Network error');
    } },
  });
  await useVehicleInspection().confirm();
  assert.equal(invalidations, 1);
  assert.equal(routes[0].pathname, '/ride/tracking');
  assert.equal(routes[0].params.rideId, '73');
  fail = true;
  await useVehicleInspection().confirm();
  assert.equal(routes.length, 1);
  assert.equal(alerts.length, 1);
});

test('driver returns to the active ride after sending a return report', async () => {
  const routes = [];
  let mutation;
  let submitted = false;
  const { useVehicleInspection } = load('apps/driver/src/features/ride/hooks/useVehicleInspection.ts', {
    '@/lib/uploadImage': {}, '@/lib/api': {},
    '@datxe/shared': { getFirebaseUser: () => ({ uid: 'driver-1' }) },
    '@tanstack/react-query': {
      useQueryClient: () => ({ invalidateQueries: async () => {}, setQueryData: () => {} }),
      useQuery: ({ queryKey }) => queryKey[0] === 'driverDraft'
        ? { data: { odometer: '150', fuelLevel: '50', photos: ['FRONT', 'REAR', 'LEFT', 'RIGHT'].map(angle => ({ angle, fileUrl: angle, publicId: angle })) } }
        : { data: { id: 73, status: 'ARRIVED_DESTINATION', handoverReports: [] } },
      useMutation: options => { mutation = options; return {}; },
    },
    'expo-image-picker': {},
    'expo-router': { useRouter: () => ({ dismissTo: route => routes.push(route) }) },
    react: { useState: initial => [initial, () => {}] },
    '../api': { submitDriverHandover: async (id, phase, body) => {
      assert.equal(id, 73); assert.equal(phase, 'dropoff'); assert.equal(body.odometer, 150);
      submitted = true;
    } },
    '../photoAngles': { PHOTO_ANGLES: ['FRONT', 'REAR', 'LEFT', 'RIGHT'].map(angle => [angle]) },
  });
  useVehicleInspection();
  await mutation.mutationFn();
  assert.equal(submitted, true);
  assert.equal(routes.length, 0);
  await mutation.onSuccess();
  assert.deepEqual(routes, ['/ride/in-progress']);
});
