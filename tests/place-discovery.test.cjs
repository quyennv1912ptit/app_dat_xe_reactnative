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
  vm.runInNewContext(source, {
    exports,
    URLSearchParams,
    require: name => mocks[name] ?? (name === '@datxe/shared' ? require('./i18n-loader.cjs') : require(name)),
  });
  return exports;
}

const utils = load('bookingUtils.ts');
const place = { lat: 21.03, lng: 105.84 };

test('place params keep the chosen address and reject missing coordinates', () => {
  const parsed = utils.bookingPlaceFromParams({
    lat: '21.0301234',
    lng: '105.8405678',
    address: '44 Ngõ 2 Cầu Bươu, Đại Thanh, Hà Nội',
    name: '',
    id: 'goong:abc',
  });
  assert.equal(parsed.name, '44 Ngõ 2 Cầu Bươu');
  assert.equal(parsed.address, '44 Ngõ 2 Cầu Bươu, Đại Thanh, Hà Nội');
  assert.equal(parsed.coordinate.lat, 21.0301234);
  assert.equal(parsed.id, 'goong:abc');
  assert.equal(utils.bookingPlaceFromParams({ lat: '', lng: '', address: 'Hà Nội' }), null);
  assert.equal(utils.bookingPlaceFromParams({ lat: '200', lng: '105', address: 'Hà Nội' }), null);
});

test('nearby distances stay in metres under one kilometre and use the locale separator above', () => {
  assert.equal(utils.formatDistanceMeters(90), '90 m');
  assert.equal(utils.formatDistanceMeters(999), '999 m');
  assert.equal(utils.formatDistanceMeters(1300), '1,3 km');
  assert.equal(utils.formatDistanceMeters(null), '');
});

test('nearby, recent, popular and report APIs send the expected requests', async () => {
  const calls = [];
  const api = load('api.ts', {
    '@/lib/api': {
      request: async (url, options) => {
        calls.push({ url, options });
        if (url.includes('/nearby')) return { provider: 'goong', radiusMeters: 100, withinRadius: true, places: [] };
        if (url.includes('/recent') || url.includes('/popular')) return [];
        return { ticketId: 12, code: 'HT-12' };
      },
    },
    '@/lib/customerApi': { customerApi: {} },
    './bookingUtils': utils,
  });

  await api.getNearbyBookingPlaces(place, undefined, 100, 8);
  await api.getRecentBookingPlaces('dropoff', place, undefined, 5);
  await api.getPopularBookingPlaces(place, undefined, 6);
  const report = await api.reportBookingPlace({
    placeId: 'pin:1,2', name: 'A', address: 'A, Hà Nội', lat: 21.03, lng: 105.84, reason: 'Tên địa chỉ sai',
  });

  const nearby = new URL('https://test' + calls[0].url);
  assert.equal(nearby.pathname, '/location/places/nearby');
  assert.equal(nearby.searchParams.get('lat'), '21.03');
  assert.equal(nearby.searchParams.get('lng'), '105.84');
  assert.equal(nearby.searchParams.get('radius'), '100');
  assert.equal(nearby.searchParams.get('limit'), '8');

  const recent = new URL('https://test' + calls[1].url);
  assert.equal(recent.pathname, '/customer/places/recent');
  assert.equal(recent.searchParams.get('kind'), 'dropoff');
  assert.equal(recent.searchParams.get('proximityLat'), '21.03');

  const popular = new URL('https://test' + calls[2].url);
  assert.equal(popular.pathname, '/customer/places/popular');
  assert.equal(popular.searchParams.get('limit'), '6');

  assert.equal(calls[3].url, '/customer/places/report');
  assert.equal(calls[3].options.method, 'POST');
  assert.equal(calls[3].options.body.reason, 'Tên địa chỉ sai');
  assert.equal(report.ticketId, 12);
});
