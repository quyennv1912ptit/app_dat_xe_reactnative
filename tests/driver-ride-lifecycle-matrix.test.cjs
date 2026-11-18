const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function load(relativePath, mocks = {}) {
  const file = path.join(root, relativePath);
  const exports = {};
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    exports,
    URLSearchParams,
    require: (id) => {
      if (id in mocks) return mocks[id];
      throw new Error(`Unexpected import in ${relativePath}: ${id}`);
    },
  });
  return exports;
}

const {
  ridePresentation,
  inspectionPresentation,
  completePresentation,
  homeRideCardPresentation,
  formatRideVehicleSummary,
  isTerminalRideStatus,
} = load("apps/driver/src/features/ride/ridePresentation.ts");

function makeRide(overrides = {}) {
  return {
    id: 101,
    customerId: 1,
    driverId: 1,
    vehicleId: 1,
    vehicleType: "MOTORCYCLE",
    transmission: "AUTO",
    vehicleSnapshot: { brand: "Honda", model: "Jet jet", color: "Đen" },
    licensePlate: "88K1 22442",
    type: "INSTANT",
    scheduledAt: null,
    pickupAddress: "96A Trần Phú, Hà Đông",
    pickup: { lat: 20.98, lng: 105.787 },
    dropoffAddress: "2 Ngõ 187 Tây Hồ",
    dropoff: { lat: 21.06, lng: 105.82 },
    distanceKm: 12.6,
    estimatedFare: 58000,
    finalFare: null,
    status: "DRIVER_ASSIGNED",
    cancelReason: null,
    cancelledBy: null,
    statusHistory: [],
    handoverReports: [],
    createdAt: "2026-11-17T03:00:00Z",
    updatedAt: "2026-11-17T03:00:00Z",
    acceptedAt: "2026-11-17T03:01:00Z",
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledByRole: null,
    discountAmount: 0,
    unreadChatCount: 0,
    ...overrides,
  };
}

test("arrived at pickup hides pickup directions, hides uncreated handover view, and focuses on pickup inspection", () => {
  const model = ridePresentation(makeRide({ status: "DRIVER_ARRIVED" }), true);
  assert.equal(model.navigation, undefined);
  assert.equal(model.showMap, false);
  assert.equal(model.routeMode, "at_pickup");
  assert.equal(model.action?.kind, "inspection");
  assert.equal(model.action?.stop, "pickup");
  assert.equal(model.action?.label, "Lập biên bản nhận xe");
  assert.ok(model.handovers.every((item) => !item.canView));
  assert.equal(model.canCancel, true);
});

test("unconfirmed handover blocks start/complete with clear waiting reason and allows viewing existing report only", () => {
  const pickupPending = { id: 1, phase: "PICKUP", odometer: 100, confirmedByCustomer: false, photos: [] };
  const handoverModel = ridePresentation(
    makeRide({ status: "VEHICLE_HANDOVER", handoverReports: [pickupPending] }),
    true,
  );
  assert.equal(handoverModel.action, undefined);
  assert.equal(handoverModel.waitingForCustomer, true);
  assert.match(handoverModel.disabledPrimaryReason, /khách chưa xác nhận biên bản nhận xe/i);
  assert.equal(handoverModel.navigation, undefined);
  assert.equal(handoverModel.handovers.find((item) => item.stop === "pickup")?.canView, true);
  assert.equal(handoverModel.handovers.find((item) => item.stop === "dropoff")?.canView, false);

  const pickupDone = { ...pickupPending, confirmedByCustomer: true };
  const dropoffPending = { id: 2, phase: "DROPOFF", odometer: 112, confirmedByCustomer: false, photos: [] };
  const returnModel = ridePresentation(
    makeRide({ status: "VEHICLE_RETURNED", handoverReports: [pickupDone, dropoffPending] }),
    true,
  );
  assert.equal(returnModel.action, undefined);
  assert.equal(returnModel.waitingForCustomer, true);
  assert.match(returnModel.disabledPrimaryReason, /khách chưa xác nhận biên bản trả xe/i);
  assert.equal(returnModel.canCancel, false);
  assert.equal(returnModel.navigation, undefined);
});

