const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('driver app handles ACCOUNT_LOCKED across API client, session gate, social login, and OTP verify', () => {
  const apiTs = read('apps/driver/src/lib/api.ts');
  assert.match(apiTs, /signOutFirebase/);
  assert.match(apiTs, /\/\(auth\)\/account-locked/);

  const gateTs = read('apps/driver/src/features/auth/hooks/useSessionGate.ts');
  assert.match(gateTs, /ACCOUNT_LOCKED/);
  assert.match(gateTs, /\/\(auth\)\/account-locked/);

  const loginTs = read('apps/driver/src/features/auth/hooks/useLogin.ts');
  assert.match(loginTs, /ACCOUNT_LOCKED/);
  assert.match(loginTs, /\/\(auth\)\/account-locked/);

  const otpTs = read('apps/driver/src/features/auth/screens/OtpVerifyScreen.tsx');
  assert.match(otpTs, /onAccountLocked=/);
  assert.match(otpTs, /\/\(auth\)\/account-locked/);

  const routeFile = read('apps/driver/src/app/(auth)/account-locked.tsx');
  assert.ok(routeFile.split(/\r?\n/).length <= 10, 'app route file must remain thin re-export');
  assert.match(routeFile, /AccountLockedScreen/);

  const screenTs = read('apps/driver/src/features/auth/screens/AccountLockedScreen.tsx');
  assert.match(screenTs, /Tài khoản tài xế đã bị khóa/);
  assert.match(screenTs, /19001234/);
  assert.doesNotMatch(screenTs, /#[0-9a-fA-F]{3,8}\b/, 'AccountLockedScreen must not hardcode raw hex colors');
});

test('driver HomeScreen blocks Go Online when SUSPENDED while preserving wallet, verification, support, and active ride continuity', () => {
  const homeTs = read('apps/driver/src/features/offers/screens/HomeScreen.tsx');
  assert.match(homeTs, /accountStatus === "SUSPENDED"/);
  assert.match(homeTs, /Tài khoản đang tạm ngưng nhận chuyến/);
  assert.match(homeTs, /!h\.active\.data && isSuspended/);
  assert.match(homeTs, /\/profile\/wallet/);
  assert.match(homeTs, /\/profile\/verification/);
  assert.match(homeTs, /\/support/);
});

test('driver PushBridge forces offline with reason popup on suspend/force-offline and kicks out on BANNED', () => {
  const pushTs = read('apps/driver/src/components/PushBridge.tsx');
  assert.match(pushTs, /DRIVER_FORCE_OFFLINE/);
  assert.match(pushTs, /DRIVER_ACCOUNT_STATUS_UPDATED/);
  assert.match(pushTs, /accountStatus === 'BANNED'/);
  assert.match(pushTs, /Alert\.alert/);
  assert.match(pushTs, /onlineVehicleType:\s*null/);
});

test('driver withdrawal screen blocks withdrawal form and displays notice when withdrawal_frozen is enabled', () => {
  const withdrawTs = read('apps/driver/src/features/profile/screens/DriverWithdrawalScreen.tsx');
  assert.match(withdrawTs, /withdrawal_frozen/);
  assert.match(withdrawTs, /withdrawalFrozen/);
  assert.match(withdrawTs, /Tính năng rút tiền đang bị tạm khóa/);
  assert.match(withdrawTs, /!withdrawalFrozen && cash !== undefined/);
});
