const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../apps/customer/src/features/booking');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, ...globals, require: name => mocks[name] ?? (name === '@datxe/shared' ? require('./i18n-loader.cjs') : require(name)) });
  return exports;
}
const utils = load('bookingUtils.ts');
const pickup = { id: 'a', name: 'A', address: 'Điểm A', coordinate: { lat: 10.77, lng: 106.7 } };
const dropoff = { id: 'b', name: 'B', address: 'Điểm B', coordinate: { lat: 10.78, lng: 106.71 } };

test('pickup slots retain the 15 minute lead and 48 half-hour options', () => {
  const slots = utils.createScheduleSlots(Date.parse('2026-11-10T07:09:00Z'));
  assert.equal(slots.length, 48);
  assert.equal(slots[0], '2026-11-10T07:30:00.000Z');
  assert.equal(slots.at(-1), '2026-11-11T07:00:00.000Z');
  assert.ok(slots.slice(1).every((slot, index) => Date.parse(slot) - Date.parse(slots[index]) === 30 * 60_000));
  assert.equal(utils.createScheduleSlots(Date.parse('2026-11-10T07:15:00Z'))[0], slots[0]);
  assert.equal(utils.createScheduleSlots(Date.parse('2026-11-10T07:15:01Z'))[0], slots[1]);
});

test('pickup day labels and summary use Vietnam time across midnight', () => {
  const now = Date.parse('2026-11-10T16:58:00Z');
  const slots = utils.createScheduleSlots(now);
  const days = utils.groupScheduleSlots(slots, now);
  assert.equal(days.length, 2);
  assert.equal(days[0].label, 'Ngày mai');
  assert.equal(days[0].slots.length, 47);
  assert.match(days[1].label, /12\/11/);
  assert.equal(days[1].slots[0], '2026-11-11T17:00:00.000Z');
  assert.equal(utils.formatScheduleTime(days[1].slots[0]), '00:00');
  assert.equal(utils.formatScheduledPickup(slots[0]), '00:30 · 11/11');
});

test('pickup selection refreshes an expired picker and updates the quote and booking only when applied', async () => {
  let now = Date.parse('2026-11-10T07:09:00Z');
  const clock = class extends Date { static now() { return now; } };
  const states = [];
  const refs = [];
  let stateIndex, refIndex, quote, mutation, requestedQuote, booked;
  const price = { payableFare: 80_000 };
  const { useBookingConfirmation } = load('hooks/useBookingConfirmation.ts', {
    '@/lib/useWallet': { useWalletOverview: () => ({}) },
    '@/lib/walletApi': { walletApi: {} },
    '@/lib/customerApi': { customerApi: {} },
    '@/lib/useRefreshOnFocus': { useRefreshOnFocus: () => {} },
    '@datxe/shared': { walletBalance: () => undefined, translate: text => text, AuthApiError: class extends Error {} },
    '@datxe/ui': { localizedAlert: () => {} },
    '@tanstack/react-query': {
      useQueryClient: () => ({ setQueryData: () => {} }),
      useQuery: options => {
        const name = options.queryKey[1];
        if (name === 'bookingEstimate') quote = options;
        return { data: name === 'getCustomerVehicles' ? [{ id: 7 }] : name === 'bookingEstimate' ? price : null, isSuccess: true };
      },
      useMutation: options => { mutation = options; return {}; },
    },
    'expo-router': { useRouter: () => ({}) },
    react: {
      useState: initial => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; }];
      },
      useRef: initial => refs[refIndex++] ??= { current: initial },
    },
    '../api': {
      getActiveCustomerRide: async () => null,
      getRideEstimate: async request => { requestedQuote = request; return price; },
      createCustomerRide: async request => { booked = request; return { id: 42 }; },
    },
    '../bookingUtils': utils,
    '../store': { useBookingDraft: () => ({ pickup, dropoff, vehicleId: 7, pickupNote: '' }) },
  }, { Date: clock });
  const render = () => { stateIndex = refIndex = 0; return useBookingConfirmation(); };

  render().openSchedule();
  let hook = render();
  const first = utils.createScheduleSlots(hook.schedulePicker.referenceTime)[0];
  now = Date.parse(first);
  hook.selectSchedule(first);
  hook = render();
  assert.equal(hook.scheduleVisible, true);
  assert.equal(hook.schedulePicker.expired, true);
  assert.equal(hook.schedulePicker.referenceTime, now);
  assert.equal(hook.scheduledAt, null);
  assert.equal(quote.queryKey[2].scheduledAt, null);

  const chosen = utils.createScheduleSlots(now)[0];
  hook.selectSchedule(chosen);
  hook = render();
  assert.equal(hook.scheduleVisible, false);
  assert.equal(quote.queryKey[2].scheduledAt, chosen);
  await quote.queryFn();
  assert.equal(requestedQuote.scheduledAt, chosen);
  await mutation.mutationFn();
  assert.equal(booked.scheduledAt, chosen);
  assert.equal(booked.type, 'SCHEDULED');

  hook.openSchedule();
  hook = render();
  assert.equal(hook.scheduledAt, chosen);
  assert.equal(hook.schedulePicker.expired, false);
  hook.closeSchedule();
  assert.equal(render().scheduledAt, chosen);
  render().openSchedule();
  render().selectSchedule(null);
  assert.equal(render().scheduledAt, null);
  assert.equal(quote.queryKey[2].scheduledAt, null);
  await mutation.mutationFn();
  assert.equal(booked.type, 'INSTANT');
  assert.equal(booked.scheduledAt, null);
});

