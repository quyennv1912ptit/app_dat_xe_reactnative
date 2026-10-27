const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = appRoot => {
  const features = fs.readdirSync(path.join(appRoot, 'src/features'));
  const zones = features.flatMap(target => features.filter(from => from !== target).map(from => ({target:`./src/features/${target}`,from:`./src/features/${from}`,message:'Feature không được import chéo feature.'})));
  zones.push({target:'./src/features',from:'./src/app'}, {target:'./src/components',from:'./src/features'}, {target:'./src/lib',from:'./src/features'}, {target:'../../packages/shared',from:'../../packages/ui'}, {target:'../../packages',from:'./src'});
  return defineConfig([expoConfig, {ignores:['dist/**','.expo/**','App.tsx','index.ts']}, {rules:{'import/no-restricted-paths':['error',{basePath:appRoot,zones}]}}]);
};
