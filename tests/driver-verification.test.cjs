const test = require('node:test');
const assert = require('node:assert/strict');

function readVerificationFeatureBundle() {
  const { readdirSync, readFileSync, statSync } = require('node:fs');
  const { join } = require('node:path');
  const root = join(__dirname, '../apps/driver/src/features/verification');
  const collect = dir => readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? collect(full) : [full];
  });
  return collect(root)
    .filter(f => /\.(ts|tsx)$/.test(f))
    .map(f => readFileSync(f, 'utf8'))
    .join('\n');
}

test('driver verification keeps manual names, leading zeros and multiple classes', async () => {
  const { compareNames, confirmedDetails } = await import('../apps/driver/src/features/verification/workflow.ts');
  const base = { cccd_name: 'Đỗ Ánh', cccd_id: '000000000001', cccd_dob: '1990-01-01',
    gplx_name: 'Do Anh', gplx_dob: '1990-01-01', gplx_number: 'DEMO', gplx_classes: 'a1, B2, A1' };
  const details = confirmedDetails(base, true);
  assert.equal(details.cccd_id, base.cccd_id);
  assert.equal(details.gplx_name, base.gplx_name);
  assert.deepEqual(details.gplx_classes, ['A1', 'B2']);
  assert.equal(details.expiry_date, null);
  assert.equal(compareNames(base.cccd_name, base.gplx_name), 'DIACRITIC_MISMATCH');
  assert.throws(() => confirmedDetails({ ...base, expiry_date: '2030-02-30' }, false));
});

test('autofill keeps source, rejects conflicts and respects manual clearing', async () => {
  const { autofillChoices, collectChoices, sameExtractionGeneration } =
    await import('../apps/driver/src/features/verification/workflow.ts');
  const candidate = (fieldKey, candidateValue, overrides = {}) => ({
    fieldKey, candidateValue, source: 'OCR', sourceDocument: 'CCCD', sourceSide: 'FRONT',
    parseStatus: 'parsed', validationStatus: 'valid', conflict: false, ...overrides,
  });
  const observation = candidates => ({ qrStatus: 'OK', ocrStatus: 'OK', warnings: [], candidates });
  const options = collectChoices({
    cccd_front: observation([
      candidate('id_number', '000000000012'),
      candidate('id_number', '000000000012', { source: 'QR' }),
      candidate('full_name', 'Đỗ Ánh'),
      candidate('full_name', 'Do Anh', { source: 'QR' }),
      candidate('dob', '1990-01-02'),
      candidate('dob', '1990-01-03', { validationStatus: 'invalid' }),
      candidate('id_number', '000000000011', { sourceSide: 'BACK' }),
    ]),
    gplx_front: observation([
      candidate('expiry', { no_expiry: true, expiry_date: null }, { sourceDocument: 'GPLX' }),
    ]),
  });
  const fields = autofillChoices({}, false, new Set(['cccd_dob']), options);
  assert.deepEqual(fields.cccd_id.sources.sort(), ['OCR', 'QR']);
  assert.equal(fields.cccd_name, undefined);
  assert.equal(fields.cccd_dob, undefined);
  assert.equal(fields.expiry_date.noExpiry, true);
  assert.equal(autofillChoices({ cccd_id: '123456789012' }, true, new Set(), options).cccd_id, undefined);
  const knownConflict = collectChoices({ cccd_front: observation([
    candidate('id_number', '000000000012', { conflict: true }),
  ]) });
  assert.equal(autofillChoices({}, false, new Set(), knownConflict).cccd_id, undefined);
  const started = { id: 'fixture', revision: 2, generation: 1 };
  assert.equal(sameExtractionGeneration(started, { ...started }), true);
  assert.equal(sameExtractionGeneration(started, { ...started, revision: 3 }), false);
  assert.equal(sameExtractionGeneration(started, { ...started, generation: 2 }), false);
});

