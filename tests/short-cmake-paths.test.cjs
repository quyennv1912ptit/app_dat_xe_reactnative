const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function apply(app, contents = 'apply plugin: "com.android.application"\n') {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../packages/config/plugins/with-short-cmake-paths.js'), 'utf8');
  vm.runInNewContext(source, { module, require: name => name === 'expo/config-plugins' ? { withAppBuildGradle: (_config, action) => action } : require(name) });
  return module.exports({})({
    modResults: { language: 'groovy', contents },
    modRequest: { projectRoot: path.resolve(__dirname, '../apps', app) },
  }).modResults.contents;
}

test('prebuild keeps the CMake path fix exactly once when regenerated', () => {
  const once = apply('customer');
  assert.equal(apply('customer', once), once);
  assert.equal((once.match(/CMAKE_OBJECT_PATH_MAX/g) ?? []).length, 1);
  assert.match(once, /arguments "-DCMAKE_OBJECT_PATH_MAX=240"/);
});

test('customer and driver use separate short C++ staging directories', () => {
  assert.match(apply('customer'), /file\("\.\.\/\.\.\/\.\.\/\.\.\/\.native-build\/customer"\)/);
  assert.match(apply('driver'), /file\("\.\.\/\.\.\/\.\.\/\.\.\/\.native-build\/driver"\)/);
});
