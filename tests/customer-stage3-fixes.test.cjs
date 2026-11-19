const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const jsx = (type, props) => ({ type, props });
const allNodes = (node) =>
  !node || typeof node !== "object"
    ? []
    : Array.isArray(node)
      ? node.flatMap(allNodes)
      : [node, ...allNodes(node.props?.children)];

function load(file, mocks = {}) {
  const exports = {};
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    exports,
    require: (id) => {
      if (!(id in mocks)) throw new Error(`Unexpected import: ${id}`);
      return mocks[id];
    },
  });
  return exports;
}

test("BookingMap passes driver vehicleType and GoongMap renders geometric navigation marker with dark loading surface", () => {
  const MockGoongMap = () => null;
  const { BookingMap } = load("apps/customer/src/components/map/BookingMap.tsx", {
    "@/config/env": { env: { goongMapKey: "test-key" } },
    "@datxe/ui": { useReducedMotion: () => true },
    "@datxe/ui/goong-map": {
      GoongMap: MockGoongMap,
      mapBounds: () => [0, 0, 1, 1],
      routeCumulativeMeters: () => [],
      trimRouteAtDistance: (route) => route,
      // Hook được gọi trực tiếp ngoài cây React trong test: trả nguyên vị trí thô.
      useSmoothedRoutePosition: (target) => ({ position: target, alongMeters: null }),
    },
    react: { useMemo: (fn) => fn() },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });
  const bookingTree = BookingMap({
    center: { lat: 21.02, lng: 105.85 },
    driver: { lat: 21.03, lng: 105.86 },
    vehicleType: "MOTORCYCLE",
  });
  assert.equal(bookingTree.props.markers[0].vehicleType, "MOTORCYCLE");

  const { GoongMap } = load("packages/ui/src/maps/GoongMap.native.tsx", {
    "@datxe/shared": { translate: (t) => t },
    "@expo/vector-icons": { MaterialIcons: "MaterialIcons" },
    "@maplibre/maplibre-react-native": {
      Camera: "Camera",
      GeoJSONSource: "GeoJSONSource",
      Images: "Images",
      Layer: "Layer",
      Map: "Map",
      ViewAnnotation: "ViewAnnotation",
    },
    react: {
      useEffect: () => {},
      useMemo: (fn) => fn(),
      useRef: (v) => ({ current: v }),
      useState: (init) => [typeof init === "function" ? init() : init, () => {}],
    },
    "react-native": { StyleSheet: { create: (v) => v, absoluteFill: {} }, View: "View" },
    "react-native-paper": { ActivityIndicator: "ActivityIndicator" },
    "../components/Typography": { Typography: "Text" },
    "../theme/ThemeProvider": {
      useThemeColors: () => ({ background: "#121212", cardSurface: "#1E1E1E", error: "#F2B8B5", primary: "#FFB2BF" }),
    },
    "../theme/mapColors": { CURRENT_LOCATION_BLUE: "#00F", CURRENT_LOCATION_RING: "#FFF", TRIP_ROUTE_CASING: "#000", TRIP_ROUTE_COLOR: "#F00" },
    "./geometry": { DEFAULT_MAP_ZOOM: 15, goongStyleUrl: () => "https://example.test/style.json", lngLat: (c) => [c.lng, c.lat], mapPadding: () => ({}) },
    "./MapCameraSelection": { MapCameraSelection: class {} },
    "./assets/pickup-pin.png": 1,
    "./assets/dropoff-pin.png": 2,
    "./assets/location-heading.png": 3,
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  const tree = GoongMap({
    mapKey: "test-key",
    center: { lat: 21.02, lng: 105.85 },
    markers: [{ id: "driver", coordinate: { lat: 21.03, lng: 105.86 }, kind: "driver", vehicleType: "MOTORCYCLE" }],
  });
  const nodes = allNodes(tree);
  const icon = nodes.find((n) => n.type === "MaterialIcons");
  assert.equal(icon.props.name, "navigation");
  const serialized = JSON.stringify(tree);
  assert.equal(serialized.includes("two-wheeler"), false);
  assert.equal(serialized.includes("🚘"), false);
  const root = nodes[0];
  assert.equal(root.props.style[1].backgroundColor, "#121212");
});

test("Profile email, Vehicles empty placeholder, LegalDocuments and DriverProfileCard meet Stage 3 polish rules", () => {
  const { makeStyles } = load("apps/customer/src/features/profile/components/ProfileScreenParts.tsx", {
    "@datxe/shared": { getLocale: () => "vi-VN", translate: (t) => t },
    "@datxe/ui": { spacing: { margin: 16, spaceLg: 24, spaceXl: 32, spaceMd: 16, spaceSm: 8, spaceXs: 4, py1: 4, py0_5: 2, px2_5: 10, px3: 12, px3_5: 14, px5: 24, gap1_5: 6, profileAvatar: 64, buttonHeight: 48, modalMaxWidth: 384 }, typography: { headlineSm: {}, bodyMd: {}, labelMd: {}, labelSm: {}, labelLg: {} }, useThemeColors: () => ({}) },
    "react-native": { StyleSheet: { create: (v) => v, hairlineWidth: 1 } },
  });
  const profileStyle = makeStyles({ onSurfaceVariant: "#C6C5CF", outline: "#494950" });
  assert.equal(profileStyle.userEmail.color, "#C6C5CF");

  const { styles: vehicleStyles } = load("apps/customer/src/features/vehicles/components/CustomerVehiclesScreenParts.tsx", {
    "@datxe/ui": { spacing: { margin: 16 }, typography: { labelLg: {}, bodyMd: {}, headlineSm: {} } },
    "react-native": { StyleSheet: { create: (v) => v } },
  });
  const vs = vehicleStyles({ surfaceContainerHigh: "#29292D", primaryFixedTint: "#321820" });
  assert.equal(vs.imagePlaceholder.backgroundColor, "#29292D");

  const legalSource = fs.readFileSync("apps/customer/src/features/support/screens/LegalDocumentsScreen.tsx", "utf8");
  assert.doesNotMatch(legalSource, /Hiện tại ứng dụng hỗ trợ thanh toán tiền mặt\./);
  assert.match(legalSource, /ví PtitGo/);

  const driverCardSource = fs.readFileSync("apps/customer/src/features/tracking/components/DriverProfileCard.tsx", "utf8");
  assert.doesNotMatch(driverCardSource, /Mã tài xế #/);
});