test('transport uses raw bytes, refreshes Firebase once and preserves submit replay key', async () => {
  const { authenticatedTransport, verificationOrigin } =
    await import('../apps/driver/src/features/verification/transport.ts');
  assert.equal(verificationOrigin('https://verification.example', false), 'https://verification.example');
  assert.equal(verificationOrigin('http://verification.example', true), undefined);
  assert.equal(verificationOrigin('http://127.0.0.1:8092', true), 'http://127.0.0.1:8092');
  assert.equal(verificationOrigin('http://192.168.1.106:8080', true), 'http://192.168.1.106:8080');
  assert.equal(verificationOrigin('http://192.168.1.106:8080', false), undefined);
  const calls = [];
  const tokens = [];
  const transport = authenticatedTransport('https://verification.example', async refresh => {
    tokens.push(refresh);
    return refresh ? 'fresh-fixture' : 'old-fixture';
  }, async (url, options) => {
    calls.push({ url, ...options, headers: new Headers(options.headers) });
    return calls.length === 1 ? new Response('', { status: 401 })
      : Response.json({ success: true, data: { status: 'SUBMITTED' } });
  });
  const bytes = new Blob([Uint8Array.of(1, 2, 3)]);
  await transport.json('applications/fixture/captures/cccd_front?revision=1', {
    method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: bytes,
  });
  assert.deepEqual(tokens, [false, true]);
  assert.equal(calls[1].headers.get('Authorization'), 'Bearer fresh-fixture');
  assert.equal(calls[1].headers.get('content-type'), 'image/png');
  assert.equal(calls[1].body, bytes);
  assert.equal(calls[1].redirect, 'error');
  const submit = { method: 'POST', headers: { 'Idempotency-Key': 'fixture-key' }, body: '{"revision":2}' };
  await transport.json('applications/fixture/submit', submit);
  await transport.json('applications/fixture/submit', submit);
  assert.equal(calls[2].headers.get('idempotency-key'), calls[3].headers.get('idempotency-key'));
});

test('HTTP 200 business errors and timed out or cancelled requests do not count as success', async () => {
  const { authenticatedTransport } = await import('../apps/driver/src/features/verification/transport.ts');
  const failure = authenticatedTransport('https://example.invalid', async () => 'fixture',
    async () => Response.json({ success: false, errorCode: 'FIELD_MISSING' }));
  await assert.rejects(failure.json('applications/fixture/submit'), { code: 'FIELD_MISSING' });
  const pending = authenticatedTransport('https://example.invalid', async () => 'fixture',
    async () => new Promise(() => {}));
  await assert.rejects(pending.json('applications', { timeoutMs: 5 }), { code: 'TIMEOUT' });
  const controller = new AbortController();
  const request = pending.json('applications', { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { code: 'CANCELLED' });
});


test('driver review acknowledges only the displayed server revision', async () => {
  const { warningReviewForRevision } = await import('../apps/driver/src/features/verification/workflow.ts');
  const waiting = { revision: 7, acknowledged: false };
  assert.equal(warningReviewForRevision(7, waiting).acknowledged, false);
  assert.equal(warningReviewForRevision(7, { ...waiting, acknowledged: true }).acknowledged, true);
  assert.equal(warningReviewForRevision(8, { ...waiting, acknowledged: true }), undefined);
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const screen = readFileSync(join(__dirname, '../apps/driver/src/features/verification/VerificationScreen.tsx'), 'utf8');
  const summary = readFileSync(join(__dirname, '../apps/driver/src/features/verification/components/VerificationSummaryStep.tsx'), 'utf8');
  const footer = readFileSync(join(__dirname, '../apps/driver/src/features/verification/components/VerificationFooter.tsx'), 'utf8');
  assert.match(summary, /accessibilityLabel="Xác nhận đã xem cảnh báo"/);
  assert.match(footer, /const missingWarningAck = Boolean\(currentWarningReview && !currentWarningReview\.acknowledged\)/);
  assert.match(footer, /disabled=\{locked \|\| reading \|\| !confirm \|\| missingWarningAck\}/);
  assert.match(screen, /warningAcknowledgementRevision: request\.warningAcknowledgementRevision/);
});


test('capability controls send both revisions and disable unapproved enable actions', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');
  const control = read('features/verification/CapabilitiesScreen.tsx');
  assert.match(control, /approvalRevision, current.preferenceVersion, enabled/);
  assert.match(control, /!group.enabled && Boolean\(group.reasonCode\)/);
  const home = read('features/offers/screens/HomeScreen.tsx');
  assert.match(home, /capabilityMode && !vehicleTypes.length/);
  assert.match(home, /acceptingVehicleTypes/);
});


test('optional face quality checks are explicit, revision scoped and leave manual submission available', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const screen = readFileSync(join(__dirname, '../apps/driver/src/features/verification/VerificationScreen.tsx'), 'utf8');
  const summary = readFileSync(join(__dirname, '../apps/driver/src/features/verification/components/VerificationSummaryStep.tsx'), 'utf8');
  assert.match(screen, /if \(!faceConsent \|\| !faceNotice\) return/);
  assert.match(screen, /'\/face-quality'/);
  assert.match(screen, /current\.current\.revision !== result\.revision/);
  assert.match(summary, /gửi để admin xem thủ công/);
  assert.match(screen, /setFaceConsent\(value\); setDraftFace\(undefined\)/);
});


