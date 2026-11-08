const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, mocks) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  vm.runInNewContext(outputText, { exports, require: id => {
    if (!(id in mocks)) throw new Error(id);
    return mocks[id];
  } });
  return exports;
}
test('credit gate remains closed for unknown, failed or refreshing balances', () => {
  let state = { isSuccess: false, isError: false, isFetching: true };
  const { useDriverCredit } = load('apps/driver/src/lib/useDriverCredit.ts', {
    '@tanstack/react-query': { useQuery: () => state },
    './driverApi': { driverApi: {} }, './store': { useSessionStore: select => select({ user: { id: 7 } }) },
  });
  assert.equal(useDriverCredit().allowed, false);
  state = { isSuccess: true, isError: false, isFetching: false, data: { canReceive: false } };
  assert.equal(useDriverCredit().allowed, false);
  state.data.canReceive = true;
  assert.equal(useDriverCredit().allowed, true);
  state.isError = true;
  assert.equal(useDriverCredit().allowed, false);
  state.isError = false; state.isFetching = true;
  assert.equal(useDriverCredit().allowed, false);
});
test('online action rechecks balance before changing availability', async () => {
  let availability;
  let balance = { data: { canReceive: false } };
  const calls = [];
  load('apps/driver/src/features/offers/hooks/useHome.ts', {
    '@/lib/useDriverCredit': { useDriverCredit: () => ({ allowed: false, refetch: async () => balance }) },
    '@/lib/driverOffer': { usePendingOffer: () => ({}) },
    '@/lib/driverApi': { driverApi: {} }, '@/lib/store': {}, '@/lib/useRefreshOnFocus': { useRefreshOnFocus: () => {} },
    '@tanstack/react-query': { useQuery: () => ({}), useQueryClient: () => ({}), useMutation: options => { availability = options; return {}; } },
    'expo-router': { useRouter: () => ({}) },
    '../api': { setDriverAvailability: async body => calls.push(body) },
  }).useHome();
  await assert.rejects(availability.mutationFn({ online: true, vehicle_type: 'CAR' }), /Số dư/);
  assert.equal(calls.length, 0);
  balance = { data: { canReceive: true } };
  await availability.mutationFn({ online: true, vehicle_type: 'CAR' });
  assert.equal(calls.length, 1);
  balance = { error: new Error('offline'), data: { canReceive: true } };
  await assert.rejects(availability.mutationFn({ online: true }), /offline/);
  assert.equal(calls.length, 1);
  await availability.mutationFn({ online: false });
  assert.equal(calls.length, 2);
});
