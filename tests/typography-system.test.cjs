const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");

function loadTs(rel, mocks = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  vm.runInNewContext(outputText, {
    exports,
    module: { exports },
    require: (id) => {
      if (id in mocks) return mocks[id];
      return require(id);
    },
  });
  return exports;
}

const loadColors = (os = "android") =>
  loadTs("packages/ui/src/theme/colors.ts", {
    "react-native": {
      Platform: { OS: os, select: (o) => o[os] ?? o.default ?? {} },
    },
  });

const SEMANTIC_ROLES = [
  "display",
  "moneyDisplay",
  "screenTitle",
  "sectionTitle",
  "cardTitle",
  "body",
  "bodySecondary",
  "label",
  "caption",
  "button",
  "badge",
  "navigationLabel",
];

test("Unified typography defines all 12 semantic roles with Vietnamese-safe line heights and single OS sans font", () => {
  for (const [os, expectedFont] of [
    ["android", "sans-serif"],
    ["ios", "System"],
    ["web", "Roboto, Arial, sans-serif"],
  ]) {
    const { fontFamily, typography } = loadColors(os);
    assert.equal(fontFamily.system, expectedFont);
    assert.equal(fontFamily.sans, expectedFont);
    assert.equal(fontFamily.inter, expectedFont);

    for (const role of SEMANTIC_ROLES) {
      const token = typography[role];
      assert.ok(token, `Missing typography semantic role: ${role}`);
      assert.equal(token.fontFamily, expectedFont, `${role} must use unified ${expectedFont}`);
      assert.equal(typeof token.fontSize, "number", `${role} needs numeric fontSize`);
      assert.equal(typeof token.lineHeight, "number", `${role} needs numeric lineHeight`);
      assert.ok(
        token.lineHeight >= token.fontSize + 5,
        `${role} lineHeight (${token.lineHeight}) should have >=5px headroom over fontSize (${token.fontSize}) for Vietnamese diacritics`,
      );
      assert.equal(typeof token.letterSpacing, "number", `${role} needs explicit letterSpacing`);
      assert.notEqual(token.fontWeight, "800", `${role} must not use heavy 800 weight`);
    }

    assert.deepEqual(Array.from(typography.moneyDisplay.fontVariant), ["tabular-nums"]);
  }
});

test("createMaterialTheme aligns React Native Paper MD3 font slots 1:1 with semantic typography", () => {
  const palette = loadColors("android");
  const baseFonts = Object.fromEntries(
    [
      "displayLarge",
      "displayMedium",
      "displaySmall",
      "headlineLarge",
      "headlineMedium",
      "headlineSmall",
      "titleLarge",
      "titleMedium",
      "titleSmall",
      "bodyLarge",
      "bodyMedium",
      "bodySmall",
      "labelLarge",
      "labelMedium",
      "labelSmall",
    ].map((k) => [k, { fontFamily: "System", fontSize: 12, fontWeight: "400", letterSpacing: 0, lineHeight: 16 }]),
  );

  const { createMaterialTheme } = loadTs("packages/ui/src/theme/materialTheme.ts", {
    "react-native-paper": {
      MD3LightTheme: { colors: {}, fonts: baseFonts },
      MD3DarkTheme: { colors: {}, fonts: baseFonts },
    },
    "./ThemeProvider": {
      getThemeColors: () => ({
        primary: "#B3263D",
        onPrimary: "#FFFFFF",
        primaryContainer: "#FFD9DF",
        onPrimaryContainer: "#400012",
        secondary: "#61616B",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#E0E0E0",
        onSecondaryContainer: "#1B1B1F",
        tertiary: "#67507D",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#EEDCFF",
        onTertiaryContainer: "#220D36",
        error: "#BA1A1A",
        onError: "#FFFFFF",
        errorContainer: "#FFDAD6",
        onErrorContainer: "#410002",
        background: "#F3F4F6",
        onBackground: "#1B1B1F",
        cardSurface: "#FFFFFF",
        onSurface: "#1B1B1F",
        surfaceVariant: "#ECEEF2",
        onSurfaceVariant: "#61616B",
        outline: "#8A8A93",
        outlineVariant: "#E5E7EB",
        surfaceContainerLowest: "#FFFFFF",
        surfaceContainerLow: "#F9FAFB",
        surfaceContainerHigh: "#ECEEF2",
        surfaceContainerHighest: "#E5E7EB",
      }),
    },
    "./colors": palette,
  });

  const md3 = createMaterialTheme("customer", false);
  const { typography } = palette;
  assert.equal(md3.fonts.displayMedium.fontSize, typography.display.fontSize);
  assert.equal(md3.fonts.headlineSmall.fontSize, typography.screenTitle.fontSize);
  assert.equal(md3.fonts.titleLarge.fontSize, typography.sectionTitle.fontSize);
  assert.equal(md3.fonts.titleMedium.fontSize, typography.cardTitle.fontSize);
  assert.equal(md3.fonts.bodyLarge.fontSize, typography.body.fontSize);
  assert.equal(md3.fonts.bodyMedium.fontSize, typography.bodySecondary.fontSize);
  assert.equal(md3.fonts.labelLarge.fontSize, typography.button.fontSize);
  assert.equal(md3.fonts.labelMedium.fontSize, typography.label.fontSize);
  assert.equal(md3.fonts.labelSmall.fontSize, typography.badge.fontSize);
});