test('driver verification routes and 7-step workflow are unified around /profile/verification', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');

  const bundle = readVerificationFeatureBundle();
  for (const stage of ['PREPARE', 'CAPTURE', 'OCR', 'CONFIRM_FIELDS', 'SUMMARY']) {
    assert.ok(bundle.includes(`'${stage}'`), `Expected stage ${stage}`);
  }
  assert.match(bundle, /Thông tin Căn cước công dân \(CCCD\)/);
  assert.match(bundle, /Thông tin Giấy phép lái xe \(GPLX\)/);
  assert.match(bundle, /Chọn loại xe nhận lái hộ/);

  const licenseScreen = read('features/auth/screens/LicenseUploadScreen.tsx');
  const verifyIdScreen = read('features/auth/screens/VerifyIdScreen.tsx');
  assert.match(licenseScreen, /Redirect href="\/profile\/verification"/);
  assert.match(verifyIdScreen, /Redirect href="\/profile\/verification"/);

  const registerHook = read('features/auth/hooks/useRegister.ts');
  assert.match(registerHook, /router\.replace\('\/profile\/verification'\)/);
  assert.doesNotMatch(registerHook, /\/\(auth\)\/license-upload/);

  const profileScreen = read('features/profile/screens/ProfileScreen.tsx');
  assert.match(profileScreen, /\/profile\/verification/);
  assert.match(profileScreen, /\/profile\/capabilities/);
  assert.doesNotMatch(profileScreen, /\/\(auth\)\/license-upload/);
  assert.doesNotMatch(profileScreen, /\/\(auth\)\/verify-id/);

  const homeScreen = read('features/offers/screens/HomeScreen.tsx');
  assert.doesNotMatch(homeScreen, /\/\(auth\)\/license-upload/);
});

test('phase 11.1.1 verified status view, identity lock and re-verification UI are wired cleanly', async () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');
  const { VerificationError } = await import('../apps/driver/src/features/verification/transport.ts');

  const lockedErr = new VerificationError('IDENTITY_LOCKED');
  assert.match(lockedErr.message, /Thông tin định danh đã xác minh không thể tự ý thay đổi/);

  const bundle = readVerificationFeatureBundle();
  assert.match(bundle, /Số định danh: \$\{verifiedMaskedCccd\}/);
  assert.match(bundle, /Thông tin định danh đã xác minh không thể tự ý thay đổi\./);
  assert.match(bundle, /Đã được admin kiểm tra/);
  assert.match(bundle, /Cập nhật giấy tờ/);
  assert.match(bundle, /Xem lịch sử xác minh/);
  assert.match(bundle, /\/reverify/);
  assert.match(bundle, /\/cancel-reverify/);
  assert.match(bundle, /isIdentityLockedField/);
});

test('phase 11.1.2 guided capture quality checks report only measured signals and block invalid files', async () => {
  const { assessCapture, mimeFromUri, summarizeChecks } =
    await import('../apps/driver/src/features/verification/captureQuality.ts');

  assert.equal(mimeFromUri('file:///cache/photo.jpg?v=1'), 'image/jpeg');
  assert.equal(mimeFromUri('file:///cache/photo.png'), 'image/png');
  assert.equal(mimeFromUri('file:///cache/photo.bmp'), '');

  const smallWarn = assessCapture({ width: 320, height: 640, bytes: 120_000, mimeType: 'image/jpeg' }, 'document');
  assert.equal(smallWarn.find(c => c.id === 'resolution')?.state, 'warn');
  assert.equal(smallWarn.find(c => c.id === 'sharpness')?.state, 'unchecked');
  assert.equal(smallWarn.find(c => c.id === 'content')?.state, 'unchecked');
  assert.equal(summarizeChecks(smallWarn).blocking, false);
  assert.equal(summarizeChecks(smallWarn).hasWarning, true);

  const darkOrShaky = assessCapture({
    width: 1600, height: 1200, bytes: 950_000, mimeType: 'image/jpeg',
    exif: { ExposureTime: 0.1, ISO: 3200 },
  }, 'selfie');
  assert.equal(darkOrShaky.find(c => c.id === 'light')?.state, 'warn');
  assert.equal(darkOrShaky.find(c => c.id === 'resolution')?.state, 'pass');
  assert.equal(darkOrShaky.find(c => c.id === 'content')?.state, 'unchecked');

  const tooLarge = assessCapture({ width: 1600, height: 1200, bytes: 9_000_000, mimeType: 'image/png' }, 'document');
  assert.equal(tooLarge.find(c => c.id === 'size')?.state, 'fail');
  assert.equal(summarizeChecks(tooLarge).blocking, true);
});

