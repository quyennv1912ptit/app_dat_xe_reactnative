const path = require('node:path');
const { withAppBuildGradle } = require('expo/config-plugins');

// Persist the fix through Expo prebuild instead of editing generated native files.
module.exports = function withShortCmakePaths(config) {
  return withAppBuildGradle(config, mod => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('with-short-cmake-paths requires the Expo Groovy app/build.gradle template.');
    }
    const appRoot = mod.modRequest.projectRoot;
    const stagingRoot = path.resolve(appRoot, '../../.native-build', path.basename(appRoot));
    const stagingPath = path.relative(path.join(appRoot, 'android/app'), stagingRoot).split(path.sep).join('/');
    const marker = /\n?\/\/ @datxe short-cmake-paths begin[\s\S]*?\/\/ @datxe short-cmake-paths end\n?/g;
    mod.modResults.contents = mod.modResults.contents.replace(marker, '').trimEnd() + `

// @datxe short-cmake-paths begin
android {
    defaultConfig {
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_OBJECT_PATH_MAX=240"
            }
        }
    }
    externalNativeBuild {
        cmake {
            buildStagingDirectory file("${stagingPath}")
        }
    }
}
// @datxe short-cmake-paths end
`;
    return mod;
  });
};
