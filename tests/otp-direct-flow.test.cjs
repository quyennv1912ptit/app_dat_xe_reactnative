const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");

const read = (rel) => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

for (const app of ["customer", "driver"]) {
  test(`${app}: phone login prevents duplicate navigation and unlocks on return or navigation failure`, async () => {
    const exports = {};
    const routes = [];
    let focus;
    let failNavigation = false;
    const code = ts.transpileModule(read(`apps/${app}/src/features/auth/hooks/useLogin.ts`), {
      compilerOptions: {module: ts.ModuleKind.CommonJS},
    }).outputText;
    const shared = {
      translate: text => text, DEFAULT_PHONE_COUNTRY: {code:'VN'},
      isValidInternationalPhoneNumber: () => true, isValidVietnamPhoneNumber: () => true,
      toInternationalPhoneNumber: phone => phone, normalizeVietnamPhoneNumber: phone => phone,
    };
    vm.runInNewContext(code, { exports, require: name => {
      if (name === '@datxe/shared') return shared;
      if (name === 'react') return {
        useRef: value => ({current:value}), useState: value => [value, () => {}], useCallback: fn => fn,
      };
      if (name === 'expo-router') return {
        useFocusEffect: fn => {focus=fn;},
        useRouter: () => ({push: route => {
          if (failNavigation) throw new Error('Navigation unavailable');
          routes.push(route);
        }}),
      };
      if (name === '../components/LoginScreenParts') return {getErrorMessage: error => error.message};
      throw new Error(name);
    }});
    const login = exports.useLogin();
    focus();
    login.setPhone('+84900000001');
    await login.continueWithPhone();
    await login.continueWithPhone();
    assert.equal(routes.length, 1);
    focus();
    failNavigation = true;
    await login.continueWithPhone();
    failNavigation = false;
    await login.continueWithPhone();
    assert.equal(routes.length, 2);
    assert.equal(routes[1].params.phone, '+84900000001');
  });

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
