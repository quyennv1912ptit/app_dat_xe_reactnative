const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const geometry = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../packages/ui/src/maps/routeGeometry.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports: geometry },
);

// Tuyến thẳng theo hướng đông ở vĩ độ 21: ~1.04 km mỗi đoạn 0.01 độ kinh.
const route = [
  { lat: 21, lng: 105.84 },
  { lat: 21, lng: 105.85 },
  { lat: 21, lng: 105.86 },
];
const cumulative = geometry.routeCumulativeMeters(route);

test('projection stays on the segment instead of snapping to the nearest vertex', () => {
  const projection = geometry.projectOnRoute(route, cumulative, { lat: 21, lng: 105.844 });
  assert.ok(projection);
  assert.equal(projection.segmentIndex, 0);
  assert.ok(Math.abs(projection.segmentRatio - 0.4) < 1e-6);
  assert.ok(Math.abs(projection.offsetMeters) < 0.05);
  assert.ok(Math.abs(projection.coordinate.lng - 105.844) < 1e-9);
  assert.ok(Math.abs(projection.alongMeters - cumulative[1] * 0.4) < 2);
});

test('remaining route starts exactly at the current position so travelled road disappears immediately', () => {
  const projection = geometry.projectOnRoute(route, cumulative, { lat: 21, lng: 105.844 });
  const remaining = geometry.trimRouteAtDistance(route, cumulative, projection.alongMeters);
  assert.equal(remaining.length, 3);
  assert.ok(Math.abs(remaining[0].lng - 105.844) < 1e-9);
  assert.equal(remaining[1].lng, 105.85);
  assert.equal(remaining[2].lng, 105.86);
  // Điểm bắt đầu mới không còn là đỉnh cũ của polyline.
  assert.notEqual(remaining[0].lng, route[0].lng);
});

test('route collapses to a single point once the driver reaches the destination', () => {
  const projection = geometry.projectOnRoute(route, cumulative, { lat: 21, lng: 105.865 });
  assert.ok(projection);
  assert.equal(projection.segmentIndex, 1);
  assert.equal(projection.segmentRatio, 1);
  const remaining = geometry.trimRouteAtDistance(route, cumulative, projection.alongMeters);
  assert.equal(remaining.length, 1);
  assert.ok(Math.abs(remaining[0].lng - 105.86) < 1e-9);
});

test('hinted search around the last segment matches a full scan', () => {
  const point = { lat: 21, lng: 105.855 };
  const full = geometry.projectOnRoute(route, cumulative, point);
  const hinted = geometry.projectOnRoute(route, cumulative, point, 1, 8);
  assert.ok(full && hinted);
  assert.equal(hinted.segmentIndex, full.segmentIndex);
  assert.ok(Math.abs(hinted.alongMeters - full.alongMeters) < 1e-6);
});

// Tuyến chữ L: đi về đông rồi rẽ bắc, để kiểm tra nội suy theo cung thay vì dây cung.
const cornerRoute = [
  { lat: 21, lng: 105.84 },
  { lat: 21, lng: 105.85 },
  { lat: 21.01, lng: 105.85 },
];
const cornerCumulative = geometry.routeCumulativeMeters(cornerRoute);

test('point at a travelled distance follows the polyline around a corner instead of cutting it', () => {
  const beforeCorner = geometry.pointAtDistance(cornerRoute, cornerCumulative, cornerCumulative[1] * 0.5);
  assert.ok(beforeCorner);
  assert.equal(beforeCorner.lat, 21);
  assert.ok(Math.abs(beforeCorner.lng - 105.845) < 1e-6);

  // 200 m sau khi rẽ: phải nằm trên nhánh bắc, đúng kinh độ của đỉnh.
  const afterCorner = geometry.pointAtDistance(cornerRoute, cornerCumulative, cornerCumulative[1] + 200);
  assert.ok(afterCorner);
  assert.ok(Math.abs(afterCorner.lng - 105.85) < 1e-9);
  assert.ok(afterCorner.lat > 21.0015 && afterCorner.lat < 21.002);
  // Điểm nội suy nằm đúng trên tuyến (không lệch như dây cung giữa hai fix).
  const projection = geometry.projectOnRoute(cornerRoute, cornerCumulative, afterCorner);
  assert.ok(projection);
  assert.ok(projection.offsetMeters < 0.05);
});