test('phase 11.1.2 GuidedCaptureScreen integrates with VerificationScreen for CCCD, GPLX, selfie and re-verification', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver', name), 'utf8');

  const appJson = read('app.json');
  assert.match(appJson, /"expo-camera"/);
  assert.match(appJson, /"recordAudioAndroid":\s*false/);
  assert.match(appJson, /"barcodeScannerEnabled":\s*true/);

  const guided = read('src/features/verification/GuidedCaptureScreen.tsx');
  assert.match(guided, /from 'expo-camera'/);
  assert.match(guided, /ID1_RATIO = 85\.6 \/ 54/);
  assert.match(guided, /height \/ ID1_RATIO/);
  assert.match(guided, /Xoay dọc thẻ/);
  assert.match(guided, /enableTorch=\{torch && !selfie\}/);
  assert.match(guided, /selfie \? 'front' : 'back'/);
  assert.match(guided, /ứng dụng chưa tự nhận diện bốn góc thẻ/i);
  assert.match(guided, /ứng dụng chưa tự kiểm tra khuôn mặt hay người thật/i);
  assert.match(guided, /removeCacheFile/);

  const bundle = readVerificationFeatureBundle();
  const screen = read('src/features/verification/VerificationScreen.tsx');
  assert.match(screen, /GuidedCaptureScreen/);
  assert.match(screen, /openGuidedCapture\(slot\[0\]\)/);
  assert.match(bundle, /slotKey !== 'selfie'/);
  assert.match(screen, /inspectCapturedWithServer/);
});

test('rejected driver application without verified baseline can initiate a new verification request', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');

  const statusView = read('features/verification/components/VerificationStatusView.tsx');
  const screen = read('features/verification/VerificationScreen.tsx');
  assert.match(statusView, /app\.status === 'REJECTED' && !pending/);
  assert.match(statusView, /label="Tạo yêu cầu hồ sơ mới"/);
  assert.match(screen, /onStartReverify=\{\(\) => void run\('Đang tạo yêu cầu hồ sơ mới…', startReverify\)\}/);
  assert.match(statusView, /Lý do từ chối: \$\{app\.reason\}/);
  assert.match(statusView, /app\.status === 'DRAFT' && app\.approvedRevision != null && !app\.identityHold/);

  const approval = read('features/auth/screens/ApprovalStatusScreen.tsx');
  assert.match(approval, /const rejected = v\.data\?\.verification_status === "REJECTED"/);
  assert.match(approval, /rejected && managed \? "Hồ sơ eKYC chưa được duyệt"/);
  assert.match(approval, /rejected \? "Tạo yêu cầu hồ sơ mới"/);
});

