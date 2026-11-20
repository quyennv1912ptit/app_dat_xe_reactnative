const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const jsx = (type, props) => ({ type, props });

function load(file, mocks = {}, extraGlobals = {}) {
  const exports = {};
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    exports,
    console,
    URLSearchParams,
    ...extraGlobals,
    require: (id) => {
      if (!(id in mocks)) throw new Error(`Unexpected import: ${id}`);
      return mocks[id];
    },
  });
  return exports;
}

const theme = {
  typography: { sectionTitle: {}, screenTitle: {}, bodySecondary: {}, caption: {} },
};

function renderReceivedRatings(ReceivedRatings, props) {
  const tree = ReceivedRatings({
    loading: false,
    error: false,
    onRetry: () => {},
    ...props,
  });
  return JSON.stringify(tree);
}

test("ReceivedRatings shows the average score, total count and every comment", () => {
  const { ReceivedRatings } = load("packages/ui/src/components/ReceivedRatings.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react-native": { StyleSheet: { create: (styles) => styles }, View: "View" },
    "react-native-paper": { ActivityIndicator: "ActivityIndicator" },
    "@datxe/shared": {
      getLocale: () => "vi-VN",
      translate: (text, params) =>
        params ? String(text).replace(/\{(\d)\}/g, (_, index) => String(params[index])) : text,
    },
    "./Button": { Button: (props) => jsx("Button", props) },
    "./Typography": { Typography: (props) => jsx("Typography", props) },
    "../theme/colors": theme,
    "../theme/ThemeProvider": { useThemeColors: () => ({ primary: "#000", onSurfaceVariant: "#111" }) },
  });

  const tree = renderReceivedRatings(ReceivedRatings, {
    title: "Đánh giá từ tài xế",
    data: {
      averageRating: 4.8,
      totalRatings: 12,
      ratings: [
        { stars: 5, comment: "Tài xế thân thiện", tags: ["Đúng giờ"], createdAt: "2026-11-18T10:00:00" },
        { stars: 4, comment: null, tags: [], createdAt: "2026-11-17T10:00:00" },
      ],
      page: 0,
      size: 2,
      totalPages: 2,
      hasNext: true,
    },
    hasMore: true,
  });

  assert.match(tree, /Đánh giá từ tài xế/);
  assert.match(tree, /4,8 ★/);
  assert.match(tree, /12 lượt đánh giá/);
  assert.match(tree, /Tài xế thân thiện/);
  assert.match(tree, /Đúng giờ/);
  assert.match(tree, /Xem thêm đánh giá/);
});

test("ReceivedRatings explains the empty state and offers retry on failure", () => {
  const { ReceivedRatings } = load("packages/ui/src/components/ReceivedRatings.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react-native": { StyleSheet: { create: (styles) => styles }, View: "View" },
    "react-native-paper": { ActivityIndicator: "ActivityIndicator" },
    "@datxe/shared": {
      getLocale: () => "vi-VN",
      translate: (text, params) =>
        params ? String(text).replace(/\{(\d)\}/g, (_, index) => String(params[index])) : text,
    },
    "./Button": { Button: (props) => jsx("Button", props) },
    "./Typography": { Typography: (props) => jsx("Typography", props) },
    "../theme/colors": theme,
    "../theme/ThemeProvider": { useThemeColors: () => ({ primary: "#000", onSurfaceVariant: "#111" }) },
  });

  const empty = renderReceivedRatings(ReceivedRatings, {
    data: { averageRating: null, totalRatings: 0, ratings: [], page: 0, size: 20, totalPages: 0, hasNext: false },
  });
  assert.match(empty, /Chưa có đánh giá nào/);
  assert.doesNotMatch(empty, /Xem thêm đánh giá/);

  const failed = renderReceivedRatings(ReceivedRatings, { error: true });
  assert.match(failed, /Chưa tải được đánh giá/);
  assert.match(failed, /Thử lại/);
});

