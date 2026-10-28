const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../apps/customer/src/features/booking');
function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, require: name => mocks[name] ?? require(name) });
  return exports;
}
const utils = load('bookingUtils.ts');
const pickup = { id: 'a', name: 'A', address: 'Điểm A', coordinate: { lat: 10.77, lng: 106.7 } };
const dropoff = { id: 'b', name: 'B', address: 'Điểm B', coordinate: { lat: 10.78, lng: 106.71 } };

test('quote request rejects missing places, identical points and invalid coordinates', () => {
  assert.throws(() => utils.estimateRequest(null, dropoff, 1, null), /chọn đủ/);
  assert.throws(() => utils.estimateRequest(pickup, pickup, 1, null), /khác nhau/);
  assert.throws(() => utils.estimateRequest({ ...pickup, coordinate: { lat: NaN, lng: 106 } }, dropoff, 1, null), /chọn đủ/);
  const input = utils.estimateRequest(pickup, dropoff, 7, null, 'PROMO');
  assert.equal(input.vehicleId, 7);
  assert.equal(input.pickupLng, 106.7);
  assert.equal(input.voucher_code, 'PROMO');
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
  useBookingDraft.getState().begin('Sân bay', '', pickup);
  assert.equal(useBookingDraft.getState().pickup, pickup);
  assert.equal(useBookingDraft.getState().dropoff, null);
  assert.equal(useBookingDraft.getState().vehicleId, null);
  assert.equal(useBookingDraft.getState().voucherCode, '');
  useBookingDraft.getState().clear();
  assert.equal(useBookingDraft.getState().pickup, null);
});