test("Customer and Driver screens and UI primitives share semantic typography roles with zero font-scale blocks", () => {
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );

  const files = [
    ...walk(path.join(ROOT, "packages/ui/src")),
    ...walk(path.join(ROOT, "apps/customer/src")),
    ...walk(path.join(ROOT, "apps/driver/src")),
  ].filter((f) => /\.(ts|tsx)$/.test(f));

  const forbiddenOutsideTheme = [
    { name: "allowFontScaling=false", regex: /\ballowFontScaling\s*=/ },
    { name: "maxFontSizeMultiplier", regex: /\bmaxFontSizeMultiplier\b/ },
    { name: "adjustsFontSizeToFit", regex: /\badjustsFontSizeToFit\b/ },
    { name: "heavy 800 weight", regex: /\bfontWeight\s*:\s*["']800["']/ },
  ];

  const allowedRawTypographyExceptions = new Set([
    path.normalize("packages/ui/src/maps/GoongMap.web.tsx"),
    path.normalize("packages/ui/src/auth/PhoneNumberInput.tsx"),
  ]);

  for (const fullPath of files) {
    const rel = path.normalize(path.relative(ROOT, fullPath));
    const content = fs.readFileSync(fullPath, "utf8");

    for (const rule of forbiddenOutsideTheme) {
      assert.doesNotMatch(content, rule.regex, `Forbidden ${rule.name} found in ${rel}`);
    }

    if (!rel.startsWith(path.normalize("packages/ui/src/theme")) && !allowedRawTypographyExceptions.has(rel)) {
      assert.doesNotMatch(
        content,
        /\bfontSize\s*:/,
        `Hardcoded fontSize found outside theme in ${rel}; use semantic typography.* tokens`,
      );
      assert.doesNotMatch(
        content,
        /\blineHeight\s*:/,
        `Hardcoded lineHeight found outside theme in ${rel}; use semantic typography.* tokens`,
      );
      assert.doesNotMatch(
        content,
        /\bfontFamily\s*:/,
        `Hardcoded fontFamily found outside theme in ${rel}; use semantic typography.* tokens`,
      );
    }
  }

  const checkToken = (rel, tokenPattern) => {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.match(text, tokenPattern, `${rel} must use ${tokenPattern}`);
  };

  checkToken("apps/customer/src/components/ScreenHeader.tsx", /typography\.screenTitle/);
  checkToken("apps/driver/src/components/DriverPage.tsx", /typography\.screenTitle/);
  checkToken("packages/ui/src/components/Button.tsx", /typography\.button/);
  checkToken("packages/ui/src/components/FilterChip.tsx", /typography\.label/);
  checkToken("packages/ui/src/components/StatusBadge.tsx", /typography\.badge/);
  checkToken("packages/ui/src/components/TonalNavigationBar.tsx", /typography\.navigationLabel/);
});