test("in progress hides pickup actions and cancellation, and arrived destination hides dropoff directions", () => {
  const pickupDone = { id: 1, phase: "PICKUP", odometer: 100, confirmedByCustomer: true, photos: [] };
  const inProgress = ridePresentation(makeRide({ status: "IN_PROGRESS", handoverReports: [pickupDone] }), true);
  assert.equal(inProgress.navigation, "dropoff");
  assert.equal(inProgress.routeMode, "to_dropoff");
  assert.equal(inProgress.canCancel, false);
  assert.equal(inProgress.action?.kind, "progress");
  assert.equal(inProgress.action?.endpoint, "arrive-destination");
  assert.equal(inProgress.action?.label, "Đã tới điểm trả");
  assert.equal(inProgress.handovers.find((item) => item.stop === "pickup")?.canView, true);
  assert.equal(inProgress.handovers.find((item) => item.stop === "dropoff")?.canView, false);

  const arrivedDropoff = ridePresentation(
    makeRide({ status: "ARRIVED_DESTINATION", handoverReports: [pickupDone] }),
    true,
  );
  assert.equal(arrivedDropoff.navigation, undefined);
  assert.equal(arrivedDropoff.showMap, false);
  assert.equal(arrivedDropoff.routeMode, "at_dropoff");
  assert.equal(arrivedDropoff.canCancel, false);
  assert.equal(arrivedDropoff.action?.kind, "inspection");
  assert.equal(arrivedDropoff.action?.stop, "dropoff");
  assert.equal(arrivedDropoff.action?.label, "Lập biên bản trả xe");
});

test("inspection presentation never shows directions and preserves editable draft during offline sync failure", () => {
  const arrivedRide = makeRide({ status: "DRIVER_ARRIVED" });
  const offlineCreate = inspectionPresentation(arrivedRide, "pickup", false);
  assert.equal(offlineCreate.mode, "create");
  assert.equal(offlineCreate.showNavigation, false);
  assert.equal(offlineCreate.canEditForm, true);
  assert.equal(offlineCreate.canSubmit, false);
  assert.match(offlineCreate.submitDisabledReason, /bản nháp đã được giữ lại/i);

  const earlyDropoff = inspectionPresentation(arrivedRide, "dropoff", true);
  assert.equal(earlyDropoff.mode, "unavailable");
  assert.equal(earlyDropoff.showNavigation, false);
  assert.equal(earlyDropoff.fallbackRoute, "/ride/in-progress");

  const confirmedPickup = { id: 1, phase: "PICKUP", odometer: 100, confirmedByCustomer: true, photos: [] };
  const confirmedView = inspectionPresentation(
    makeRide({ status: "VEHICLE_HANDOVER", handoverReports: [confirmedPickup] }),
    "pickup",
    true,
  );
  assert.equal(confirmedView.mode, "confirmed_view");
  assert.equal(confirmedView.showNavigation, false);
  assert.equal(confirmedView.fallbackRoute, "/ride/in-progress");
  assert.match(confirmedView.fallbackLabel, /bắt đầu chuyến/i);
});

test("complete presentation handles all terminal payment methods/statuses and rejects non-terminal rides", () => {
  const active = completePresentation(makeRide({ status: "IN_PROGRESS" }));
  assert.equal(active.terminal, false);
  assert.equal(active.canConfirmCash, false);

  const cashPending = completePresentation(
    makeRide({ status: "COMPLETED", finalFare: 58000, payment: { amount: 58000, method: "CASH", status: "PENDING", paidAt: null } }),
  );
  assert.equal(cashPending.terminal, true);
  assert.equal(cashPending.canConfirmCash, true);
  assert.equal(cashPending.cashToCollect, 58000);

  for (const [method, status, expectedTitle] of [
    ["CASH", "PAID", /Tiền mặt đã thu đủ/],
    ["WALLET", "PAID", /Đã thanh toán qua ví/],
    ["WALLET", "PENDING", /Đang xử lý thanh toán ví/],
    ["WALLET", "FAILED", /Thanh toán ví không thành công/],
    ["WALLET", "REFUNDED", /hoàn tiền/],
  ]) {
    const res = completePresentation(
      makeRide({ status: "COMPLETED", finalFare: 58000, payment: { amount: 58000, method, status, paidAt: null } }),
    );
    assert.equal(res.canConfirmCash, false);
    assert.match(res.paymentBanner.title, expectedTitle);
  }

  const zeroCashPaid = completePresentation(
    makeRide({
      status: "COMPLETED",
      finalFare: 0,
      payment: { amount: 0, method: "CASH", status: "PAID", paidAt: "2026-11-18T00:00:00Z" },
    }),
  );
  assert.equal(zeroCashPaid.canConfirmCash, false);
  assert.equal(zeroCashPaid.cashToCollect, undefined);
  assert.match(zeroCashPaid.paymentBanner.title, /Khách được miễn phí \(Voucher 0 đ\)/);

  const zeroCashPending = completePresentation(
    makeRide({
      status: "COMPLETED",
      finalFare: 0,
      payment: { amount: 0, method: "CASH", status: "PENDING", paidAt: null },
    }),
  );
  assert.equal(zeroCashPending.canConfirmCash, false);
  assert.equal(zeroCashPending.cashToCollect, undefined);
  assert.match(zeroCashPending.paymentBanner.title, /Chờ hoàn tất thanh toán 0 đ/);

  for (const status of ["COMPLETED", "CANCELLED", "NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"]) {
    assert.equal(isTerminalRideStatus(status), true);
    assert.equal(ridePresentation(makeRide({ status }), true), null);
  }
});