test('phase 11.1.3B qrScanDecision, source-aware collectChoices, and formatOriginLabel cover all QR workflows', async () => {
  const {
    autofillChoices,
    collectChoices,
    formatOriginLabel,
    qrScanDecision,
    sameExtractionGeneration,
  } = await import('../apps/driver/src/features/verification/workflow.ts');

  const decodedFront = {
    cccd_front: {
      qrStatus: 'DECODED_VALID',
      ocrStatus: 'PARSED',
      warnings: [],
      qr: { status: 'DECODED_VALID', source: 'QR_IMAGE', documentSide: 'FRONT', cardVariant: 'CCCD_2021' },
      candidates: [],
    },
  };
  assert.deepEqual(qrScanDecision(decodedFront), {
    mode: 'SKIP_DECODED',
    shouldOffer: false,
    recommended: false,
    defaultSide: 'FRONT',
    expectedVariant: 'CCCD_2021',
  });

  const unreadableBack = {
    cccd_back: {
      qrStatus: 'DETECTED_UNREADABLE',
      ocrStatus: 'OCR_UNSUPPORTED',
      warnings: [],
      qr: { status: 'DETECTED_UNREADABLE', source: 'QR_IMAGE', documentSide: 'BACK', cardVariant: 'CAN_CUOC_2024' },
      candidates: [],
    },
  };
  assert.deepEqual(qrScanDecision(unreadableBack), {
    mode: 'RECOMMEND_LIVE_SCAN',
    shouldOffer: true,
    recommended: true,
    defaultSide: 'BACK',
    expectedVariant: 'CAN_CUOC_2024',
  });

  const notFound2024 = {
    cccd_back: {
      qrStatus: 'NOT_FOUND',
      ocrStatus: 'OCR_UNSUPPORTED',
      warnings: [],
      qr: { status: 'NOT_FOUND', source: 'QR_IMAGE', documentSide: 'BACK', cardVariant: 'CAN_CUOC_2024' },
      candidates: [],
    },
  };
  assert.deepEqual(qrScanDecision(notFound2024), {
    mode: 'ALLOW_LIVE_SCAN',
    shouldOffer: true,
    recommended: false,
    defaultSide: 'BACK',
    expectedVariant: 'CAN_CUOC_2024',
  });

  assert.equal(qrScanDecision(notFound2024, { cardHasQrExpected: false }).mode, 'NO_QR_CARD');
  assert.equal(qrScanDecision({}, { extractFailed: true }).mode, 'SERVER_FALLBACK');
  assert.equal(qrScanDecision({}, { extractFailed: true }).shouldOffer, true);

  const liveQr = {
    status: 'DECODED_VALID',
    source: 'QR_LIVE_SCAN',
    documentSide: 'FRONT',
    fields: {
      id_number: '079095001234',
      full_name: 'Nguyễn Văn An',
      dob: '1995-03-15',
      gender: 'MALE',
    },
    conflictFields: [],
  };
  assert.equal(qrScanDecision(unreadableBack, { liveQr }).mode, 'LIVE_SCANNED');

  const mixedObservations = {
    cccd_front: {
      qrStatus: 'DETECTED_UNREADABLE',
      ocrStatus: 'PARSED',
      warnings: [],
      candidates: [
        {
          fieldKey: 'full_name',
          candidateValue: 'Nguyen Van An',
          source: 'OCR',
          sourceDocument: 'CCCD',
          sourceSide: 'FRONT',
          parseStatus: 'parsed',
          validationStatus: 'valid',
          conflict: false,
        },
        {
          fieldKey: 'id_number',
          candidateValue: '079095001234',
          source: 'OCR',
          sourceDocument: 'CCCD',
          sourceSide: 'FRONT',
          parseStatus: 'parsed',
          validationStatus: 'valid',
          conflict: false,
        },
      ],
    },
  };
  const merged = collectChoices(mixedObservations, liveQr);
  assert.equal(merged.cccd_id.length, 1);
  assert.deepEqual(merged.cccd_id[0].origins, ['OCR', 'QR_LIVE_SCAN']);
  assert.equal(formatOriginLabel(merged.cccd_id[0]), 'OCR · Đọc từ quét QR trực tiếp');
  assert.equal(merged.cccd_name.length, 2);
  assert.equal(formatOriginLabel(merged.cccd_name[1]), 'Đọc từ quét QR trực tiếp');
  assert.equal(merged.cccd_dob.length, 1);
  assert.equal(formatOriginLabel(merged.cccd_dob[0]), 'Đọc từ quét QR trực tiếp');
  assert.equal(formatOriginLabel(null), 'Tài xế nhập');
  assert.equal(formatOriginLabel(merged.cccd_dob[0], { touched: true }), 'Tài xế nhập');

  // Auto-fill fills non-conflicting blank fields, never overwrites touched or conflicting fields.
  const autofill = autofillChoices({ cccd_dob: '' }, false, new Set(['cccd_id']), merged);
  assert.equal(autofill.cccd_dob?.value, '1995-03-15');
  assert.equal(autofill.cccd_name, undefined);
  assert.equal(autofill.cccd_id, undefined);

  assert.equal(
    sameExtractionGeneration({ generation: 2, id: 'app-1', revision: 4 }, { generation: 2, id: 'app-1', revision: 5 }),
    false,
  );
});

test('phase 11.1.3B QrScannerScreen and VerificationScreen enforce camera lifecycle, URL safety, and invalidation rules', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');

  const scanner = read('features/verification/QrScannerScreen.tsx');
  assert.match(scanner, /facing="back"/);
  assert.match(scanner, /enableTorch=\{torch\}/);
  assert.match(scanner, /barcodeScannerSettings=\{\{\s*barcodeTypes:\s*\['qr'\]\s*\}\}/);
  assert.match(scanner, /scanLock\.current/);
  assert.match(scanner, /AppState\.addEventListener/);
  assert.match(scanner, /Quét lại/);
  assert.match(scanner, /Bỏ qua/);
  assert.doesNotMatch(scanner, /Linking\.openURL/);
  assert.doesNotMatch(scanner, /recordAsync/);
  assert.doesNotMatch(scanner, /Đã xác thực danh tính/);

  const workflowSrc = read('features/verification/workflow.ts');
  assert.match(workflowSrc, /Đọc từ QR trên ảnh/);
  assert.match(workflowSrc, /Đọc từ quét QR trực tiếp/);
  assert.match(workflowSrc, /\['gplx_back', 'GPLX sau'\]/);

  const bundle = readVerificationFeatureBundle();
  const screen = read('features/verification/VerificationScreen.tsx');
  assert.match(screen, /QrScannerScreen/);
  assert.match(screen, /\/qr-scan/);
  assert.match(bundle, /formatOriginLabel/);
  assert.match(bundle, /Tài xế nhập/);
  assert.match(screen, /cccdRevalidationNeeded/);
  assert.match(screen, /gplxRevalidationNeeded/);
  assert.match(screen, /continueAfterDocumentBack/);
  assert.match(screen, /sameExtractionGeneration/);
  assert.doesNotMatch(bundle, /Tiếp tục \(tùy chọn\)/);
  assert.doesNotMatch(bundle, /Linking\.openURL/);
});

