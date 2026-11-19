const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const metrics = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../apps/driver/src/lib/navigationMetrics.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports: metrics },
);

test('progress uses the provider total instead of the haversine total', () => {
  assert.equal(metrics.providerScale(1000, 1050), 1.05);
  // Không có tổng của provider thì giữ nguyên hệ mét nội bộ.
  assert.equal(metrics.providerScale(1000, null), 1);
  assert.equal(metrics.providerScale(1000, 0), 1);
  assert.equal(metrics.providerScale(0, 1200), 1);
});

test('step lengths are normalized so the readout reaches zero at the destination', () => {
  const steps = [{ distanceMeters: 400 }, { distanceMeters: 600 }];
  const distances = metrics.normalizeStepDistances(steps, 1100);
  assert.equal(distances.length, 2);
  assert.ok(Math.abs(distances[0] - 440) < 1e-9);
  assert.ok(Math.abs(distances[1] - 660) < 1e-9);
  assert.ok(Math.abs(distances[0] + distances[1] - 1100) < 1e-9);

  // Tổng các bước đã khớp thì không đổi.
  assert.deepEqual(metrics.normalizeStepDistances(steps, 1000), [400, 600]);
  // Thiếu tổng provider hoặc bước hỏng thì giữ số gốc, không trả NaN.
  assert.deepEqual(metrics.normalizeStepDistances(steps, null), [400, 600]);
  assert.deepEqual(metrics.normalizeStepDistances([{ distanceMeters: -5 }], 1000), [0]);
});

test('remaining distance rounds like a navigation app instead of jittering every metre', () => {
  assert.equal(metrics.roundRemainingMeters(0), 0);
  assert.equal(metrics.roundRemainingMeters(4), 10);
  assert.equal(metrics.roundRemainingMeters(96), 100);
  assert.equal(metrics.roundRemainingMeters(126), 150);
  assert.equal(metrics.roundRemainingMeters(970), 950);
  assert.equal(metrics.roundRemainingMeters(1049), 1000);
  assert.equal(metrics.roundRemainingMeters(Number.NaN), 0);
});

test('remaining distance text switches to kilometres with the app locale', () => {
  assert.equal(metrics.formatRemainingMeters(0), '');
  assert.equal(metrics.formatRemainingMeters(7), '10 m');
  assert.equal(metrics.formatRemainingMeters(126), '150 m');
  assert.equal(metrics.formatRemainingMeters(999), '1 km');
  assert.equal(metrics.formatRemainingMeters(2450, 'vi-VN'), '2,5 km');
});