test("vehicle summary and home ride card format truthfully without fabrication", () => {
  const ride = makeRide({ status: "VEHICLE_HANDOVER", handoverReports: [{ id: 1, phase: "PICKUP", odometer: 100, confirmedByCustomer: false, photos: [] }] });
  assert.equal(formatRideVehicleSummary(ride), "Xe máy · Honda Jet jet · Đen · Số tự động · 88K1 22442");
  const homeCard = homeRideCardPresentation(ride, true);
  assert.equal(homeCard.targetLabel, "Đang bàn giao tại điểm đón");
  assert.match(homeCard.hint, /Chờ khách xác nhận/);
});

test("UI screens wire VehicleInspection without directions and guard double-tap on Accept", () => {
  const inspectionScreen = fs.readFileSync(
    path.join(root, "apps/driver/src/features/ride/screens/VehicleInspectionScreen.tsx"),
    "utf8",
  );
  assert.match(inspectionScreen, /showDirections=\{false\}/);

  const stopCard = fs.readFileSync(
    path.join(root, "apps/driver/src/features/ride/components/RideStopCard.tsx"),
    "utf8",
  );
  assert.match(stopCard, /showDirections/);

  const useAcceptSrc = fs.readFileSync(
    path.join(root, "apps/driver/src/features/offers/hooks/useAccept.ts"),
    "utf8",
  );
  assert.match(useAcceptSrc, /actionLock/);

  const useInspectionSrc = fs.readFileSync(
    path.join(root, "apps/driver/src/features/ride/hooks/useVehicleInspection.ts"),
    "utf8",
  );
  assert.match(useInspectionSrc, /pickupOdometer/);
  assert.match(inspectionScreen, /odometerBelowPickup/);

  const guidedCaptureSrc = fs.readFileSync(
    path.join(root, "apps/driver/src/features/verification/GuidedCaptureScreen.tsx"),
    "utf8",
  );
  assert.match(guidedCaptureSrc, /iconButton:\s*\{\s*width:\s*48,\s*height:\s*48/);
  assert.match(guidedCaptureSrc, /errorBanner:\s*\{[^}]*colors\.onErrorContainer/);

  const offerDecisionSrc = fs.readFileSync(
    path.join(root, "apps/driver/src/features/offers/components/OfferDecision.tsx"),
    "utf8",
  );
  assert.match(offerDecisionSrc, /Khách không cần trả tiền \(0 đ\)/);
  assert.doesNotMatch(offerDecisionSrc, /Thu tiền mặt \(0 đ\)/);

  const inProgressSrc = fs.readFileSync(
    path.join(root, "apps/driver/src/features/ride/screens/InProgressScreen.tsx"),
    "utf8",
  );
  assert.match(inProgressSrc, /customerFare === 0[\s\S]{0,120}Khách không cần trả tiền \(0 đ\)/);
  assert.match(inProgressSrc, /onSettled:[^}]*cancelLock\.current = false/);

  assert.match(
    useInspectionSrc,
    /typeof rawPickupOdometer === 'number' && Number\.isSafeInteger\(rawPickupOdometer\) && rawPickupOdometer >= 0/,
  );
  assert.match(useInspectionSrc, /onSettled:[^}]*submitLock\.current = false/);

  const directionsMapSrc = fs.readFileSync(
    path.join(root, "apps/driver/src/components/DriverDirectionsMap.native.tsx"),
    "utf8",
  );
  assert.match(directionsMapSrc, /const \[isAppActive, setIsAppActive\] = useState/);
  assert.match(directionsMapSrc, /if \(!nextActive\) void Speech\.stop\(\)/);
  assert.match(directionsMapSrc, /routeSignature/);
  assert.match(directionsMapSrc, /\}, \[routeSignature\]\)/);
});