test('point at a travelled distance clamps to the first and last vertex', () => {
  const start = geometry.pointAtDistance(cornerRoute, cornerCumulative, -50);
  assert.equal(start.lat, cornerRoute[0].lat);
  assert.equal(start.lng, cornerRoute[0].lng);
  const end = geometry.pointAtDistance(cornerRoute, cornerCumulative, 10 ** 6);
  assert.equal(end.lat, cornerRoute[2].lat);
  assert.equal(end.lng, cornerRoute[2].lng);
  assert.equal(geometry.pointAtDistance([], [], 10), null);
});

test('trimming at a travelled distance drops passed vertices and starts on the live position', () => {
  const remaining = geometry.trimRouteAtDistance(cornerRoute, cornerCumulative, cornerCumulative[1] + 200);
  assert.equal(remaining.length, 2);
  assert.ok(Math.abs(remaining[0].lng - 105.85) < 1e-9);
  assert.ok(remaining[0].lat > 21.0015 && remaining[0].lat < 21.002);
  assert.equal(remaining[1].lat, cornerRoute[2].lat);
  assert.equal(remaining[1].lng, cornerRoute[2].lng);

  // Tới đích thì tuyến thu về đúng một điểm.
  const arrived = geometry.trimRouteAtDistance(cornerRoute, cornerCumulative, 10 ** 6);
  assert.equal(arrived.length, 1);
  assert.equal(arrived[0].lat, cornerRoute[2].lat);
  assert.equal(arrived[0].lng, cornerRoute[2].lng);

  // Vừa xuất phát thì giữ nguyên cả tuyến.
  const atStart = geometry.trimRouteAtDistance(cornerRoute, cornerCumulative, 0);
  assert.equal(atStart.length, 3);
  assert.equal(atStart[1].lng, cornerRoute[1].lng);
  assert.equal(atStart[2].lat, cornerRoute[2].lat);
});

test('driver navigation screen projects onto the route and interpolates camera and marker', () => {
  const map = fs.readFileSync(path.join(__dirname, '../apps/driver/src/components/DriverDirectionsMap.native.tsx'), 'utf8');
  assert.match(map, /const GPS_TIME_INTERVAL_MS = 1000/);
  assert.match(map, /const GPS_DISTANCE_INTERVAL_M = 3/);
  assert.match(map, /distanceInterval: GPS_DISTANCE_INTERVAL_M, timeInterval: GPS_TIME_INTERVAL_MS/);
  assert.match(map, /projectOnRoute\(coordinates, routeCumulative, current\)/);
  assert.match(map, /offsetMeters \?\? 0\) > REROUTE_OFFSET_METERS/);
  assert.match(map, /camera\.current\?\.easeTo\(\{/);
  assert.match(map, /duration: reducedMotion \? 0 : SMOOTHING_MS/);
  assert.match(map, /easing: 'linear'/);
  assert.match(map, /<DriverRouteLayers/);
  assert.doesNotMatch(map, /slice\(nearestIndex\)/);
  assert.doesNotMatch(map, /jumpTo\(\{ center: \[current\.lng/);

  const layers = fs.readFileSync(path.join(__dirname, '../apps/driver/src/components/DriverRouteLayers.tsx'), 'utf8');
  assert.match(layers, /memo\(function DriverRouteLayers/);
  assert.match(layers, /useSmoothedRoutePosition\(target, coordinates, cumulative/);
  assert.match(layers, /trimRouteAtDistance\(coordinates, cumulative, alongMeters\)/);
  assert.match(layers, /const ROUTE_LAYOUT =/);
});

test('customer tracking map smooths the driver marker and keeps map bounds stable', () => {
  const source = fs.readFileSync(path.join(__dirname, '../apps/customer/src/components/map/BookingMap.tsx'), 'utf8');
  assert.match(source, /useSmoothedRoutePosition\(driver \?\? null, coordinates, cumulative/);
  assert.match(source, /enabled: !reducedMotion/);
  assert.match(source, /trimRouteAtDistance\(coordinates, cumulative, alongMeters\)/);
  assert.match(source, /const points = \[\.\.\.anchors, \.\.\.\(route \?\? \[\]\)\]/);
  assert.match(source, /route=\{remainingRoute\}/);
  assert.doesNotMatch(source, /markers\.map\(marker => marker\.coordinate\)/);
});
