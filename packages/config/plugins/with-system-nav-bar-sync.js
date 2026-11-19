const { withMainActivity } = require('expo/config-plugins');

const REQUIRED_IMPORTS = [
  'import android.content.res.Configuration',
  'import androidx.core.view.WindowCompat',
];

const NAV_SYNC_BLOCK = `    // @datxe system-nav-bar-sync begin
    syncSystemNavigationBars()
  }

  override fun onResume() {
    super.onResume()
    syncSystemNavigationBars()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      syncSystemNavigationBars()
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    syncSystemNavigationBars(newConfig)
  }

  private fun syncSystemNavigationBars(config: Configuration = resources.configuration) {
    val isNightMode =
        (config.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    val insetsController = WindowCompat.getInsetsController(window, window.decorView)
    insetsController.isAppearanceLightNavigationBars = !isNightMode
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      @Suppress("DEPRECATION")
      window.navigationBarColor =
          if (isNightMode) android.graphics.Color.BLACK else android.graphics.Color.WHITE
    }
    // @datxe system-nav-bar-sync end`;

/** Injects runtime Android navigation bar contrast sync into Expo MainActivity.kt across prebuilds. */
function patchMainActivity(contents) {
  let next = contents;
  for (const imp of REQUIRED_IMPORTS) {
    if (!next.includes(imp)) {
      next = next.replace(/(import android\.os\.Bundle\r?\n)/, `$1${imp}\n`);
    }
  }
  const markerPattern =
    /\r?\n[ \t]*\/\/ @datxe system-nav-bar-sync begin[\s\S]*?\/\/ @datxe system-nav-bar-sync end/g;
  if (markerPattern.test(next)) {
    return next.replace(markerPattern, `\n${NAV_SYNC_BLOCK}`);
  }
  if (next.includes('syncSystemNavigationBars(')) {
    return next;
  }
  const anchor = /(super\.onCreate\([^\n]*\)\r?\n)/;
  if (!anchor.test(next)) {
    throw new Error('with-system-nav-bar-sync requires super.onCreate(...) in MainActivity.kt.');
  }
  return next.replace(anchor, `$1${NAV_SYNC_BLOCK}\n`);
}

function withSystemNavBarSync(config) {
  return withMainActivity(config, (mod) => {
    if (mod.modResults.language !== 'kt') {
      throw new Error('with-system-nav-bar-sync requires Kotlin MainActivity.kt.');
    }
    mod.modResults.contents = patchMainActivity(mod.modResults.contents);
    return mod;
  });
}

withSystemNavBarSync.patchMainActivity = patchMainActivity;
module.exports = withSystemNavBarSync;
