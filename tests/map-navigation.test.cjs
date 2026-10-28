const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const exportsObject = {};
const source = fs.readFileSync(path.join(__dirname, '../apps/driver/src/lib/navigation.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject, require: id => id === 'expo-linking' ? { openURL: async () => {} } : { Alert: { alert() {} } } });
test('external directions retain the precise pickup/dropoff coordinates without a service key', () => {
  const url = new URL(exportsObject.externalDirectionsUrl({ lat: 21.030123456, lng: 105.840567891 }));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('destination'), '21.030123456,105.840567891');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.has('key'), false);
});
test('directions cannot open a guessed target when a coordinate is missing or invalid', () => {
  assert.throws(() => exportsObject.externalDirectionsUrl({ lat: null, lng: 105.84 }), /tọa độ hợp lệ/);
  assert.throws(() => exportsObject.externalDirectionsUrl({ lat: 200, lng: 105.84 }), /tọa độ hợp lệ/);
});