test('GPLX back capture is required and GPLX QR merges cleanly into choices and routing decisions', async () => {
  const {
    autofillChoices,
    collectChoices,
    formatOriginLabel,
    qrScanDecision,
    slots,
  } = await import('../apps/driver/src/features/verification/workflow.ts');

  assert.equal(slots.find(([key]) => key === 'gplx_back')?.[1], 'GPLX sau');

  const unreadableGplx = {
    gplx_back: {
      qrStatus: 'DETECTED_UNREADABLE',
      ocrStatus: 'OCR_UNSUPPORTED',
      warnings: [],
      qr: { status: 'DETECTED_UNREADABLE', source: 'QR_IMAGE', documentSide: 'BACK', cardVariant: 'GPLX_PET' },
      candidates: [],
    },
  };
  assert.deepEqual(qrScanDecision(unreadableGplx, { documentType: 'GPLX' }), {
    mode: 'RECOMMEND_LIVE_SCAN',
    shouldOffer: true,
    recommended: true,
    defaultSide: 'BACK',
    expectedVariant: 'GPLX_PET',
  });

  const gplxLiveQr = {
    status: 'DECODED_VALID',
    source: 'QR_LIVE_SCAN',
    documentSide: 'BACK',
    cardVariant: 'GPLX_PET',
    fields: {
      id_number: '790123456789',
      full_name: 'NGUYỄN VĂN AN',
      dob: '1995-03-15',
      vehicle_class: ['A1', 'B2'],
    },
    conflictFields: [],
  };
  assert.equal(qrScanDecision(unreadableGplx, { documentType: 'GPLX', liveQr: gplxLiveQr }).mode, 'LIVE_SCANNED');

  const gplxChoices = collectChoices({}, null, gplxLiveQr);
  assert.equal(gplxChoices.gplx_number?.[0].value, '790123456789');
  assert.equal(gplxChoices.gplx_classes?.[0].value, 'A1, B2');
  assert.equal(formatOriginLabel(gplxChoices.gplx_classes?.[0]), 'Đọc từ quét QR trực tiếp');

  const fill = autofillChoices({}, false, new Set(), gplxChoices);
  assert.equal(fill.gplx_number?.value, '790123456789');
  assert.equal(fill.gplx_classes?.value, 'A1, B2');
});

