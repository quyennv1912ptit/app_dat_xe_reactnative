const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (rel) => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

for (const app of ["customer", "driver"]) {
  test(`${app}: bấm tiếp tục mở thẳng màn nhập OTP, không chờ gửi mã`, () => {
    const source = read(`apps/${app}/src/features/auth/hooks/useLogin.ts`);
    assert.doesNotMatch(source, /sendPhoneCode/);
    assert.match(source, /router\.push\(\{ pathname: '\/\(auth\)\/otp-verify'/);
    assert.match(source, /phoneSubmitting\.current/);
  });
}

test("Màn OTP dùng chung tự gửi mã và chỉ cho xác nhận khi mã đã sẵn sàng", () => {
  const source = read("packages/ui/src/auth/OtpVerificationScreen.tsx");
  assert.match(source, /void sendCode\(\)/);
  assert.match(source, /sendPhoneCode\(phone\)/);
  assert.match(source, /!sendReady/);
});
