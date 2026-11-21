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
  typography: { sectionTitle: {}, screenTitle: {}, bodySecondary: {}, caption: {}, label: {} },
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
    "../theme/ThemeProvider": { useThemeColors: () => ({ primary: "#000", onSurfaceVariant: "#111", surfaceContainerHighest: "#eee" }) },
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
    "../theme/ThemeProvider": { useThemeColors: () => ({ primary: "#000", onSurfaceVariant: "#111", surfaceContainerHighest: "#eee" }) },
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

test("compact ReceivedRatings keeps the summary but hides the title and comments", () => {
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
    "../theme/ThemeProvider": { useThemeColors: () => ({ primary: "#000", onSurfaceVariant: "#111", surfaceContainerHighest: "#eee" }) },
  });

  const tree = renderReceivedRatings(ReceivedRatings, {
    compact: true,
    hasMore: true,
    data: {
      averageRating: 4.8,
      totalRatings: 12,
      ratings: [{ stars: 5, comment: "Tài xế thân thiện", tags: ["Đúng giờ"], createdAt: "2026-11-18T10:00:00" }],
      page: 0,
      size: 20,
      totalPages: 1,
      hasNext: false,
    },
  });

  assert.match(tree, /4,8 ★/);
  assert.match(tree, /12 lượt đánh giá/);
  // Biểu đồ phân bố 5★ → 1★ phải có ngay cả khi thu gọn (những "gạch ngang" trong ảnh 2).
  assert.match(tree, /5 sao, 1 lượt/);
  assert.match(tree, /4 sao, 0 lượt/);
  assert.doesNotMatch(tree, /Đánh giá đã nhận/);
  assert.doesNotMatch(tree, /Tài xế thân thiện/);
  assert.doesNotMatch(tree, /Xem thêm đánh giá/);
});

test("ReceivedRatings prefers the server distribution when it is available", () => {
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
    "../theme/ThemeProvider": { useThemeColors: () => ({ primary: "#000", onSurfaceVariant: "#111", surfaceContainerHighest: "#eee" }) },
  });

  const tree = renderReceivedRatings(ReceivedRatings, {
    compact: true,
    data: {
      averageRating: 5,
      totalRatings: 6,
      ratings: [],
      page: 0,
      size: 20,
      totalPages: 1,
      hasNext: false,
      distribution: { 5: 6 },
    },
  });

  assert.match(tree, /5 sao, 6 lượt/);
  assert.match(tree, /1 sao, 0 lượt/);
});

test("collapsed customer ratings still load page one and show the summary", () => {
  const page = { averageRating: 5, totalRatings: 6, ratings: [], page: 0, size: 20, totalPages: 1, hasNext: false };
  let queryOptions;
  const { MyCustomerRatings } = load("apps/customer/src/features/profile/components/MyCustomerRatings.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": { useState: (initial) => [initial, () => {}] },
    "react-native": { StyleSheet: { create: (styles) => styles } },
    "@tanstack/react-query": {
      useInfiniteQuery: (options) => {
        queryOptions = options;
        return {
          data: { pages: [page] },
          isLoading: false,
          isError: false,
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPage: () => {},
          refetch: () => {},
        };
      },
    },
    "@datxe/ui": {
      Button: (props) => jsx("Button", props),
      Card: (props) => jsx("Card", props),
      ReceivedRatings: (props) => jsx("ReceivedRatings", props),
      spacing: { spaceMd: 12, spaceSm: 8 },
    },
    "../api": { getReceivedRatings: async () => page },
  });

  const tree = JSON.stringify(MyCustomerRatings({ collapsible: true }));
  assert.equal(queryOptions.enabled, undefined, "page one must load even while collapsed");
  assert.match(tree, /Xem đánh giá của tôi/);
  assert.match(tree, /"compact":true/);
  assert.match(tree, /6/);
  assert.doesNotMatch(tree, /"title":"Đánh giá từ tài xế"/);
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

test("CustomerReviews queries the customer of the current ride and labels it correctly", async () => {
  const paths = [];
  let options;
  const { CustomerReviews } = load("apps/driver/src/features/ride/components/CustomerReviews.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@/lib/api": {
      request: async (path) => {
        paths.push(path);
        return { averageRating: 5, total: 6, distribution: { 5: 6 }, recent: [] };
      },
    },
    "@datxe/ui": {
      DriverReviews: (props) => jsx("DriverReviews", props),
    },
    "@tanstack/react-query": {
      useQuery: (value) => {
        options = value;
        return { data: null, isLoading: false, isError: false, refetch: () => {} };
      },
    },
  });

  const tree = JSON.stringify(CustomerReviews({ rideId: 42, enabled: true }));
  await options.queryFn();
  assert.deepEqual(paths, ["/driver/rides/42/customer-reviews"]);
  assert.match(tree, /Đánh giá khách hàng/);
  assert.match(tree, /Tài xế ẩn danh/);
});