test('driver eKYC UX redesign removes technical leaks, uses 4 clear milestones, anchored footer and @datxe/ui lists', async () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const vm = require('node:vm');
  const ts = require('typescript');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');

  const workflowMod = await import('../apps/driver/src/features/verification/workflow.ts');
  const labelsSource = read('features/verification/verificationLabels.ts');
  const labelsOut = {};
  vm.runInNewContext(
    ts.transpileModule(labelsSource, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText,
    {
      exports: labelsOut,
      module: { exports: labelsOut },
      require: id => {
        if (id === './workflow') return workflowMod;
        return require(id);
      },
    },
  );
  const { formatGenderValue, visibleMilestone, visibleObservationWarnings } = labelsOut;

  assert.equal(visibleMilestone('PREPARE', 0).label, 'Bước 1/4 · Chuẩn bị giấy tờ');
  assert.equal(visibleMilestone('CAPTURE', 2).label, 'Bước 2/4 · Chụp ảnh (3/5)');
  assert.equal(visibleMilestone('OCR', 4).index, 3);
  assert.equal(visibleMilestone('CONFIRM_FIELDS', 4).index, 3);
  assert.equal(visibleMilestone('SUMMARY', 4).index, 4);

  // Never surface internal OCR_UNSUPPORTED jargon on back/selfie slots.
  assert.deepEqual(Array.from(visibleObservationWarnings(['OCR_UNSUPPORTED'])), []);
  assert.equal(
    visibleObservationWarnings(['QR_DETECTED_UNREADABLE', 'QR_DETECTED_UNREADABLE']).length,
    1,
  );
  assert.equal(formatGenderValue('MALE'), 'Nam');
  assert.equal(formatGenderValue('FEMALE'), 'Nữ');
  assert.equal(formatGenderValue(''), '—');

  const bundle = readVerificationFeatureBundle();
  assert.doesNotMatch(bundle, /Mặt này chưa hỗ trợ OCR/);
  assert.doesNotMatch(bundle, /\bfieldCard\b/);
  assert.doesNotMatch(bundle, /\bverifiedTile\b/);

  const screen = read('features/verification/VerificationScreen.tsx');
  assert.match(screen, /scrollResetKey=/);
  assert.match(screen, /footer=/);
  assert.match(screen, /completeCaptureFlow/);
  assert.match(screen, /autoAdvance:\s*true/);

  const fieldsStep = read('features/verification/components/VerificationFieldsStep.tsx');
  assert.match(fieldsStep, /FilterChip/);
  assert.match(fieldsStep, /SharedStatusBadge/);
  assert.match(fieldsStep, /Divider/);

  const summaryStep = read('features/verification/components/VerificationSummaryStep.tsx');
  assert.match(summaryStep, /GroupedList/);
  assert.match(summaryStep, /KeyValueRow/);
  assert.match(summaryStep, /\btile\b/);

  const approval = read('features/auth/screens/ApprovalStatusScreen.tsx');
  assert.doesNotMatch(approval, /\bstepBadge\b/);
  assert.doesNotMatch(approval, /progress=\{1\}/);

  const guided = read('features/verification/GuidedCaptureScreen.tsx');
  assert.match(guided, /showCheckDetails/);

  const scanner = read('features/verification/QrScannerScreen.tsx');
  assert.match(scanner, /flexWrap:\s*'wrap'/);

  const profile = read('features/profile/screens/ProfileScreen.tsx');
  assert.match(profile, /Chụp CCCD, GPLX và ảnh chân dung/);
});

test('image optimization normalizes high-res captures without upscaling and cleans up replaced temp URIs', async () => {
  const {
    DOCUMENT_JPEG_QUALITY,
    DOCUMENT_MAX_LONG_SIDE,
    SELFIE_MAX_LONG_SIDE,
    optimizeCapturedImage,
    targetDocumentDimensions,
  } = await import('../apps/driver/src/features/verification/imageOptimization.ts');

  assert.equal(DOCUMENT_MAX_LONG_SIDE, 1800);
  assert.equal(SELFIE_MAX_LONG_SIDE, 1600);
  assert.equal(DOCUMENT_JPEG_QUALITY, 0.82);

  assert.deepEqual(targetDocumentDimensions(4080, 3060), { width: 1800, height: 1350 });
  assert.deepEqual(targetDocumentDimensions(3060, 4080), { width: 1350, height: 1800 });
  assert.equal(targetDocumentDimensions(1280, 960), null);
  assert.equal(targetDocumentDimensions(1800, 1200), null);

  const cleaned = [];
  const resized = await optimizeCapturedImage(
    { uri: 'file:///cache/raw-big.jpg', width: 4080, height: 3060, mimeType: 'image/jpeg', fileSize: 3_200_000 },
    {
      kind: 'document',
      manipulate: async (uri, resize, quality) => {
        assert.equal(uri, 'file:///cache/raw-big.jpg');
        assert.deepEqual(resize, { width: 1800, height: 1350 });
        assert.equal(quality, 0.82);
        return { uri: 'file:///cache/optimized.jpg', width: 1800, height: 1350 };
      },
      statSize: () => 465_000,
      cleanup: uri => cleaned.push(uri),
    },
  );
  assert.equal(resized.optimized, true);
  assert.equal(resized.fileSize, 465_000);
  assert.deepEqual(cleaned, ['file:///cache/raw-big.jpg']);

  // Small already-compressed JPEG is passed through without generation loss.
  let invoked = false;
  const small = await optimizeCapturedImage(
    { uri: 'file:///cache/small.jpg', width: 1280, height: 960, mimeType: 'image/jpeg', fileSize: 320_000 },
    { manipulate: async () => { invoked = true; return { uri: 'x', width: 2, height: 2 }; } },
  );
  assert.equal(invoked, false);
  assert.equal(small.optimized, false);

  // Older native client without ImageManipulator degrades safely instead of throwing.
  const fallback = await optimizeCapturedImage(
    { uri: 'file:///cache/raw.jpg', width: 4080, height: 3060, mimeType: 'image/jpeg', fileSize: 3_000_000 },
    { manipulate: async () => { throw new Error('Native module missing'); } },
  );
  assert.equal(fallback.uri, 'file:///cache/raw.jpg');
  assert.equal(fallback.optimized, false);
});

