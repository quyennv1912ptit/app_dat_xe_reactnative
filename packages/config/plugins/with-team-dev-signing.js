const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withTeamDevSigning(config, { keystoreFile, keyAlias }) {
  if (!/^[a-zA-Z0-9._-]+\.jks$/.test(keystoreFile) || !/^[a-zA-Z0-9._-]+$/.test(keyAlias)) {
    throw new Error('Team dev signing requires a JKS filename and a valid key alias.');
  }
  return withAppBuildGradle(config, mod => {
    if (mod.modResults.language !== 'groovy') throw new Error('Team dev signing requires Groovy build.gradle.');
    const marker = /\n?\/\/ @datxe team-dev-signing begin[\s\S]*?\/\/ @datxe team-dev-signing end\n?/g;
    mod.modResults.contents = mod.modResults.contents.replace(marker, '').trimEnd() + `

// @datxe team-dev-signing begin
def datxeTeamKeystore = rootProject.file("../${keystoreFile}")
def datxeTeamPropertiesFile = rootProject.file("../signing.properties")
def datxeTeamProperties = new Properties()
if (datxeTeamPropertiesFile.exists()) {
    datxeTeamPropertiesFile.withInputStream { datxeTeamProperties.load(it) }
}
def datxeTeamAlias = datxeTeamProperties.getProperty("keyAlias", "${keyAlias}")

android {
    signingConfigs {
        teamDev {
            storeFile datxeTeamKeystore
            storePassword datxeTeamProperties.getProperty("storePassword", "android")
            keyAlias datxeTeamAlias
            keyPassword datxeTeamProperties.getProperty("keyPassword", "android")
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.teamDev
        }
    }
}

def datxeValidateTeamSigning = tasks.register("validateTeamDevSigning") {
    doLast {
        if (!datxeTeamKeystore.isFile()) throw new GradleException("Missing team dev key: " + datxeTeamKeystore)
        def storePass = datxeTeamProperties.getProperty("storePassword", "android")
        def keyPass = datxeTeamProperties.getProperty("keyPassword", "android")
        if (!storePass || !keyPass) throw new GradleException("signing.properties requires storePassword and keyPassword.")
        try {
            def keyStore = java.security.KeyStore.getInstance(datxeTeamKeystore, storePass.toCharArray())
            if (!(keyStore.getKey(datxeTeamAlias, keyPass.toCharArray()) instanceof java.security.PrivateKey)) {
                throw new GradleException("The configured team key alias is not a private key.")
            }
        } catch (Exception ignored) {
            throw new GradleException("Cannot unlock the team dev key. Check storePassword, keyPassword and keyAlias in signing.properties.")
        }
    }
}
tasks.matching { it.name in ["preDebugBuild", "validateSigningDebug", "signingReport"] }.configureEach {
    dependsOn(datxeValidateTeamSigning)
}
// @datxe team-dev-signing end
`;
    return mod;
  });
};
