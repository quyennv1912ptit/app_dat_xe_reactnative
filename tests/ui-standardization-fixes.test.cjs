const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const jsx = (type, props) => ({ type, props: props ?? {} });
const flatten = (node) =>
  !node || typeof node !== "object"
    ? []
    : Array.isArray(node)
      ? node.flatMap(flatten)
      : [node, ...flatten(node.props?.children)];

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

const platform = { OS: "android", select: (o) => o.android ?? o.default ?? {} };
const palette = loadTs("packages/ui/src/theme/colors.ts", { "react-native": { Platform: platform } });
const surfaces = loadTs("packages/ui/src/theme/surfaces.ts", {});
const theme = loadTs("packages/ui/src/theme/ThemeProvider.tsx", {
  "./colors": palette,
  react: { createContext: (v) => v, useContext: () => ({ dark: false, app: "customer", colors: theme.getThemeColors("customer", false) }) },
  "react-native": {},
  "react/jsx-runtime": { jsx, jsxs: jsx },
});
const sharedUtils = loadTs("packages/shared/src/utils/index.ts", {});
const i18n = require("./i18n-loader.cjs");

test("formatMoney standardizes VND digits, negative signs, and non-breaking unit spacing", () => {
  const nb = "\u00A0";
  assert.equal(sharedUtils.formatMoney(0, { locale: "vi-VN", nonBreaking: true }), `0${nb}đ`);
  assert.equal(sharedUtils.formatMoney(61000, { locale: "vi-VN", nonBreaking: true }), `61.000${nb}đ`);
  assert.equal(sharedUtils.formatMoney(999999, { locale: "vi-VN", nonBreaking: true }), `999.999${nb}đ`);
  assert.equal(sharedUtils.formatMoney(50000000, { locale: "vi-VN", nonBreaking: true }), `50.000.000${nb}đ`);
  assert.equal(sharedUtils.formatMoney(1000000000, { locale: "vi-VN", nonBreaking: true }), `1.000.000.000${nb}đ`);
  assert.equal(sharedUtils.formatMoney(-12200, { locale: "vi-VN", signed: true, nonBreaking: true }), `-12.200${nb}đ`);
  assert.equal(sharedUtils.formatMoney(12200, { locale: "vi-VN", signed: true, nonBreaking: true }), `+12.200${nb}đ`);
});

