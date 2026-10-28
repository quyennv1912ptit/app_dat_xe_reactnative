const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const appRoot = process.cwd();
const app = path.basename(appRoot);
if (!['customer', 'driver'].includes(app)) throw new Error('Run npm run android -w customer or -w driver from the repository root.');
for (const name of [`team-dev-${app}.jks`]) {
  if (!fs.existsSync(path.join(appRoot, name))) {
    console.error(`Missing apps/${app}/${name}. Copy the shared team dev JKS into this app directory.`);
    process.exit(1);
  }
}

// Existing android/ projects also need the plugin on the first run after clone/update.
const gradleFile = path.join(appRoot, 'android/app/build.gradle');
if (!fs.existsSync(gradleFile) || !fs.readFileSync(gradleFile, 'utf8').includes('// @datxe team-dev-signing begin')) {
  const expoCli = require.resolve('expo/bin/cli');
  const result = spawnSync(process.execPath, [expoCli, 'prebuild', '--platform', 'android', '--no-install'], { cwd: appRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
