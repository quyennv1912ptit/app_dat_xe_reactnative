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

test("getRecentDestinations retains valid dropoff coordinates and excludes failed rides", () => {
  const utils = load("apps/customer/src/features/booking/bookingUtils.ts", {
    "@datxe/shared": { translate: (t) => t, getLocale: () => "vi-VN" },
  });
  const { getRecentDestinations } = load("apps/customer/src/features/booking/components/HomeScreenParts.tsx", {
    "@datxe/shared": { getLocale: () => "vi-VN", translate: (t) => t },
    "../bookingUtils": utils,
  });

  const recents = getRecentDestinations([
    { id: 1, dropoffAddress: "Hồ Gươm, Hoàn Kiếm", dropoffLat: 21.0285, dropoffLng: 105.8542, status: "CANCELLED" },
    { id: 2, dropoffAddress: "96A Trần Phú, Hà Đông", dropoffLat: 20.9806, dropoffLng: 105.7874, status: "COMPLETED" },
    { id: 3, dropoffAddress: "96a trần phú, hà đông", dropoffLat: 20.9806, dropoffLng: 105.7874, status: "COMPLETED" },
    { id: 4, dropoffAddress: "Bệnh viện Bạch Mai, Đống Đa", dropoffLat: null, dropoffLng: null, status: "COMPLETED" },
  ]);

  assert.equal(recents.length, 2);
  assert.equal(recents[0].title, "96A Trần Phú");
  assert.equal(recents[0].coordinate.lat, 20.9806);
  assert.equal(recents[0].coordinate.lng, 105.7874);
  assert.equal(recents[1].coordinate, null);
});

test("FareDetails discloses backend 1,000 VND rounding adjustment and reconciles with payableFare", () => {
  const i18n = require("./i18n-loader.cjs");
  const sharedUtils = load("packages/shared/src/utils/index.ts");
  i18n.setLanguage("vi");
  const utils = load("apps/customer/src/features/booking/bookingUtils.ts", {
    "@datxe/shared": { formatMoney: sharedUtils.formatMoney, translate: i18n.translate, getLocale: () => "vi-VN" },
  });
  const { FareDetails } = load("apps/customer/src/features/booking/components/FareDetails.tsx", {
    "@/components/CustomerRideUI": { CustomerNotice: "CustomerNotice", customerType: { metric: {}, numbers: {} } },
    "@datxe/shared": { formatMoney: sharedUtils.formatMoney, getLocale: () => "vi-VN", translate: i18n.translate },
    "@datxe/ui": {
      Card: "Card",
      KeyValueRow: ({ label, value }) => ({ type: "KeyValueRow", props: { label, value } }),
      Typography: "Text",
      useLanguage() {},
      useThemeColors: () => ({ primary: "#B3263D", transparent: "transparent" }),
      useThemedStyles: (f) => f({}),
    },
    "react-native": { StyleSheet: { create: (v) => v }, View: "View" },
    "react-native-paper": { ActivityIndicator: "ActivityIndicator", List: { Accordion: "Accordion" } },
    "../bookingUtils": utils,
    "./bookingStyles": { bookingStyles: () => ({ card: {}, label: {}, muted: {}, between: {}, text: {} }) },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  const tree = FareDetails({
    loading: false,
    error: "",
    retry: () => {},
    estimate: {
      distanceKm: 5.2,
      estimatedDurationMinutes: 14,
      baseFare: 10000,
      distanceFare: 51315,
      waitingFare: 0,
      nightSurcharge: 0,
      returnFee: 0,
      estimatedFare: 61315,
      discountAmount: 0,
      payableFare: 61000,
    },
  });
  const text = JSON.stringify(allNodes(tree));
  assert.match(text, /Làm tròn bội 1\.000 đ/);
  assert.match(text, /[-−]315[\s\u00A0]đ/);
  assert.match(text, /61\.000[\s\u00A0]đ/);
});

test("resolveLiveEtaTarget resolves pickup during approach and dropoff during IN_PROGRESS only", () => {
  const { resolveLiveEtaTarget } = load("apps/customer/src/features/tracking/hooks/useApproachRoute.ts", {
    "@/config/env": { env: { locationStaleMs: 60000 } },
    "@datxe/shared": { validLocationUpdate: () => false },
    "@/lib/api": { request: async () => null },
    "@tanstack/react-query": { useQuery: () => ({}) },
  });

  const ride = {
    id: 50,
    status: "DRIVER_ARRIVING",
    pickup: { lat: 21.01, lng: 105.81 },
    dropoff: { lat: 21.03, lng: 105.85 },
  };
  const pickupTarget = resolveLiveEtaTarget(ride);
  assert.equal(pickupTarget.phase, "pickup");
  assert.equal(pickupTarget.destination.lat, 21.01);
  assert.equal(pickupTarget.destination.lng, 105.81);
  const dropoffTarget = resolveLiveEtaTarget({ ...ride, status: "IN_PROGRESS" });
  assert.equal(dropoffTarget.phase, "dropoff");
  assert.equal(dropoffTarget.destination.lat, 21.03);
  assert.equal(dropoffTarget.destination.lng, 105.85);
  assert.equal(resolveLiveEtaTarget({ ...ride, status: "DRIVER_ARRIVED" }), null);
  assert.equal(resolveLiveEtaTarget({ ...ride, status: "COMPLETED" }), null);
});

test("useTripCompleted respects server customerHasRatedDriver and skips duplicate rating submission", async () => {
  const routes = [];
  let rateCalls = 0;
  let rideData = { id: 88, status: "COMPLETED", driverId: 2, customerHasRatedDriver: true };
  class MockAuthApiError extends Error {
    constructor(msg, code) { super(msg); this.code = code; }
  }
  const { useTripCompleted } = load("apps/customer/src/features/tracking/hooks/useTripCompleted.ts", {
    "@datxe/ui": { localizedAlert: () => {} },
    "@datxe/shared": { AuthApiError: MockAuthApiError, translate: (t) => t },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
      useQuery: () => ({ data: null, isLoading: false, refetch: async () => {} }),
    },
    "expo-router": { useLocalSearchParams: () => ({ rideId: "88" }), useRouter: () => ({ replace: (r) => routes.push(r) }) },
    react: { useState: (init) => [init, () => {}] },
    "../api": { getMyCustomerRideRating: async () => null, rateCustomerRide: async () => { rateCalls++; } },
    "./useRideQuery": { useRideQuery: () => ({ data: rideData, error: null, isSuccess: true, refetch: async () => {} }) },
  });

  const ratedHook = useTripCompleted();
  assert.equal(ratedHook.alreadyRated, true);
  await ratedHook.finish(false);
  assert.equal(rateCalls, 0);
  assert.deepEqual(routes, ["/(tabs)/home"]);

  rideData = { id: 88, status: "COMPLETED", driverId: 2, customerHasRatedDriver: false };
  const unratedHook = useTripCompleted();
  assert.equal(unratedHook.alreadyRated, false);
  await unratedHook.finish(false);
  assert.equal(rateCalls, 1);
});