test('quote request rejects missing places, identical points and invalid coordinates', () => {
  assert.throws(() => utils.estimateRequest(null, dropoff, 1, null), /chọn đủ/);
  assert.throws(() => utils.estimateRequest(pickup, pickup, 1, null), /khác nhau/);
  assert.throws(() => utils.estimateRequest({ ...pickup, coordinate: { lat: NaN, lng: 106 } }, dropoff, 1, null), /chọn đủ/);
  const input = utils.estimateRequest(pickup, dropoff, 7, null, 'PROMO');
  assert.equal(input.vehicleId, 7);
  assert.equal(input.pickupLng, 106.7);
  assert.equal(input.voucher_code, 'PROMO');
});

test('a duplicate schedule error lets the customer open ride history', async () => {
  let mutation;
  let alert;
  const routes = [];
  class AuthApiError extends Error {
    code = 'SCHEDULED_RIDE_EXISTS';
  }
  const { useBookingConfirmation } = load('hooks/useBookingConfirmation.ts', {
    '@/lib/useWallet': { useWalletOverview: () => ({}) },
    '@/lib/walletApi': { walletApi: {} },
    '@/lib/customerApi': { customerApi: {} },
    '@/lib/useRefreshOnFocus': { useRefreshOnFocus: () => {} },
    '@datxe/shared': { walletBalance: () => undefined, translate: text => text, AuthApiError },
    '@datxe/ui': { localizedAlert: (...args) => { alert = args; } },
    '@tanstack/react-query': {
      useQueryClient: () => ({}),
      useQuery: () => ({}),
      useMutation: options => { mutation = options; return {}; },
    },
    'expo-router': { useRouter: () => ({ replace: route => routes.push(route) }) },
    react: { useState: value => [value, () => {}], useRef: value => ({ current: value }) },
    '../api': {},
    '../bookingUtils': utils,
    '../store': { useBookingDraft: () => ({}) },
  });
  useBookingConfirmation();
  await mutation.onError(new AuthApiError());
  assert.match(alert[0], /đã có lịch hẹn/i);
  assert.deepEqual(routes, []);
  alert[2].find(button => button.text === 'Mở Lịch sử').onPress();
  assert.deepEqual(routes, ['/(tabs)/history']);
});

test('voucher eligibility considers dates, exhausted usage and backend minimum amount', () => {
  const voucher = { validFrom: '2026-01-01', validTo: '2027-01-01', usageLimit: 10, usageCount: 0, minimumOrderAmount: 50000 };
  const now = Date.parse('2026-10-28');
  assert.equal(utils.voucherUnavailable(voucher, 60000, now), null);
  assert.match(utils.voucherUnavailable(voucher, 30000, now), /Áp dụng từ/);
  assert.match(utils.voucherUnavailable({ ...voucher, usageCount: 10 }, 60000, now), /hết lượt/);
  assert.match(utils.voucherUnavailable(voucher, 60000, Date.parse('2027-02-01')), /hết hạn/);
});

test('fare breakdown accounts for the backend minimum without a hardcoded tariff', () => {
  const quote = { estimatedFare: 30000, baseFare: 20000, distanceFare: 5000, waitingFare: 0, nightSurcharge: 0, returnFee: 0 };
  assert.equal(utils.minimumFareAdjustment(quote), 5000);
  assert.equal(utils.minimumFareAdjustment({ ...quote, estimatedFare: 25000 }), 0);
});

