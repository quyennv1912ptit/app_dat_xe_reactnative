const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, URLSearchParams, require: id => {
    if (!(id in mocks)) throw new Error(id); return mocks[id];
  } });
  return exports;
}
const wallet = load('packages/shared/src/api/wallet.ts');
test('wallet requests use role-scoped top-up, full history pages and server wallet filters', async () => {
  const calls = [];
  const request = async (path, options) => { calls.push({ path, options }); return { content: [], last: true }; };
  const driver = wallet.createWalletApi(request, 'driver');
  await driver.history(6, 'CREDIT');
  assert.equal(calls[0].path, '/wallet/transactions?page=6&walletType=CREDIT');
  await driver.topUp(50000, 'retry-key');
  assert.equal(calls[1].path, '/driver/wallet/top-up');
  assert.equal(calls[1].options.headers['Idempotency-Key'], 'retry-key');
  const customer = wallet.createWalletApi(request, 'customer');
  await customer.topUp(100000, 'customer-key');
  assert.equal(calls[2].path, '/customer/wallet/top-up');
  await assert.rejects(wallet.createWalletApi(async () => null, 'customer').overview(), /Chưa tải/);
});
test('whole VND validation and retry keys protect money submissions', () => {
  for (const input of ['-1', '0', '1.5', '50.000', 'abc', '']) assert.equal(wallet.parseWalletAmount(input), null);
  assert.equal(wallet.parseWalletAmount('50000001', 50000000), null);
  assert.equal(wallet.parseWalletAmount('50000000', 50000000), 50000000);
  assert.equal(wallet.walletBalance(undefined, 'CUSTOMER'), undefined);
  const first = wallet.walletAttempt(undefined, 50000);
  assert.equal(wallet.walletAttempt(first, 50000).key, first.key);
  assert.notEqual(wallet.walletAttempt(first, 100000).key, first.key);
});
test('booking sends selected wallet method and rechecks the latest balance before creating a ride', async () => {
  let states = [], stateIndex = 0, refs = [], refIndex = 0;
  let mutation;
  let balance = 100000;
  let latestBalance = 100000;
  let walletFailed = false;
  const payloads = [];
  const overview = () => ({ balances: [{ walletType: 'CUSTOMER', balance }] });
  const price = { payableFare: 100000, route: { id: 'quote-1', coordinates: [] } };
  const { useBookingConfirmation } = load('apps/customer/src/features/booking/hooks/useBookingConfirmation.ts', {
    '@/lib/useWallet': { useWalletOverview: () => ({ data: overview(), isSuccess: true, isError: walletFailed, isFetching: false }) },
    '@/lib/walletApi': { walletApi: { overview: async () => ({ balances: [{ walletType: 'CUSTOMER', balance: latestBalance }] }) } },
    '@/lib/customerApi': { customerApi: {} }, '@/lib/useRefreshOnFocus': { useRefreshOnFocus: () => {} },
    '@datxe/ui': { localizedAlert: () => {} }, '@datxe/shared': { walletBalance: wallet.walletBalance, translate: text => text, AuthApiError: class extends Error {} },
    '@tanstack/react-query': { useQueryClient: () => ({ setQueryData: () => {} }), useQuery: ({ queryKey }) => {
      const name = queryKey[1];
      return { data: name === 'getCustomerProfile' ? { default_payment_method: 'WALLET' } : name === 'getCustomerVehicles' ? [{ id: 1 }] : name === 'bookingEstimate' ? price : name === 'getActiveCustomerRide' ? null : [], isSuccess: true, isFetching: false, isError: false };
    }, useMutation: options => { mutation = options; return { isPending: false }; } },
    'expo-router': { useRouter: () => ({}) },
    react: { useState: initial => { const index = stateIndex++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; }, useRef: initial => refs[refIndex++] ??= { current: initial } },
    '../api': { getActiveCustomerRide: async () => null, getRideEstimate: async () => price, createCustomerRide: async (payload, key) => { payloads.push({ payload, key }); return { id: 42 }; } },
    '../bookingUtils': { estimateRequest: () => ({ vehicleId: 1 }) },
    '../store': { useBookingDraft: () => ({ vehicleId: 1, pickupNote: '', setVoucher: () => {} }) },
  });
  const render = () => { stateIndex = refIndex = 0; return useBookingConfirmation(); };
  let hook = render();
  assert.equal(hook.ready, true);
  await mutation.mutationFn();
  assert.equal(payloads[0].payload.paymentMethod, 'WALLET');
  latestBalance = 99999;
  await assert.rejects(mutation.mutationFn(), /Số dư ví không đủ/);
  assert.equal(payloads.length, 1);
  balance = 99999;
  hook = render(); assert.equal(hook.ready, false);
  walletFailed = true; balance = 100000;
  hook = render(); assert.equal(hook.ready, false);
  hook.setPaymentMethod('CASH'); hook = render();
  assert.equal(hook.ready, true);
  await mutation.mutationFn();
  assert.equal(payloads[1].payload.paymentMethod, 'CASH');
  assert.notEqual(payloads[0].key, payloads[1].key);
});

test('money attempt survives an app restart and corrupted receipts block a new payment', async () => {
  const values = new Map();
  const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } };
  const scope = 'wallet:test:driver:7:withdraw';
  const first = await wallet.persistWalletAttempt(storage, scope, 50000);
  const reloaded = load('packages/shared/src/api/wallet.ts');
  const retry = await reloaded.persistWalletAttempt(storage, scope, 50000);
  assert.equal(retry.key, first.key);
  await storage.removeItem(scope);
  const next = await reloaded.persistWalletAttempt(storage, scope, 50000);
  assert.notEqual(next.key, first.key);
  values.set(scope, '{bad-json');
  await assert.rejects(reloaded.persistWalletAttempt(storage, scope, 50000), /Không đọc được mã/);
});

test('completed cash receipt keeps polling until driver confirms payment', () => {
  const { useRideQuery } = load('apps/customer/src/features/tracking/hooks/useRideQuery.ts', {
    '@tanstack/react-query': { useQuery: options => options }, '../api': {},
  });
  const options = useRideQuery(42);
  assert.equal(options.refetchInterval({ state: { data: { status: 'COMPLETED', payment: { status: 'PENDING' } } } }), 5000);
  assert.equal(options.refetchInterval({ state: { data: { status: 'COMPLETED', payment: { status: 'PAID' } } } }), false);
  assert.equal(useRideQuery(42, true).refetchInterval({ state: { data: { status: 'IN_PROGRESS' } } }), 6000);
  assert.equal(useRideQuery(-1).enabled, false);
});
