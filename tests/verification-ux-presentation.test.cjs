const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (name in mocks) return mocks[name];
    throw Error(name);
  } });
  return exports;
}
const grouping = load("apps/driver/src/features/verification/warningPresentation.ts");
test("retaking another document or selfie preserves completed QR and document fields", () => {
  const { captureInvalidationScope } = load("apps/driver/src/features/verification/reliabilityHelpers.ts");
  assert.equal(captureInvalidationScope('selfie').affectsCccd, false);
  assert.equal(captureInvalidationScope('selfie').affectsGplx, false);
  for (const slot of ['gplx_front', 'gplx_back']) {
    assert.equal(captureInvalidationScope(slot).affectsCccd, false);
    assert.equal(captureInvalidationScope(slot).affectsGplx, true);
  }
  for (const slot of ['cccd_front', 'cccd_back']) {
    assert.equal(captureInvalidationScope(slot).affectsCccd, true);
    assert.equal(captureInvalidationScope(slot).affectsGplx, false);
  }
  assert.equal(captureInvalidationScope().affectsCccd, true);
  assert.equal(captureInvalidationScope().affectsGplx, true);
});
test("QR binding and unavailable recognition do not label a photo as poor quality or soften real blockers", () => {
  assert.equal(grouping.isPhotoQualityWarning({code:'QR_LIVE_SCAN_UNBOUND'}), false);
  assert.equal(grouping.isPhotoQualityWarning({code:'CARD_NOT_FOUND'}), false);
  assert.equal(grouping.isPhotoQualityWarning({code:'IMAGE_BLURRY'}), true);
  const warning = {code:'FACE_NOT_EVALUATED', severity:'INFO', blocksSubmission:false, blocksActivation:false,
    humanReadableMessage:'Yêu cầu xử lý', recommendedAction:'Xử lý ngay'};
  assert.match(grouping.driverWarningMessage(warning), /có thể tiếp tục gửi/);
  assert.equal(grouping.driverWarningMessage({...warning,blocksSubmission:true}), 'Yêu cầu xử lý Xử lý ngay');
});
test("review warning groups retain every affected photo and preserve distinct blocking conditions", () => {
  const warning = {
    code: "QR_LIVE_SCAN_UNBOUND", severity: "WARNING", humanReadableMessage: "Đối chiếu với ảnh",
    recommendedAction: "Kiểm tra giấy tờ", fieldKey: null, blocksSubmission: false, blocksActivation: false,
  };
  const groups = grouping.groupVerificationWarnings([
    { ...warning, slot: "cccd_front" }, { ...warning, slot: "gplx_back" },
    { ...warning, slot: "cccd_front" }, { ...warning, slot: "selfie", blocksSubmission: true },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].slots.join(","), "cccd_front,gplx_back");
  assert.equal(groups[1].warning.blocksSubmission, true);
});
test("one final confirmation acknowledges the current server revision and keeps informational notes collapsed", () => {
  const jsx = (type, props) => ({ type, props });
  const ui = Object.fromEntries(["Button", "Card", "GroupedList", "KeyValueRow", "MotionPressable", "Typography"].map(name => [name, name]));
  const { VerificationSummaryStep } = load("apps/driver/src/features/verification/components/VerificationSummaryStep.tsx", {
    react: { useState: () => [false, () => {}] },
    "react-native": { StyleSheet: { create: x => x }, Switch: "Switch", View: "View" },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@datxe/ui": { ...ui, spacing: {}, typography: {}, useThemeColors: () => ({}), useThemedStyles: () => ({}) },
    "../warningPresentation": grouping,
    "../verificationLabels": { formatGenderValue: value => value, formatVnDate: value => value ?? "", isSmall: () => false, slotAllowed: () => true },
    "../workflow": { fields: [], slots: [] },
    "./VerificationShared": { AlertBanner: "AlertBanner", SlotPhotoFrame: "SlotPhotoFrame", WarningBannerList: "WarningBannerList" },
  });
  const events = [];
  const info = { severity: "INFO", code: "FACE_NOT_EVALUATED", humanReadableMessage: "Chưa chạy" };
  const blocker = { severity: "BLOCKING", code: "DOCUMENT_REQUIRED", blocksSubmission: true };
  const tree = VerificationSummaryStep({
    app: null, photos: {}, values: {}, warnings: [info, blocker], pendingPhotoCount: 1,
    confirm: true, currentWarningReview: { revision: 7, acknowledged: false },
    onToggleConfirm: value => events.push(value),
    onToggleWarningReview: (...args) => events.push(args),
  });
  function nodes(value) {
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value)) return value.flatMap(nodes);
    return [value, ...nodes(value.props.children)];
  }
  const all = nodes(tree);
  const confirmation = all.find(node => node.props.accessibilityLabel === "Tôi đã kiểm tra ảnh, thông tin và các lưu ý của hồ sơ này, đồng ý gửi xét duyệt");
  assert.equal(confirmation.props.value, false);
  confirmation.props.onValueChange(true);
  assert.deepEqual(events, [true, [7, true]]);
  const warnings = all.filter(node => node.type === "WarningBannerList");
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].props.items[0], blocker);
  assert.ok(all.some(node => node.props.label === "Xem 1 lưu ý khi xét duyệt"));
  assert.ok(all.some(node => node.type === "AlertBanner" && node.props.tone === "info"));
});