test("driver customer profile shows the ride customer's reviews, not the driver's own", () => {
  const reviews = fs.readFileSync("apps/driver/src/features/ride/components/CustomerReviews.tsx", "utf8");
  assert.match(reviews, /\/driver\/rides\/\$\{rideId\}\/customer-reviews/);
  assert.doesNotMatch(reviews, /\/driver\/profile\/reviews/);
  assert.match(reviews, /<DriverReviews\b/);
  assert.match(reviews, /type DriverReviewSummary/);
  assert.match(reviews, /title="Đánh giá khách hàng"/);
  assert.match(reviews, /reviewerLabel="Tài xế ẩn danh"/);
  assert.doesNotMatch(reviews, /ReceivedRatings|\/driver\/ratings\/received|\/customer\/ratings\/received/);

  const card = fs.readFileSync("apps/driver/src/features/ride/components/RideCustomerCard.tsx", "utf8");
  assert.match(card, /<CustomerReviews rideId=\{ride\.id\} enabled=\{visible\} \/>/);
  assert.match(card, /<Text accessibilityRole="header" style=\{s\.title\}>Hồ sơ khách hàng<\/Text>/);
  // Hồ sơ khách hàng là bottom sheet trượt lên từ đáy, không phải Dialog giữa màn hình.
  assert.match(card, /<Modal\s+visible=\{visible\}\s+transparent\s+animationType="slide"/);
  assert.match(card, /justifyContent: "flex-end"/);
  assert.doesNotMatch(card, /<Dialog|Portal/);

  const inProgress = fs.readFileSync("apps/driver/src/features/ride/screens/InProgressScreen.tsx", "utf8");
  assert.match(inProgress, /<RideCustomerCard key=\{ride\.id\} ride=\{ride\} \/>/);

  const detail = fs.readFileSync("apps/driver/src/features/ride/screens/CompleteScreen.tsx", "utf8");
  assert.doesNotMatch(detail, /RideCustomerCard/);

  const history = fs.readFileSync("apps/driver/src/features/history/screens/HistoryScreen.tsx", "utf8");
  assert.doesNotMatch(history, /Đã đánh giá|myRatingStars|hasRated/);
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
  // Ô tab chỉ là vùng chạm trong suốt: không bo 999, không overflow hidden để nhãn 2 dòng và badge lớn không bị cắt.
  assert.doesNotMatch(tabStyle[0], /borderRadius:\s*999/);
  assert.doesNotMatch(tabStyle[0], /overflow:\s*["']hidden["']/);
  // Không dùng TouchableRipple/android_ripple: vệt nhấn của nó là hình chữ nhật, bị kẹt lại sau khi
  // mở chi tiết rồi quay lại. Phản hồi nhấn phải nằm trên viên thuốc quanh icon (borderRadius 16).
  assert.doesNotMatch(bar, /TouchableRipple|android_ripple/);
  assert.match(bar, /import \{[^}]*Pressable[^}]*\} from "react-native"/);
  assert.match(bar, /pressedId === item\.id\s*\?\s*colors\.surfaceContainerHighest/);
  assert.match(tabStyle[0], /borderRadius:\s*16/);
  // Vùng chạm tối thiểu 48dp (thực tế 64dp) và nhãn được phép xuống dòng thay vì bị cắt.
  assert.match(tabStyle[0], /minHeight:\s*64/);
  assert.match(bar, /textBreakStrategy="simple"/);
  assert.match(bar, /width:\s*["']100%["']/);
  const indicator = bar.match(/indicator:\s*\{[^}]*\}/);
  assert.ok(indicator, "indicator style must exist");
  assert.match(indicator[0], /borderRadius:\s*16/);
  assert.match(indicator[0], /height:\s*32/);
});

test("driver tab bar remounts on focus so a pressed ripple cannot survive navigation", () => {
  const page = fs.readFileSync("apps/driver/src/components/DriverPage.tsx", "utf8");
  assert.match(page, /useFocusEffect/);
  assert.match(page, /setTabBarRevision\(\(revision\) => revision \+ 1\)/);
  assert.match(page, /<TonalNavigationBar\s+key=\{tabBarRevision\}/);
});
