const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function load(file, mocks) {
  const exports = {};
  const { outputText } = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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

test("sign-in method comes from the Firebase providers, not the linked phone number", () => {
  const parts = load("apps/customer/src/features/auth/components/RegisterScreenParts.tsx", {
    "@datxe/ui": { spacing: {}, typography: {} },
    "react-native": { StyleSheet: { create: (value) => value } },
  });

  // Tài khoản Google đã liên kết số điện thoại vẫn phải hiển thị là Google.
  assert.equal(parts.getSignInMethod(["google.com", "phone"]), "google");
  assert.equal(parts.getSignInMethod(["phone", "google.com"]), "google");
  assert.equal(parts.getSignInMethod(["facebook.com", "phone"]), "facebook");
  assert.equal(parts.getSignInMethod(["phone"]), "phone");
  assert.equal(parts.getSignInMethod([]), "phone");
});

test("Complete sign-up shows the provider label and never the raw linked phone as the method", () => {
  const screen = read("apps/customer/src/features/auth/screens/RegisterScreen.tsx");
  const hook = read("apps/customer/src/features/auth/hooks/useRegister.ts");

  assert.match(hook, /getSignInMethod\(user\?\.providerData/);
  assert.match(screen, /signInMethod === "phone"/);
  assert.match(screen, /signInMethod === "google" \? "Google" : "Facebook"/);
  // Số điện thoại chỉ được dùng làm giá trị khi phương thức đăng nhập là OTP.
  assert.match(screen, /signInProviderLabel === null\s*\?\s*user\.phoneNumber/);
});

test("Leaving the auth flow always returns to Login instead of flashing through Home", () => {
  const screen = read("apps/customer/src/features/auth/screens/RegisterScreen.tsx");
  const rootLayout = read("apps/customer/src/components/RootLayout.tsx");

  assert.match(
    screen,
    /const leave = \(\) => \{\s*router\.replace\("\/\(auth\)\/login" as never\);\s*\};/,
  );
  assert.doesNotMatch(screen, /router\.canGoBack\(\)/);

  assert.match(rootLayout, /const AUTH_PATHS = new Set\(\["\/login"/);
  assert.match(rootLayout, /if \(AUTH_PATHS\.has\(path\)\)/);
  const authStart = rootLayout.indexOf("if (AUTH_PATHS.has(path))");
  const authBranch = rootLayout.slice(authStart, rootLayout.indexOf("return false;", authStart));
  assert.match(authBranch, /current\.replace\("\/\(auth\)\/login"\)/);
  assert.doesNotMatch(authBranch, /\/\(tabs\)\/home/);
});
