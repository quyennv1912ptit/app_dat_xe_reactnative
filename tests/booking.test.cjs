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

test('place search retains all valid results and converts longitude/latitude correctly', () => {
  const places = utils.parsePlaces(JSON.stringify({ features: [
    { id: 'one', text: 'Chợ', place_name: 'Chợ, Quận 1', geometry: { coordinates: [106.7, 10.77] } },
    { id: 'two', place_name: 'Bến xe, Quận 2', geometry: { coordinates: [106.8, 10.8] } },
    { place_name: 'Bad', geometry: { coordinates: [200, 100] } },
    { place_name: '', geometry: { coordinates: [106, 10] } },
  ] }));
  assert.equal(places.length, 2);
  assert.equal(places[0].coordinate.lat, 10.77);
  assert.equal(places[0].coordinate.lng, 106.7);
  assert.equal(places[1].name, 'Bến xe');
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

test('map selection preserves the exact pin and sends longitude first to geocoding', async () => {
  let requested;
  const signal = new AbortController().signal;
  const api = load('api.ts', {
    '@/lib/api': { request: async (url, options) => {
      requested = { url, options };
      return JSON.stringify({ features: [{ place_name: 'Địa chỉ gần ghim', geometry: { coordinates: [106.71, 10.78] } }] });
    } },
    '@/lib/customerApi': { customerApi: {} }, './bookingUtils': utils,
  });
  const pin = { lat: 10.7701234, lng: 106.7009876 };
  const place = await api.reverseBookingPlace(pin, signal);
  assert.equal(place.coordinate, pin);
  assert.equal(new URL('https://test' + requested.url).searchParams.get('address'), '106.7009876,10.7701234');
  assert.equal(requested.options.signal, signal);
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