test("completed QR scans show success without asking to scan again and keep reading diagnostics optional", () => {
  const jsx = (type, props) => ({ type, props });
  const { VerificationExtractionStep } = load("apps/driver/src/features/verification/components/VerificationExtractionStep.tsx", {
    react: { useState: () => [false, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { ActivityIndicator:'ActivityIndicator', StyleSheet:{create:x=>x}, View:'View' },
    "@datxe/ui": { Button:'Button',Card:'Card',Typography:'Text',spacing:{},typography:{},useThemeColors:()=>({}),useThemedStyles:()=>({}) },
    "../verificationLabels": {visibleObservationWarnings:()=>['Lượt đọc chưa xác nhận độ rõ']},
    "../workflow": {slots:[['cccd_front','CCCD trước']]},
    "./VerificationShared": {AlertBanner:'AlertBanner'},
  });
  const scanned = {mode:'LIVE_SCANNED',shouldOffer:true};
  const tree = VerificationExtractionStep({reading:false,readingNote:'',readyCaptureCount:5,
    observations:{cccd_front:{warnings:['CARD_QUALITY_REJECTED']}},qrDecision:scanned,gplxQrDecision:scanned});
  const nodes = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(visit);
    nodes.push(value);
    visit(value.props.children);
  }
  visit(tree);
  assert.equal(nodes.filter(node=>node.type==='AlertBanner' && node.props.tone==='success').length,2);
  assert.ok(nodes.some(node=>node.type==='AlertBanner' && node.props.tone==='success'));
  assert.ok(!nodes.some(node=>node.type==='Button' && node.props.label.startsWith('Quét mã QR')));
  assert.ok(!nodes.some(node=>node.type==='AlertBanner' && node.props.message.includes('độ rõ')));
  assert.ok(nodes.some(node=>node.props.label==='Xem chi tiết đọc tự động'));
});

test("verification date helpers format DD/MM/YYYY and parse valid VN dates", () => {
  const workflowMod = load("apps/driver/src/features/verification/workflow.ts");
  const { formatVnDate, parseVnDateToIso } = load("apps/driver/src/features/verification/verificationLabels.ts", {
    "./workflow": workflowMod,
  });
  assert.equal(formatVnDate("2031-12-19"), "19/12/2031");
  assert.equal(formatVnDate(""), "");
  assert.equal(parseVnDateToIso("19/12/2031"), "2031-12-19");
  assert.equal(parseVnDateToIso("31/02/2031"), null);
});

test("VerifiedBaselineView removes duplicated Số định danh value prefix and formats VN dates", () => {
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const workflowMod = load("apps/driver/src/features/verification/workflow.ts");
  const labelsMod = load("apps/driver/src/features/verification/verificationLabels.ts", {
    "./workflow": workflowMod,
  });
  const ui = Object.fromEntries(
    ["Button", "Card", "GroupedList", "KeyValueRow", "SettingsListItem", "SharedStatusBadge", "Typography"].map(
      name => [name, name],
    ),
  );
  const { VerifiedBaselineView } = load("apps/driver/src/features/verification/components/VerificationStatusView.tsx", {
    react: { useState: init => [init, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { StyleSheet: { create: x => x }, View: "View" },
    "react-native-paper": { Divider: "Divider" },
    "@expo/vector-icons": { MaterialIcons: "MaterialIcons" },
    "@/components/StatusBadge": { StatusBadge: "StatusBadge" },
    "@datxe/ui": { ...ui, spacing: {}, typography: {}, useThemeColors: () => ({}), useThemedStyles: () => ({}) },
    "../verificationLabels": labelsMod,
    "../workflow": workflowMod,
    "./VerificationShared": { AlertBanner: "AlertBanner", SlotPhotoFrame: "SlotPhotoFrame", WarningBannerList: "WarningBannerList" },
  });

  const tree = VerifiedBaselineView({
    app: {
      id: "app-1",
      status: "APPROVED",
      revision: 3,
      approvedRevision: 3,
      lockedIdentity: { maskedCccdId: "********2851", fullName: "NGUYỄN VĂN QUYỀN" },
      approvedDocument: {
        confirmed: { cccd_expiry_date: "2031-12-19", gplx_classes: ["A1"], no_expiry: true },
      },
      history: [],
    },
    busy: "",
    showHistory: false,
    onToggleHistory: () => {},
    onOpenCapabilities: () => {},
    onStartReverify: () => {},
  });

  const nodes = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    nodes.push(node);
    walk(node.props?.children);
  }
  walk(tree);

  const idRow = nodes.find(node => node.type === "KeyValueRow" && node.props.label === "Số định danh");
  assert.ok(idRow, "Expected Số định danh KeyValueRow");
  assert.equal(idRow.props.value, "********2851");
  assert.ok(nodes.some(node => node.props?.accessibilityLabel === "Số định danh: ********2851"));

  const expiryRow = nodes.find(node => node.type === "KeyValueRow" && node.props.label === "Có giá trị đến");
  assert.equal(expiryRow?.props.value, "19/12/2031");
});

test("CapabilitiesScreen deduplicates global blocker banners and avoids duplicate Divider inside GroupedList", () => {
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const workflowMod = load("apps/driver/src/features/verification/workflow.ts");
  const labelsMod = load("apps/driver/src/features/verification/verificationLabels.ts", {
    "./workflow": workflowMod,
  });
  const ui = Object.fromEntries(
    ["Button", "Card", "GroupedList", "MotionPressable", "SharedStatusBadge", "Typography"].map(name => [name, name]),
  );
  const groups = [
    { groupId: "moto-1", label: "Mô tô xăng 50–125 cm³", enabled: false, effective: false, reasonCode: "VERIFICATION_NOT_SYNCHRONIZED" },
    { groupId: "moto-2", label: "Mô tô xăng 126–174 cm³", enabled: false, effective: false, reasonCode: "VERIFICATION_NOT_SYNCHRONIZED" },
  ];
  const { default: CapabilitiesScreen } = load("apps/driver/src/features/verification/CapabilitiesScreen.tsx", {
    "@tanstack/react-query": {
      useQuery: () => ({ data: { enabled: true, approvalRevision: null, preferenceVersion: 0, acceptingVehicleTypes: [], groups }, isLoading: false, isFetching: false, refetch: () => {} }),
      useMutation: () => ({ isPending: false, mutate: () => {} }),
      useQueryClient: () => ({ setQueryData: () => {}, invalidateQueries: () => {} }),
    },
    "expo-router": { useRouter: () => ({ push: () => {}, replace: () => {} }) },
    "react-native": { StyleSheet: { create: x => x }, Switch: "Switch", View: "View" },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react-native-paper": { Appbar: { Action: "Action" } },
    "@/components/DriverPage": { DriverPage: "DriverPage" },
    "@/lib/driverCapabilities": { capabilitiesKey: ["caps"], getCapabilities: () => {}, updateCapability: () => {} },
    "@datxe/ui": { ...ui, borderRadius: {}, spacing: {}, typography: {}, useThemeColors: () => ({}), useThemedStyles: () => ({}) },
    "./verificationLabels": labelsMod,
    "./components/VerificationShared": { AlertBanner: "AlertBanner" },
  });

  const tree = CapabilitiesScreen();
  const text = JSON.stringify(tree);
  const matches = text.match(/Đang chờ đồng bộ hồ sơ\. Hãy làm mới sau\./g) ?? [];
  assert.equal(matches.length, 1, "Global blocker sentence should appear only once in top banner");
  assert.doesNotMatch(text, /"Divider"/);
});

test("eKYC date fields use the shared CustomDatePickerModal and keep ISO values for the API", () => {
  const labels = load("apps/driver/src/features/verification/verificationLabels.ts", {
    "./workflow": load("apps/driver/src/features/verification/workflow.ts"),
  });
  assert.equal(labels.localDateToIso(new Date(1995, 2, 15, 12)), "1995-03-15");
  const parsed = labels.isoToLocalDate("1995-03-15");
  assert.equal(parsed.getFullYear(), 1995);
  assert.equal(parsed.getMonth(), 2);
  assert.equal(parsed.getDate(), 15);
  assert.equal(labels.isoToLocalDate(""), null);
  assert.equal(labels.formatVnDate("1995-03-15"), "15/03/1995");

  const fieldsStep = fs.readFileSync("apps/driver/src/features/verification/components/VerificationFieldsStep.tsx", "utf8");
  assert.match(fieldsStep, /CustomDatePickerModal/);
  assert.doesNotMatch(fieldsStep, /YYYY-MM-DD/);
  assert.match(fieldsStep, /localDateToIso\(date\)/);
});

test("pending submit keeps the failure reason visible and offers a single retry action", () => {
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const { VerificationFooter } = load("apps/driver/src/features/verification/components/VerificationFooter.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { StyleSheet: { create: x => x }, View: "View" },
    "@datxe/ui": { Button: "Button", Typography: "Text", spacing: {}, typography: {}, useThemedStyles: () => ({}) },
    "../workflow": load("apps/driver/src/features/verification/workflow.ts"),
    "./VerificationShared": { AlertBanner: "AlertBanner" },
  });
  const errorText = "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.";
  const tree = VerificationFooter({
    pending: true, canEdit: true, stage: "SUMMARY", step: 0, slotKey: undefined, busy: "", locked: false,
    reading: false, consent: true, needsCapture: false, currentSlotAllowed: true, currentHasPhoto: true,
    smallBlocked: false, hasObservations: true, extractFailed: false, confirm: true, fieldIssueCount: 0,
    errorMessage: errorText, warnings: [], appStatus: "DRAFT",
    onRetryPendingSubmit: () => {}, onStartCapture: () => {}, onJumpConfirmFields: () => {}, onOpenCamera: () => {},
    onContinueBack: () => {}, onNextCaptureStep: () => {}, onCompleteCapture: () => {}, onBackFromCapture: () => {},
    onAbortExtractionToManual: () => {}, onBackToCaptureFromOcr: () => {}, onGoSummary: () => {},
    onBackFromFields: () => {}, onSubmit: () => {},
  });
  const nodes = [];
  (function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    nodes.push(node);
    walk(node.props && node.props.children);
  })(tree);
  assert.ok(nodes.some(node => node.type === "AlertBanner" && node.props.message === errorText));
  const retryButtons = nodes.filter(node => node.type === "Button" && (node.props.label === "Thử lại" || node.props.label === "Thử nộp lại"));
  assert.equal(retryButtons.length, 1);
});