test('verification timeouts, QR decoupling, server proposal hydration, and status copy are aligned', async () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');

  const {
    EXTRACT_TIMEOUT_MS,
    FACE_QUALITY_TIMEOUT_MS,
    METADATA_TIMEOUT_MS,
    QR_SCAN_TIMEOUT_MS,
    SUBMIT_TIMEOUT_MS,
    TASK_STATUS_COMPLETED,
    TASK_STATUS_EXTRACTING,
    TASK_STATUS_QR_CHECKING,
    TASK_STATUS_UPLOADING,
    UPLOAD_TIMEOUT_MS,
    hydratableObservationsFromApplication,
    resolveQrAttachmentBinding,
  } = await import('../apps/driver/src/features/verification/reliabilityHelpers.ts');

  assert.equal(METADATA_TIMEOUT_MS, 15_000);
  assert.equal(UPLOAD_TIMEOUT_MS, 45_000);
  assert.equal(EXTRACT_TIMEOUT_MS, 65_000);
  assert.equal(QR_SCAN_TIMEOUT_MS, 15_000);
  assert.equal(FACE_QUALITY_TIMEOUT_MS, 45_000);
  assert.equal(SUBMIT_TIMEOUT_MS, 25_000);
  assert.equal(TASK_STATUS_UPLOADING, 'Đang tải ảnh…');
  assert.equal(TASK_STATUS_EXTRACTING, 'Đang đọc thông tin giấy tờ. Quá trình này có thể mất một lúc.');
  assert.equal(TASK_STATUS_QR_CHECKING, 'Đang kiểm tra thông tin QR…');
  assert.equal(TASK_STATUS_COMPLETED, 'Đã hoàn thành.');

  const capFrontId = '11111111-1111-1111-1111-111111111111';
  const capBackId = '22222222-2222-2222-2222-222222222222';
  const app = {
    id: 'app-1',
    status: 'DRAFT',
    revision: 3,
    document: {
      captures: {
        cccd_front: { id: capFrontId, mime: 'image/jpeg' },
        cccd_back: { id: capBackId, mime: 'image/jpeg' },
      },
      proposals: {
        cccd_front: {
          captureId: capFrontId,
          result: { qrStatus: 'NOT_FOUND', ocrStatus: 'PARSED', warnings: [], candidates: [] },
        },
        cccd_back: {
          captureId: '33333333-3333-3333-3333-333333333333',
          result: { qrStatus: 'DECODED_VALID', ocrStatus: 'OCR_UNSUPPORTED', warnings: [], candidates: [] },
        },
      },
    },
  };

  // Hydrates matching captureId proposal when no local unsaved photo overrides that slot.
  const hydrated = hydratableObservationsFromApplication(app, { gplx_front: { uri: 'local' } });
  assert.ok(hydrated.cccd_front);
  assert.equal(hydrated.cccd_back, undefined);

  // Never binds stale captureId when a new un-uploaded local photo replaces that side.
  assert.deepEqual(
    resolveQrAttachmentBinding({
      docType: 'CCCD',
      side: 'BACK',
      application: app,
      uploadedUris: {},
      localUris: { cccd_back: 'file:///cache/new-back.jpg' },
    }),
    { targetSlot: 'cccd_back', attachmentId: undefined },
  );
  assert.deepEqual(
    resolveQrAttachmentBinding({
      docType: 'CCCD',
      side: 'FRONT',
      application: app,
      uploadedUris: {},
      localUris: {},
    }),
    { targetSlot: 'cccd_front', attachmentId: capFrontId },
  );

  const screen = read('features/verification/VerificationScreen.tsx');
  assert.match(screen, /optimizeCapturedImage/);
  assert.match(screen, /resolveQrAttachmentBinding/);
  assert.match(screen, /QR_SCAN_TIMEOUT_MS/);
  assert.match(screen, /EXTRACT_TIMEOUT_MS/);
  assert.doesNotMatch(screen, /for\s*\(\s*const\s+slotKey\s+of\s+pairSlots\s*\)/);

  const guided = read('features/verification/GuidedCaptureScreen.tsx');
  assert.match(guided, /optimizeCapturedImage/);

  const scanner = read('features/verification/QrScannerScreen.tsx');
  assert.match(scanner, /Đang kiểm tra thông tin QR…/);
});
