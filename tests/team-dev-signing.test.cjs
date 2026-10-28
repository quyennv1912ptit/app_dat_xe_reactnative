const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function apply(app, contents) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../packages/config/plugins/with-team-dev-signing.js'), 'utf8');
  vm.runInNewContext(source, { module, require: name => name === 'expo/config-plugins' ? { withAppBuildGradle: (_config, action) => action } : require(name) });
  return module.exports({}, { keystoreFile: `team-dev-${app}.jks`, keyAlias: `team-dev-${app}` })({
    modResults: { language: 'groovy', contents },
    modRequest: { projectRoot: path.resolve(__dirname, '../apps', app) },
  }).modResults.contents;
}

test('each debug app uses its own shared key and default development passwords', () => {
  for (const app of ['customer', 'driver']) {
    const output = apply(app, 'apply plugin: "com.android.application"\n');
    assert.ok(output.includes(`rootProject.file("../team-dev-${app}.jks")`));
    assert.ok(output.includes(`getProperty("keyAlias", "team-dev-${app}")`));
    assert.ok(output.includes('getProperty("storePassword", "android")'));
    assert.ok(output.includes('getProperty("keyPassword", "android")'));
    assert.match(output, /debug \{\s*signingConfig signingConfigs.teamDev/);
  }
});

test('repeated prebuild does not duplicate signing configuration or replace release signing', () => {
  const original = 'android { buildTypes { release { signingConfig signingConfigs.production } } }\n';
  const once = apply('customer', original);
  assert.equal(apply('customer', once), once);
  assert.ok(once.startsWith(original.trim()));
  assert.equal((once.match(/\/\/ @datxe team-dev-signing begin/g) ?? []).length, 1);
  assert.equal((once.match(/signingConfig signingConfigs.teamDev/g) ?? []).length, 1);
});

test('debug and signingReport validate that the actual private key can be unlocked', () => {
  const output = apply('driver', '');
  assert.ok(output.includes('java.security.KeyStore.getInstance(datxeTeamKeystore, storePass.toCharArray())'));
  assert.ok(output.includes('keyStore.getKey(datxeTeamAlias, keyPass.toCharArray())'));
  assert.ok(output.includes('["preDebugBuild", "validateSigningDebug", "signingReport"]'));
  assert.ok(output.includes('if (!datxeTeamKeystore.isFile()) throw new GradleException'));
});
