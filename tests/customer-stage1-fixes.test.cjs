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

test("customerRidePresentation distinguishes handover lifecycle states and blocks stale revisions", () => {
  const {
    customerRidePresentation,
    customerHandoverInspectionPresentation,
  } = load("apps/customer/src/lib/customerRidePresentation.ts");

  const baseRide = {
    id: 14,
    type: "INSTANT",
    status: "DRIVER_ARRIVED",
    driverId: 1,
    handoverReports: [],
  };

  // 1. Report not submitted yet
  const arrived = customerRidePresentation(baseRide, true);
  assert.equal(arrived.primaryAction, undefined);
  assert.equal(arrived.handovers.pickup.state, "not_submitted");
  const arrivedInspect = customerHandoverInspectionPresentation(baseRide, "PICKUP", undefined, true);
  assert.equal(arrivedInspect.mode, "not_submitted");
  assert.equal(arrivedInspect.canConfirm, false);

  // 2. Submitted rev 1 awaiting customer review
  const handoverPending = {
    ...baseRide,
    status: "VEHICLE_HANDOVER",
    handoverReports: [
      { id: 1, phase: "PICKUP", revision: 1, confirmedByCustomer: false, correctionReason: null, odometer: 1200, fuelLevel: 80, notes: null, photos: [] },
    ],
  };
  const pendingPres = customerRidePresentation(handoverPending, true);
  assert.equal(pendingPres.primaryAction?.kind, "review_handover");
  assert.equal(pendingPres.primaryAction?.revision, 1);

  // 3. Correction requested -> no primary review CTA, can only inspect
  const handoverCorrection = {
    ...baseRide,
    status: "VEHICLE_HANDOVER",
    handoverReports: [
      { id: 1, phase: "PICKUP", revision: 1, confirmedByCustomer: false, correctionReason: "Ảnh bị mờ biển số", odometer: 1200, fuelLevel: 80, notes: null, photos: [] },
    ],
  };
  const correctionPres = customerRidePresentation(handoverCorrection, true);
  assert.equal(correctionPres.primaryAction, undefined);
  assert.equal(correctionPres.secondaryHandoverView?.phase, "pickup");
  const correctionInspect = customerHandoverInspectionPresentation(handoverCorrection, "PICKUP", 1, true);
  assert.equal(correctionInspect.mode, "correction_requested");
  assert.equal(correctionInspect.canConfirm, false);

  // 4. Stale revision protection: customer opened rev 1, driver submitted rev 2
  const handoverV2 = {
    ...baseRide,
    status: "VEHICLE_HANDOVER",
    handoverReports: [
      { id: 1, phase: "PICKUP", revision: 2, confirmedByCustomer: false, correctionReason: null, odometer: 1250, fuelLevel: 80, notes: null, photos: [] },
    ],
  };
  const staleInspect = customerHandoverInspectionPresentation(handoverV2, "PICKUP", 1, true);
  assert.equal(staleInspect.mode, "stale_revision");
  assert.equal(staleInspect.isStaleRevision, true);
  assert.equal(staleInspect.currentRevision, 2);
  assert.equal(staleInspect.canConfirm, false);
  assert.equal(staleInspect.canRequestCorrection, false);

  const syncedInspect = customerHandoverInspectionPresentation(handoverV2, "PICKUP", 2, true);
  assert.equal(syncedInspect.mode, "pending_confirmation");
  assert.equal(syncedInspect.canConfirm, true);

  // 5. Confirmed handover awaits driver start without confirm button
  const handoverConfirmed = {
    ...baseRide,
    status: "VEHICLE_HANDOVER",
    handoverReports: [
      { id: 1, phase: "PICKUP", revision: 2, confirmedByCustomer: true, correctionReason: null, odometer: 1250, fuelLevel: 80, notes: null, photos: [] },
    ],
  };
  const confirmedPres = customerRidePresentation(handoverConfirmed, true);
  assert.equal(confirmedPres.primaryAction, undefined);
  assert.equal(confirmedPres.handovers.pickup.state, "confirmed");
  const confirmedInspect = customerHandoverInspectionPresentation(handoverConfirmed, "PICKUP", 2, true);
  assert.equal(confirmedInspect.mode, "confirmed");
  assert.equal(confirmedInspect.canConfirm, false);
});

test("SessionGate classifier preserves session on network and server outages and suggests login on expired auth", () => {
  class MockAuthApiError extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
    }
  }
  const { classifyCustomerSessionFailure } = load("apps/customer/src/features/auth/sessionGateHelpers.ts", {
    "@datxe/shared": { AuthApiError: MockAuthApiError },
  });

  const reg = classifyCustomerSessionFailure(new MockAuthApiError("Not registered", "ACCOUNT_NOT_FOUND"));
  assert.equal(reg.kind, "navigate");
  assert.equal(reg.destination, "/(auth)/register");

  const net = classifyCustomerSessionFailure(new MockAuthApiError("Offline", "NETWORK_ERROR"));
  assert.equal(net.kind, "error");
  assert.equal(net.shouldSuggestLogin, false);

  const server503 = classifyCustomerSessionFailure(new MockAuthApiError("503", "HTTP_503"));
  assert.equal(server503.kind, "error");
  assert.equal(server503.shouldSuggestLogin, false);

  const auth401 = classifyCustomerSessionFailure(new MockAuthApiError("Expired", "HTTP_401"));
  assert.equal(auth401.kind, "error");
  assert.equal(auth401.shouldSuggestLogin, true);
});

