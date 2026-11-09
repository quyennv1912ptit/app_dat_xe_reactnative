const { withAppBuildGradle } = require('expo/config-plugins');

// Chỉ bật trên CI; không đưa mật khẩu vào mã nguồn hoặc file Gradle sinh ra.
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, mod => {
    if (mod.modResults.language !== 'groovy') throw new Error('Release signing requires Groovy.');
    const marker = /\n?\/\/ @datxe release-signing begin[\s\S]*?\/\/ @datxe release-signing end\n?/g;
    mod.modResults.contents = mod.modResults.contents.replace(marker, '').trimEnd() + `

// @datxe release-signing begin
// Đường dẫn tuyệt đối và thông tin ký được truyền qua biến môi trường của CI.
def releaseSigningEnv = ["ANDROID_KEYSTORE_PATH", "ANDROID_STORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"]
releaseSigningEnv.each { name ->
    if (!System.getenv(name)) throw new GradleException("Missing signing variable: " + name)
}
android {
    signingConfigs {
        ciRelease {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_STORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.ciRelease
        }
    }
}
// @datxe release-signing end
`;
    return mod;
  });
};