test("customer rating history calls the shared received-ratings contract with paging", async () => {
  const calls = [];
  const page = { averageRating: 5, totalRatings: 1, ratings: [], page: 1, size: 20, totalPages: 2, hasNext: true };
  const api = load("apps/customer/src/features/profile/api.ts", {
    "@/lib/api": { request: async (path) => { calls.push(path); return page; } },
    "@/lib/customerApi": { customerApi: {} },
    "@/lib/uploadImage": { uploadCustomerImage: async () => ({}) },
    "@datxe/shared": {},
    "@datxe/ui": {},
  });
  const result = await api.getReceivedRatings(1, 20);
  assert.equal(calls[0], "/customer/ratings/received?page=1&size=20");
  assert.deepEqual(result, page);

  const failing = load("apps/customer/src/features/profile/api.ts", {
    "@/lib/api": { request: async () => null },
    "@/lib/customerApi": { customerApi: {} },
    "@/lib/uploadImage": { uploadCustomerImage: async () => ({}) },
    "@datxe/shared": {},
    "@datxe/ui": {},
  });
  await assert.rejects(failing.getReceivedRatings(0, 20), /Chưa tải được đánh giá/);
});

test("driver wallet is the app wallet and history only covers the two driver wallets", () => {
  const screen = fs.readFileSync("apps/driver/src/features/profile/screens/DriverWalletScreen.tsx", "utf8");
  assert.match(screen, /title="Ví ứng dụng"/);
  assert.doesNotMatch(screen, /Ví tiền mặt/);
  assert.match(screen, /label: 'Tất cả'/);
  assert.match(screen, /label: 'Ứng dụng'/);
  assert.match(screen, /label: 'Tín dụng'/);
  assert.doesNotMatch(screen, /label: 'Tiền mặt'/);
  assert.doesNotMatch(screen, /useCashRideHistory|CashRideEntryCard/);
  assert.match(screen, /kind: 'CASH', label: 'Ứng dụng'/);
  assert.match(screen, /kind: 'CREDIT', label: 'Tín dụng'/);
  assert.doesNotMatch(screen, /Ví tiền mặt/);
  // Hai thẻ ví phải xếp dọc; row + flex:1/minWidth từng làm chúng đè lên nhau.
  assert.match(screen, /balanceGrid:\s*\{\s*gap:/);
  assert.doesNotMatch(screen, /balanceGrid:[^\n]*flexDirection:\s*'row'/);
  assert.doesNotMatch(screen, /balanceTile/);

  const withdrawal = fs.readFileSync("apps/driver/src/features/profile/screens/DriverWithdrawalScreen.tsx", "utf8");
  assert.match(withdrawal, /Ví ứng dụng khả dụng/);
  assert.doesNotMatch(withdrawal, /Ví tiền mặt/);

  const complete = fs.readFileSync("apps/driver/src/features/ride/screens/CompleteScreen.tsx", "utf8");
  assert.match(complete, /Đã cộng vào ví ứng dụng\./);
  assert.doesNotMatch(complete, /ví tiền mặt/);

  const walletUi = fs.readFileSync("packages/ui/src/wallet/WalletComponents.tsx", "utf8");
  assert.match(walletUi, /item\.walletType === 'CREDIT' \? 'Ví tín dụng' : 'Ví ứng dụng'/);
  assert.doesNotMatch(walletUi, /ví tiền mặt|Ví tiền mặt/);
});

test("bottom navigation keeps a pill touch target in every state", () => {
  const bar = fs.readFileSync("packages/ui/src/components/TonalNavigationBar.tsx", "utf8");
  const tabStyle = bar.match(/tab:\s*\{[^}]*\}/);
  assert.ok(tabStyle, "tab style must exist");
  // Ô tab chỉ là vùng chạm trong suốt: không ripple chữ nhật, không cắt chữ.
  assert.doesNotMatch(tabStyle[0], /borderRadius:\s*999/);
  assert.doesNotMatch(tabStyle[0], /overflow:\s*["']hidden["']/);
  // Dùng Pressable gốc, không gắn android_ripple để không còn vệt chữ nhật khi quay lại màn.
  assert.match(bar, /import \{ Pressable, StyleSheet, View, useWindowDimensions \} from "react-native"/);
  assert.doesNotMatch(bar, /TouchableRipple|rippleColor|android_ripple/);
  // Phản hồi nhấn nằm trên viên thuốc quanh icon và được xóa khi đổi tab.
  assert.match(bar, /pressedId === item\.id\s*\?\s*colors\.surfaceContainerHighest/);
  assert.match(bar, /setPressedId\(null\);\s*\}, \[active\]\)/);
  const indicator = bar.match(/indicator:\s*\{[^}]*\}/);
  assert.ok(indicator, "indicator style must exist");
  assert.match(indicator[0], /borderRadius:\s*16/);
  assert.match(indicator[0], /height:\s*32/);
});