test("NO_DRIVER_FOUND recovery rebuilds editable draft without stale quotes and detects expired schedule", () => {
  const utils = load("apps/customer/src/features/booking/bookingUtils.ts", {
    "@datxe/shared": { translate: (t) => t, getLocale: () => "vi-VN" },
  });
  const { buildRestoredDraftFromRide } = load("apps/customer/src/features/booking/findDriverRecovery.ts", {
    "./bookingUtils": utils,
  });

  const failedRide = {
    id: 99,
    vehicleId: 4,
    type: "SCHEDULED",
    status: "NO_DRIVER_FOUND",
    scheduledAt: "2026-11-17T08:00:00.000Z",
    pickupAddress: "96A Trần Phú, Hà Đông",
    pickup: { lat: 20.9806, lng: 105.7874 },
    dropoffAddress: "Hồ Hoàn Kiếm, Hoàn Kiếm",
    dropoff: { lat: 21.0285, lng: 105.8542 },
    estimatedFare: 65000,
    discountAmount: 5000,
    paymentMethod: "WALLET",
    pickupNote: "Cổng chính",
  };

  // Past schedule on cold start
  const pastNow = Date.parse("2026-11-17T09:00:00.000Z");
  const restoredPast = buildRestoredDraftFromRide(failedRide, null, pastNow);
  assert.equal(restoredPast.scheduleExpired, true);
  assert.equal(restoredPast.snapshot.scheduledAt, null);
  assert.equal(restoredPast.snapshot.vehicleId, 4);
  assert.equal(restoredPast.snapshot.pickup.coordinate.lat, 20.9806);
  assert.equal(restoredPast.snapshot.paymentMethod, "WALLET");
  assert.equal(restoredPast.previousPayableFare, 60000);
  assert.equal("routeQuoteId" in restoredPast.snapshot, false);

  // Future schedule with matching lastBookedDraft voucher/note
  const futureNow = Date.parse("2026-11-17T07:00:00.000Z");
  const restoredFuture = buildRestoredDraftFromRide(
    failedRide,
    {
      pickup: { id: "saved-p", name: "PTIT", address: "96A Trần Phú", coordinate: { lat: 20.9806, lng: 105.7874 }, provider: "goong" },
      dropoff: { id: "saved-d", name: "Hồ Gươm", address: "Hồ Hoàn Kiếm", coordinate: { lat: 21.0285, lng: 105.8542 }, provider: "goong" },
      vehicleId: 4,
      voucherCode: "PTIT10",
      note: "Gọi trước",
      pickupNote: "Cổng chính",
      scheduledAt: "2026-11-17T08:00:00.000Z",
      paymentMethod: "WALLET",
      payableFare: 55000,
    },
    futureNow,
  );
  assert.equal(restoredFuture.scheduleExpired, false);
  assert.equal(restoredFuture.snapshot.voucherCode, "PTIT10");
  assert.equal(restoredFuture.snapshot.note, "Gọi trước");
  assert.equal(restoredFuture.previousPayableFare, 55000);
});

test("ScreenWrapper enforces Android StatusBar fallback inset when initial insets.top is 0 and respects edges", () => {
  const native = {
    Platform: { OS: "android" },
    StatusBar: { currentHeight: 29 },
    StyleSheet: { create: (v) => v },
    View: "View",
  };
  let mockInsets = { top: 0, bottom: 24, left: 0, right: 0 };
  const { ScreenWrapper } = load("packages/ui/src/components/ScreenWrapper.tsx", {
    "react-native": native,
    "react-native-safe-area-context": { useSafeAreaInsets: () => mockInsets },
    "../theme/ThemeProvider": {
      useThemedStyles: (f) => f({ background: "#F3F4F6" }),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  const frame1 = ScreenWrapper({ edges: ["top", "bottom"], children: null });
  assert.equal(frame1.props.style[1].paddingTop, 29);
  assert.equal(frame1.props.style[1].paddingBottom, 24);

  const noTop = ScreenWrapper({ edges: ["bottom"], children: null });
  assert.equal(noTop.props.style[1].paddingTop, 0);

  mockInsets = { top: 34, bottom: 24, left: 0, right: 0 };
  const settled = ScreenWrapper({ edges: ["top", "bottom"], children: null });
  assert.equal(settled.props.style[1].paddingTop, 34);
});

test("TonalNavigationBar keeps badge and tab text unclipped for large font scaling", () => {
  const { TonalNavigationBar } = load("packages/ui/src/components/TonalNavigationBar.tsx", {
    "@expo/vector-icons": { MaterialIcons: "MaterialIcons" },
    "@datxe/shared": { translate: (v) => v },
    "react": { useState: (initial) => [initial, () => {}], useEffect: () => {} },
    "react-native": { StyleSheet: { create: (v) => v }, View: "View", Pressable: "Pressable" },
    "react-native-paper": { Badge: "Badge", Text: "Text" },
    "../theme/colors": {
      fontWeight: { medium: "500", semibold: "600" },
      typography: { navigationLabel: { fontSize: 13, lineHeight: 18 } },
    },
    "../theme/ThemeProvider": {
      useThemeColors: () => ({
        cardSurface: "#FFF",
        transparent: "transparent",
        primaryContainer: "#FFD9DF",
        primary: "#B3263D",
        onPrimaryContainer: "#400012",
        onSurfaceVariant: "#61616B",
        onSurface: "#1B1B1F",
      }),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
  });

  const tree = TonalNavigationBar({
    active: "home",
    onSelect: () => {},
    items: [
      { id: "home", label: "Trang chủ", icon: "home" },
      { id: "notifications", label: "Thông báo", icon: "notifications", badge: 26 },
    ],
  });
  const nodes = allNodes(tree);
  const tab = nodes.find((n) => n.type === "Pressable");
  assert.notEqual(tab.props.style.overflow, "hidden");
  assert.notEqual(tab.props.style.borderRadius, 999);
  const badge = nodes.find((n) => n.type === "Badge");
  assert.equal(badge.props.children, 26);
});
