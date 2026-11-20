const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const read = (file) => fs.readFileSync(file, 'utf8');

function loadTs(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => mocks[name] });
  return exports;
}

test('driver hides rating notifications but keeps every other unread notification', () => {
  const visibility = loadTs('apps/driver/src/lib/notificationVisibility.ts', {
    '@datxe/shared': {},
  });
  const items = [
    { id: 1, type: 'RATING_RECEIVED', readAt: null },
    { id: 2, type: 'RIDE_UPDATED', readAt: null },
    { id: 3, type: 'VOUCHER_GRANTED', readAt: '2026-11-21' },
  ];
  assert.equal(visibility.isVisibleDriverNotification(items[0]), false);
  assert.equal(visibility.isVisibleDriverNotification(items[1]), true);
  assert.deepEqual(items.filter(visibility.isVisibleDriverNotification).map(i => i.id), [2, 3]);
  assert.equal(visibility.unreadDriverNotifications(items), 1);
  assert.equal(visibility.unreadDriverNotifications(undefined), 0);
});

test('driver profile uses a small camera badge on a full-size avatar touch target', () => {
  const profile = read('apps/driver/src/features/profile/screens/ProfileScreen.tsx');
  assert.match(profile, /accessibilityRole="button"/);
  assert.match(profile, /accessibilityLabel="Chụp ảnh chân dung làm ảnh đại diện"/);
  assert.match(profile, /router\.push\("\/profile\/avatar-capture"\)/);
  assert.match(profile, /name="photo-camera" size=\{fontSize\.iconSm\}/);
  assert.match(profile, /avatarWrap: \{ position: "relative", flexShrink: 0, minWidth: 48, minHeight: 48 \}/);
  assert.match(profile, /cameraBadge: \{[\s\S]*?width: 26,\s*height: 26,/);
  assert.doesNotMatch(profile, /cameraButton:/);
  assert.match(read('apps/driver/src/app/profile/avatar-capture.tsx'), /AvatarCaptureScreen/);
});

test('portrait capture uploads the front-camera photo as the driver avatar', () => {
  const capture = read('apps/driver/src/features/profile/screens/AvatarCaptureScreen.tsx');
  assert.match(capture, /facing="front"/);
  assert.match(capture, /takePictureAsync\(/);
  assert.match(capture, /uploadDriverImage\(/);
  assert.match(capture, /updateDriverAvatar\(\{/);
  assert.match(capture, /secure_url: uploaded\.secureUrl/);
  assert.match(capture, /public_id: uploaded\.publicId/);
  assert.match(capture, /cancelQueries\(\{ queryKey: \["driver", "profile"\] \}\)/);
  assert.match(capture, /setQueryData<DriverProfile>\(\["driver", "profile"\], profile\)/);
  assert.match(capture, /invalidateQueries\(\{ queryKey: \["driver", "dailySummary"\] \}\)/);
  assert.match(capture, /localizedAlert\("Đã cập nhật ảnh"/);
  assert.match(capture, /router\.back\(\)/);
  const api = read('apps/driver/src/features/profile/api.ts');
  assert.match(api, /"\/driver\/profile\/avatar"/);
});

test('driver push bridge never presents or routes rating-received notifications', () => {
  const bridge = read('apps/driver/src/components/PushBridge.tsx');
  assert.match(bridge, /if \(event\.type === 'RATING_RECEIVED'\) void acknowledgePushOpen\(event\)/);
  assert.match(bridge, /if \(event\.type !== 'RATING_RECEIVED'\) void presentPushNotification\(event\)/);
  const list = read('apps/driver/src/features/notifications/screens/NotificationsScreen.tsx');
  assert.match(list, /\(q\.data \?\? \[\]\)\.filter\(isVisibleDriverNotification\)/);
  assert.match(list, /unreadDriverNotifications\(q\.data\)/);
  const page = read('apps/driver/src/components/DriverPage.tsx');
  assert.match(page, /unreadDriverNotifications\(items as CustomerNotification\[\] \| undefined\)/);
});
