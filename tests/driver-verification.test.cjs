const test = require('node:test');
const assert = require('node:assert/strict');

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
  assert.match(screen, /accessibilityLabel="Xác nhận đã xem cảnh báo"/);
  assert.match(screen, /disabled=.+!currentWarningReview\.acknowledged/);
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
  assert.match(screen, /if \(!faceConsent \|\| !faceNotice\) return/);
  assert.match(screen, /'\/face-quality'/);
  assert.match(screen, /current\.current\.revision !== result\.revision/);
  assert.match(screen, /gửi để admin xem thủ công/);
  assert.match(screen, /setFaceConsent\(value\); setDraftFace\(undefined\)/);
});


test('driver verification routes and 7-step workflow are unified around /profile/verification', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const read = name => readFileSync(join(__dirname, '../apps/driver/src', name), 'utf8');

  const screen = read('features/verification/VerificationScreen.tsx');
  for (const stage of ['PREPARE', 'CAPTURE', 'OCR', 'CONFIRM_FIELDS', 'SUMMARY']) {
    assert.ok(screen.includes(`'${stage}'`), `Expected stage ${stage}`);
  }
  assert.match(screen, /Thông tin Căn cước công dân \(CCCD\)/);
  assert.match(screen, /Thông tin Giấy phép lái xe \(GPLX\)/);
  assert.match(screen, /Chọn loại xe nhận lái hộ/);

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

  const screen = read('features/verification/VerificationScreen.tsx');
  assert.match(screen, /Số định danh: \{verifiedMaskedCccd\}/);
  assert.match(screen, /Thông tin định danh đã xác minh không thể tự ý thay đổi\./);
  assert.match(screen, /Đã được admin kiểm tra/);
  assert.match(screen, /Cập nhật giấy tờ/);
  assert.match(screen, /Xem lịch sử xác minh/);
  assert.match(screen, /\/reverify/);
  assert.match(screen, /\/cancel-reverify/);
  assert.match(screen, /isIdentityLockedField/);
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

  const screen = read('src/features/verification/VerificationScreen.tsx');
  assert.match(screen, /GuidedCaptureScreen/);
  assert.match(screen, /openGuidedCapture\(slot\[0\]\)/);
  assert.match(screen, /slot\[0\] !== 'selfie'/);
  assert.match(screen, /inspectCapturedWithServer/);
});
