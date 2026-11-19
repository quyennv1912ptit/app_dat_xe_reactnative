const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: id => { if (!(id in mocks)) throw new Error(id); return mocks[id]; } });
  return exports;
}
const helpers = load('packages/shared/src/api/wallet.ts');
function fixture(status = 'PENDING') {
  const stored = new Map();
  const calls = [], invalidations = [], cache = [];
  let lost = true;
  let user = { id: 7 };
  const ride = { id: 42, status: 'COMPLETED', payment: { method: 'CASH', status, amount: 100000 } };
  const session = selector => selector({ user }); session.getState = () => ({ user });
  const options = load('apps/customer/src/lib/usePendingPaymentMethod.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => stored.get(key) ?? null, setItem: async (key, value) => stored.set(key, value), removeItem: async key => stored.delete(key) } },
    '@tanstack/react-query': { useQueryClient: () => ({ setQueryData: (key, updater) => cache.push(updater(ride)), invalidateQueries: async ({ queryKey }) => invalidations.push(queryKey[0]) }), useMutation: options => options },
    '@datxe/shared': helpers, './store': { useSessionStore: session }, '@/config/env': { env: { apiUrl: 'test' } },
    './api': { request: async (path, options) => {
      calls.push({ path, options });
      if (lost) { lost = false; throw new Error('response lost'); }
      return { amount: 100000, method: 'WALLET', status: 'PAID', paidAt: '2026-11-08T00:00:00Z' };
    } },
  }).usePendingPaymentMethod(ride);
  return { options, calls, stored, invalidations, cache, switchUser: () => { user = { id: 8 }; } };
}
test('pending change retries with the same key and refreshes invoice wallet and history', async () => {
  const f = fixture();
  await assert.rejects(f.options.mutationFn('WALLET'), /response lost/);
  const result = await f.options.mutationFn('WALLET');
  assert.equal(f.calls[0].path, '/customer/rides/42/payment/method');
  assert.equal(f.calls[1].options.headers['Idempotency-Key'], f.calls[0].options.headers['Idempotency-Key']);
  assert.equal(f.calls[1].options.body.expectedMethod, 'CASH');
  assert.equal(f.calls[1].options.body.method, 'WALLET');
  await f.options.onSuccess(result);
  assert.equal(f.cache[0].payment.method, 'WALLET');
  assert.equal(f.cache[0].payment.status, 'PAID');
  assert.deepEqual(f.invalidations, ['customer']);
  assert.equal(f.stored.size, 0);
});
test('paid invoices cannot submit a method change and stale sessions cannot update another account cache', async () => {
  const paid = fixture('PAID');
  await assert.rejects(paid.options.mutationFn('WALLET'), /không còn/);
  assert.equal(paid.calls.length, 0);
  const f = fixture(); f.switchUser();
  await f.options.onSuccess({ method: 'WALLET', status: 'PAID' });
  assert.equal(f.cache.length, 0);
});
