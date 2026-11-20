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
  const ui = Object.fromEntries(["Button", "Card", "GroupedList", "KeyValueRow", "Typography"].map(name => [name, name]));
  const { VerificationSummaryStep } = load("apps/driver/src/features/verification/components/VerificationSummaryStep.tsx", {
    react: { useState: () => [false, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { StyleSheet: { create: x => x }, Switch: "Switch", View: "View" },
    "@datxe/ui": { ...ui, spacing: {}, typography: {}, useThemeColors: () => ({}), useThemedStyles: () => ({}) },
    "../warningPresentation": grouping,
    "../verificationLabels": { formatGenderValue: value => value, isSmall: () => false, slotAllowed: () => true },
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
  const confirmation = all.find(node => node.props.accessibilityLabel === "Xác nhận ảnh và thông tin");
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
  assert.ok(!nodes.some(node=>node.type==='Button' && node.props.label.startsWith('Quét mã QR')));
  assert.ok(!nodes.some(node=>node.type==='AlertBanner' && node.props.message.includes('độ rõ')));
  assert.ok(nodes.some(node=>node.props.label==='Xem chi tiết đọc tự động'));
});