test("SharedStatusBadge renders complete labels without numberOfLines clipping across tones", () => {
  const { SharedStatusBadge } = loadTs("packages/ui/src/components/StatusBadge.tsx", {
    "@expo/vector-icons": { MaterialIcons: "Icon" },
    "../theme/colors": palette,
    "../theme/ThemeProvider": { useThemeColors: () => theme.getThemeColors("driver", false) },
    "./Typography": { Typography: "Text" },
    "react-native": { View: "View", StyleSheet: { create: (s) => s, hairlineWidth: 1 } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  const tree = SharedStatusBadge({ label: "Đã hủy", tone: "danger", icon: "cancel" });
  const textNode = flatten(tree).find((n) => n.type === "Text");
  assert.equal(textNode.props.children, "Đã hủy");
  assert.equal(textNode.props.numberOfLines, undefined);
  assert.equal(textNode.props.textBreakStrategy, "simple");
  const flatStyle = Object.assign({}, ...(Array.isArray(textNode.props.style) ? textNode.props.style : [textNode.props.style]));
  assert.notEqual(flatStyle.flexShrink, 1, "Status text must not compress horizontally inside narrow headers");
  assert.equal(flatStyle.letterSpacing, 0, "Badge text must use letterSpacing 0 so Android Fabric does not clip trailing Vietnamese words");

  const longBadge = SharedStatusBadge({ label: "Không tìm được tài xế", tone: "danger", icon: "error-outline" });
  const badgeRootStyle = Object.assign({}, ...(Array.isArray(longBadge.props.style) ? longBadge.props.style : [longBadge.props.style]));
  assert.equal(badgeRootStyle.flexShrink, 0);
  const longText = flatten(longBadge).find((n) => n.type === "Text");
  assert.equal(longText.props.children, "Không tìm được tài xế");
  const longFlatStyle = Object.assign(
    {},
    ...(Array.isArray(longText.props.style) ? longText.props.style : [longText.props.style]),
  );
  assert.ok(
    typeof longFlatStyle.minWidth === "number" && longFlatStyle.minWidth >= 140,
    "Multi-word status badge must reserve safe minWidth against Android OEM font clipping",
  );
});

test("MoneyText and KeyValueRow adapt to 320dp widths and large fontScale without truncating", () => {
  const { MoneyText } = loadTs("packages/ui/src/components/MoneyText.tsx", {
    "@datxe/shared": { ...i18n, ...sharedUtils },
    "../theme/colors": palette,
    "./Typography": { Typography: "Text" },
    "react-native": { StyleSheet: { create: (s) => s } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  i18n.setLanguage("vi");
  const moneyNode = MoneyText({ value: 1000000000, variant: "headline" });
  assert.equal(moneyNode.props.numberOfLines, undefined);
  assert.equal(moneyNode.props.textBreakStrategy, "simple");
  assert.equal(moneyNode.props.children, "1.000.000.000\u00A0đ");

  let mockDim = { width: 390, fontScale: 1 };
  const { KeyValueRow } = loadTs("packages/ui/src/components/KeyValueRow.tsx", {
    "../theme/colors": palette,
    "../theme/ThemeProvider": { useThemeColors: () => theme.getThemeColors("customer", false) },
    "./Typography": { Typography: "Text" },
    "react-native": { View: "View", StyleSheet: { create: (s) => s }, useWindowDimensions: () => mockDim },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  const inlineRow = KeyValueRow({ label: "Quãng đường", value: "10,3 km" });
  const inlineStyles = inlineRow.props.style.filter(Boolean);
  assert.equal(inlineStyles.some((s) => s.flexDirection === "column"), false);

  const longValueRow = KeyValueRow({ label: "Phương tiện", value: "Xe máy · Honda Jet jet · Đen · 88K1 22442" });
  assert.equal(longValueRow.props.style.filter(Boolean).some((s) => s.flexDirection === "column"), true);

  mockDim = { width: 320, fontScale: 1 };
  const narrowRow = KeyValueRow({ label: "Giá dự kiến ban đầu (không thu)", value: "1.000.000.000\u00A0đ" });
  assert.equal(narrowRow.props.style.filter(Boolean).some((s) => s.flexDirection === "column"), true);

  mockDim = { width: 412, fontScale: 1.5 };
  const scaledRow = KeyValueRow({ label: "Giá dự kiến ban đầu (không thu)", value: "1.000.000.000\u00A0đ" });
  assert.equal(scaledRow.props.style.filter(Boolean).some((s) => s.flexDirection === "column"), true);
});

test("Driver HomeOperationalStatus renders structured Loại xe nhận chuyến GroupedList without guessing", () => {
  const health = { foregroundGranted: true, connected: true, lastSentAt: Date.now(), isMocked: false, retry() {} };
  const { HomeOperationalStatus } = loadTs("apps/driver/src/features/offers/components/HomeOperationalStatus.tsx", {
    react: { useEffect() {}, useState: (i) => [i, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@/lib/driverHealth": { useDriverHealth: () => health },
    "@expo/vector-icons": { MaterialIcons: "Icon" },
    "@datxe/ui": {
      Card: "Card",
      Button: "Button",
      GroupedList: ({ title, children }) => ({ type: "GroupedList", props: { title, children } }),
      MotionPressable: "Pressable",
      Typography: "Text",
      borderRadius: { default: 24, full: 999 },
      spacing: { xxs: 2, px3: 12, spaceSm: 8, spaceLg: 24 },
      typography: { titleLg: { fontSize: 20 }, labelMd: { fontSize: 13 }, labelLg: { fontSize: 16 } },
      useThemeColors: () => theme.getThemeColors("driver", false),
    },
    "react-native": { View: "View", StyleSheet: { create: (s) => s } },
  });

  const onlineKnown = JSON.stringify(
    HomeOperationalStatus({
      online: true,
      active: false,
      loading: false,
      acceptedVehicleTypes: ["MOTORCYCLE", "CAR"],
      onlineVehicle: "CAR",
      selectedVehicle: "CAR",
      onDiagnostics() {},
    }),
  );
  assert.match(onlineKnown, /Loại xe nhận chuyến/);
  assert.match(onlineKnown, /Ô tô, Đang nhận/);
  assert.match(onlineKnown, /Xe máy, Không nhận/);

  const onlineUnknown = JSON.stringify(
    HomeOperationalStatus({
      online: true,
      active: false,
      loading: false,
      acceptedVehicleTypes: ["CAR"],
      onlineVehicle: null,
      selectedVehicle: "CAR",
      onDiagnostics() {},
    }),
  );
  assert.match(onlineUnknown, /Ô tô, Chưa xác định/);
  assert.doesNotMatch(onlineUnknown, /Đang nhận:/);
});

test("Cancelled rides suppress prominent billed MoneyText hero on CustomerPaymentSummary", () => {
  const { CustomerPaymentSummary } = loadTs("apps/customer/src/components/CustomerPaymentSummary.tsx", {
    "./PendingPaymentMethod": { PendingPaymentMethod: () => null },
    "./CustomerRideUI": {
      customerType: { meta: {}, address: {} },
      MoneyText: "HeroMoneyText",
    },
    "@datxe/shared": { ...i18n, ...sharedUtils },
    "@datxe/ui": {
      Card: "Card",
      KeyValueRow: "KeyValueRow",
      SharedStatusBadge: "SharedStatusBadge",
      Typography: "Text",
      useLanguage() {},
      useThemeColors: () => theme.getThemeColors("customer", false),
    },
    "react-native": { StyleSheet: { create: (s) => s }, View: "View" },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  i18n.setLanguage("vi");
  const cancelledTree = CustomerPaymentSummary({
    ride: {
      id: 9,
      status: "CANCELLED",
      estimatedFare: 85000,
      finalFare: null,
      paymentMethod: "CASH",
      payment: null,
      discountAmount: 0,
    },
  });
  const nodes = flatten(cancelledTree);
  assert.equal(nodes.some((n) => n.type === "HeroMoneyText"), false);
  assert.match(JSON.stringify(cancelledTree), /Không phát sinh thu cước/);
});

test("Banned crude vehicle icons and emojis are completely removed from Customer, Driver, and UI packages", () => {
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
  const sources = [
    ...walk(path.join(ROOT, "apps/customer/src")),
    ...walk(path.join(ROOT, "apps/driver/src")),
    ...walk(path.join(ROOT, "packages/ui/src")),
  ].filter((f) => /\.(ts|tsx)$/.test(f));

  const banned = [/🚘/, /["']two-wheeler["']/, /["']directions-car["']/, /["']local-taxi["']/];
  for (const file of sources) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of banned) {
      assert.doesNotMatch(content, pattern, `Unexpected crude vehicle visual (${pattern}) in ${file}`);
    }
  }
  assert.ok(surfaces);
});

test("Booking dropoff icons use onRideDropoff, RegisterScreenParts avoids onPrimary override, and DriverProfileCard omits duplicate inline contactActions", () => {
  const mapPickerSrc = fs.readFileSync(
    path.join(ROOT, "apps/customer/src/features/booking/screens/MapPickerScreen.tsx"),
    "utf8",
  );
  const placeSelectionSrc = fs.readFileSync(
    path.join(ROOT, "apps/customer/src/features/booking/screens/PlaceSelectionScreen.tsx"),
    "utf8",
  );
  const registerPartsSrc = fs.readFileSync(
    path.join(ROOT, "apps/driver/src/features/auth/components/RegisterScreenParts.tsx"),
    "utf8",
  );
  const driverProfileCardSrc = fs.readFileSync(
    path.join(ROOT, "apps/customer/src/features/tracking/components/DriverProfileCard.tsx"),
    "utf8",
  );

  assert.match(mapPickerSrc, /colors\.onRideDropoff/);
  assert.match(placeSelectionSrc, /colors\.onRideDropoff/);
  assert.doesNotMatch(registerPartsSrc, /secondaryButtonText|colors\.onPrimary/);
  assert.doesNotMatch(driverProfileCardSrc, /contactActions/);
});