test('map selection preserves the exact pin instead of the reverse geocoder center', async () => {
  let requested;
  const signal = new AbortController().signal;
  const api = load('api.ts', {
    '@/lib/api': { request: async (url, options) => {
      requested = { url, options };
      return { id: 'nearby', name: 'Địa chỉ gần ghim', address: 'Ngõ 165 Cầu Giấy, Hà Nội', coordinate: { lat: 10.78, lng: 106.71 } };
    } },
    '@/lib/customerApi': { customerApi: {} }, './bookingUtils': utils,
  });
  const pin = { lat: 10.7701234, lng: 106.7009876 };
  const place = await api.reverseBookingPlace(pin, signal);
  assert.equal(place.coordinate, pin);
  const query = new URL('https://test' + requested.url);
  assert.equal(query.pathname, '/location/places/reverse');
  assert.equal(query.searchParams.get('lat'), '10.7701234');
  assert.equal(query.searchParams.get('lng'), '106.7009876');
  assert.equal(requested.options.signal, signal);
});

test('search forwards the exact Vietnamese query and real proximity with cancellation', async () => {
  const signal = new AbortController().signal;
  const api = load('api.ts', {
    '@/lib/api': { request: async (url, options) => {
      const query = new URL('https://test' + url);
      assert.equal(query.searchParams.get('query'), 'Ngách 12/3, Hồ Tây');
      assert.equal(query.searchParams.get('proximityLat'), '21.03');
      assert.equal(query.searchParams.get('proximityLng'), '105.84');
      assert.equal(options.signal, signal);
      return { provider: 'goong', limitedCoverage: false, places: [] };
    } }, '@/lib/customerApi': { customerApi: {} }, './bookingUtils': utils,
  });
  await api.searchBookingPlaces(' Ngách 12/3, Hồ Tây ', { lat: 21.03, lng: 105.84 }, signal);
});

test('Goong suggestions resolve by ID before booking and retain the chosen alley address', async () => {
  let calls = 0;
  const api = load('api.ts', {
    '@/lib/api': { request: async url => {
      calls++;
      assert.equal(new URL('https://test' + url).searchParams.get('id'), 'place/a+b==');
      return { id: 'place/a+b==', name: 'Tên từ chi tiết', address: 'Địa chỉ chi tiết', coordinate: { lat: 21.03, lng: 105.84 } };
    } }, '@/lib/customerApi': { customerApi: {} }, './bookingUtils': utils,
  });
  const place = await api.resolveBookingPlace({ id: 'place/a+b==', provider: 'goong', name: 'Ngách 12/3', address: 'Ngách 12/3, Ngõ 12, Hà Nội' });
  assert.equal(place.address, 'Ngách 12/3, Ngõ 12, Hà Nội');
  assert.equal(place.coordinate.lat, 21.03);
  await api.resolveBookingPlace(pickup);
  assert.equal(calls, 1);
});

test('Hanoi is the fallback search/map center', () => {
  assert.equal(utils.DEFAULT_MAP_CENTER.lat, 21.0285);
  assert.equal(utils.DEFAULT_MAP_CENTER.lng, 105.8542);
});

test('a place without valid provider coordinates cannot become a booking point', async () => {
  const api = load('api.ts', {
    '@/lib/api': { request: async () => ({ id: 'a', coordinate: { lat: 200, lng: 100 } }) },
    '@/lib/customerApi': { customerApi: {} }, './bookingUtils': utils,
  });
  await assert.rejects(api.resolveBookingPlace({ id: 'a', provider: 'goong', name: 'A', address: 'A' }), /Chưa lấy được vị trí/);
  await assert.rejects(api.resolveBookingPlace({ id: 'a', provider: 'mapbox', name: 'A', address: 'A' }), /Chưa có tọa độ chính xác/);
});

test('starting a new booking clears old vehicle, destination and voucher selections', () => {
  const { useBookingDraft } = load('store.ts');
  useBookingDraft.getState().setPlace('dropoff', dropoff);
  useBookingDraft.getState().setVehicle(7);
  useBookingDraft.getState().setVoucher('OLD');
  useBookingDraft.getState().setPickupNote('Ghi chú cũ');
  useBookingDraft.getState().begin('Sân bay', '', pickup);
  assert.equal(useBookingDraft.getState().pickup, pickup);
  assert.equal(useBookingDraft.getState().dropoff, null);
  assert.equal(useBookingDraft.getState().vehicleId, null);
  assert.equal(useBookingDraft.getState().voucherCode, '');
  assert.equal(useBookingDraft.getState().pickupNote, '');
  useBookingDraft.getState().clear();
  assert.equal(useBookingDraft.getState().pickup, null);
});