test("capture step hides premature DOCUMENT_REQUIRED red banner before a photo is taken while preserving real photo warnings", () => {
  const missingFront = {
    code: "DOCUMENT_REQUIRED", severity: "BLOCKING", slot: "cccd_front", fieldKey: null,
    humanReadableMessage: "Thiếu ảnh giấy tờ bắt buộc.", recommendedAction: "Chụp lại ảnh theo khung hướng dẫn.",
    blocksSubmission: true, blocksActivation: true,
  };
  const blurryFront = {
    code: "IMAGE_BLURRY", severity: "WARNING", slot: "cccd_front", fieldKey: null,
    humanReadableMessage: "Ảnh bị mờ.", recommendedAction: "Chụp lại ảnh rõ nét.",
    blocksSubmission: false, blocksActivation: false,
  };
  const fieldMismatch = {
    code: "QR_OCR_FIELD_MISMATCH", severity: "CRITICAL", slot: "cccd_front", fieldKey: "cccd_id",
    humanReadableMessage: "Số CCCD chưa khớp.", recommendedAction: "Kiểm tra lại.",
    blocksSubmission: false, blocksActivation: false,
  };
  const otherSlot = {
    code: "IMAGE_GLARE", severity: "WARNING", slot: "gplx_front", fieldKey: null,
    humanReadableMessage: "Ảnh bị lóa.", recommendedAction: "Chụp lại.",
    blocksSubmission: false, blocksActivation: false,
  };
  const all = [missingFront, blurryFront, fieldMismatch, otherSlot];

  // Brand-new DRAFT with no photo captured yet: must NOT show red DOCUMENT_REQUIRED banner.
  assert.deepEqual(
    Array.from(grouping.captureSlotWarnings(all, "cccd_front", {
      hasLocalPhoto: false, hasSavedCapture: false, localPhotoUploaded: false,
    })),
    [],
  );

  // Driver just took a new local photo not yet uploaded: hide stale server warnings until uploaded.
  assert.deepEqual(
    Array.from(grouping.captureSlotWarnings(all, "cccd_front", {
      hasLocalPhoto: true, hasSavedCapture: true, localPhotoUploaded: false,
    })),
    [],
  );

  // Uploaded photo with real quality warning: show IMAGE_BLURRY, still exclude DOCUMENT_REQUIRED, field-level, and other slots.
  assert.deepEqual(
    Array.from(grouping.captureSlotWarnings(all, "cccd_front", {
      hasLocalPhoto: true, hasSavedCapture: true, localPhotoUploaded: true,
    })),
    [blurryFront],
  );

  // Saved server capture (e.g. NEEDS_MORE_INFO before retaking): show real photo warning for that slot.
  assert.deepEqual(
    Array.from(grouping.captureSlotWarnings(all, "cccd_front", {
      hasLocalPhoto: false, hasSavedCapture: true, localPhotoUploaded: false,
    })),
    [blurryFront],
  );
});
