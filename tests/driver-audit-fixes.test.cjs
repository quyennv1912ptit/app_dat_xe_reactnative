const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const read = (rel) => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

function loadTs(rel, mocks) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(read(rel), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports,
      require: (name) => {
        if (name in mocks) return mocks[name];
        throw new Error(`Missing mock for ${name}`);
      },
      setInterval: mocks.__setInterval ?? setInterval,
      clearInterval: mocks.__clearInterval ?? clearInterval,
    },
  );
  return exports;
}

test("HomeOperationalStatus only starts 1s interval when tracking and active", () => {
  const intervals = [];
  const effects = [];
  const hooks = {
    useState: (init) => [typeof init === "function" ? init() : init, () => {}],
    useEffect: (fn) => {
      effects.push(fn);
    },
  };
  const { HomeOperationalStatus } = loadTs(
    "apps/driver/src/features/offers/components/HomeOperationalStatus.tsx",
    {
      react: hooks,
      "react/jsx-runtime": { jsx: (t, p) => ({ type: t, props: p }), jsxs: (t, p) => ({ type: t, props: p }) },
      "@/lib/driverHealth": {
        useDriverHealth: () => ({
          connected: true,
          foregroundGranted: true,
          servicesEnabled: true,
          lastSampleAt: Date.now(),
          lastSentAt: Date.now(),
          retry() {},
        }),
      },
      "@expo/vector-icons": { MaterialIcons: "Icon" },
      "@datxe/ui": {
        Card: "Card",
        Button: "Button",
        MotionPressable: "Pressable",
        Typography: "Text",
        borderRadius: { default: 24, full: 999 },
        spacing: { xxs: 2, xs: 4, px3: 12, spaceSm: 8, spaceLg: 24 },
        typography: { titleLg: { fontSize: 20 }, labelMd: { fontSize: 13 }, labelLg: { fontSize: 16 } },
        useThemeColors: () => ({}),
      },
      "react-native": {
        AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
        View: "View",
        StyleSheet: { create: (styles) => styles },
      },
      __setInterval: (fn, ms) => {
        intervals.push(ms);
        return intervals.length;
      },
      __clearInterval: () => {},
    },
  );

  HomeOperationalStatus({ online: false, active: false, loading: false, onDiagnostics() {} });
  effects.forEach((fn) => fn());
  assert.equal(intervals.length, 0);

  effects.length = 0;
  HomeOperationalStatus({ online: true, active: false, loading: false, onDiagnostics() {} });
  effects.forEach((fn) => fn());
  assert.deepEqual(intervals, [1000]);
});

test("Stage 1-4 audit fixes keep recovery UI, scrollable dialogs, virtualized lists and sensitive cache exclusions", () => {
  const dialog = read("apps/driver/src/components/DriverConfirmationDialog.tsx");
  assert.match(dialog, /KeyboardAvoidingView/);
  assert.match(dialog, /Dialog\.ScrollArea/);
  assert.match(dialog, /ScrollView/);

  const otp = read("apps/driver/src/features/auth/screens/OtpVerifyScreen.tsx");
  assert.doesNotMatch(otp, /if\s*\(!phone\)\s*return null/);
  assert.match(otp, /Về màn đăng nhập/);

  const reg = read("apps/driver/src/features/auth/screens/RegisterScreen.tsx");
  assert.doesNotMatch(reg, /if\s*\(!user\)\s*return null/);
  assert.match(reg, /Về màn đăng nhập/);
  assert.doesNotMatch(reg, /Bước 1\/4/);

  const approval = read("apps/driver/src/features/auth/screens/ApprovalStatusScreen.tsx");
  assert.doesNotMatch(approval, /Bước 6\/7/);

  const home = read("apps/driver/src/features/offers/screens/HomeScreen.tsx");
  assert.match(home, /title:\s*"Chưa tải được điều kiện nhận chuyến",\s*action:\s*"Thử lại"/);
  const opStatus = read("apps/driver/src/features/offers/components/HomeOperationalStatus.tsx");
  assert.match(opStatus, /Loại xe nhận chuyến/);
  assert.match(opStatus, /onSelectVehicle/);

  const page = read("apps/driver/src/components/DriverPage.tsx");
  assert.match(page, /scroll = true/);
  assert.match(page, /behavior="padding"/);
  assert.match(page, /spacing\.formMaxWidth/);

  for (const rel of [
    "apps/driver/src/features/history/screens/HistoryScreen.tsx",
    "apps/driver/src/features/notifications/screens/NotificationsScreen.tsx",
    "apps/driver/src/features/profile/screens/DriverWalletScreen.tsx",
    "apps/driver/src/features/profile/screens/DriverWithdrawalScreen.tsx",
  ]) {
    const src = read(rel);
    assert.match(src, /scroll=\{false\}/, `${rel} must opt out of DriverPage ScrollView`);
    assert.match(src, /FlatList/, `${rel} must virtualize with FlatList`);
  }

  const photo = read("apps/driver/src/components/DriverPhoto.tsx");
  assert.match(photo, /from "expo-image"/);
  assert.match(photo, /sensitive \? "none" : "memory-disk"/);

  const verification = read("apps/driver/src/features/verification/VerificationScreen.tsx");
  assert.match(verification, /<DriverPhoto[^>]*sensitive/);

  const guided = read("apps/driver/src/features/verification/GuidedCaptureScreen.tsx");
  assert.match(guided, /from 'expo-image'/);
  assert.match(guided, /cachePolicy="none"/);
});

test("Stage 1 critique fixes: clean avatar initials, online vehicle badge, and separated skip action", () => {
  const { getAvatarInitials, getCleanDisplayName } = loadTs("packages/shared/src/utils/avatar.ts", {});
  assert.equal(getCleanDisplayName("B00DCCN000 - Tài Xế Kiểm Thử A (synthetic)"), "Tài Xế Kiểm Thử A");
  assert.equal(getAvatarInitials("B00DCCN000 - Tài Xế Kiểm Thử A (synthetic)"), "TA");
  assert.equal(getAvatarInitials("(test)"), "TX");

  const home = read("apps/driver/src/features/offers/screens/HomeScreen.tsx");
  assert.match(home, /onlineVehicle=\{activeOnlineVehicle\}/);

  const accept = read("apps/driver/src/features/offers/screens/AcceptScreen.tsx");
  const actions = read("apps/driver/src/features/offers/components/OfferActions.tsx");
  const decision = read("apps/driver/src/features/offers/components/OfferDecision.tsx");
  assert.match(accept, /sheetTopBar/);
  assert.match(accept, /Bỏ qua yêu cầu/);
  assert.doesNotMatch(actions, /Bỏ qua/);
  assert.match(decision, /paymentMethod === 'CASH'/);
  assert.match(decision, /paymentMethod === 'WALLET'/);
});

test("Stage 2 critique fixes: InProgress GroupedList, RideCustomerCard horizontal actions, and Complete receipt", () => {
  const customerCard = read("apps/driver/src/features/ride/components/RideCustomerCard.tsx");
  assert.match(customerCard, /DriverChatButton/);
  assert.match(customerCard, /label=\{i18nT\("Gọi khách"\)\}/);
  assert.match(customerCard, /flexDirection:\s*"row"/);

  const inProgress = read("apps/driver/src/features/ride/screens/InProgressScreen.tsx");
  assert.match(inProgress, /<GroupedList title="Thao tác chuyến đi">/);
  assert.match(inProgress, /title="Hủy chuyến"/);
  assert.match(inProgress, /accessibilityLabel="An toàn chuyến đi"/);

  const complete = read("apps/driver/src/features/ride/screens/CompleteScreen.tsx");
  assert.match(complete, /Biên lai chuyến #/);
  assert.match(complete, /ReceiptRow/);
});

test("Stage 3 critique fixes: unified Support/Ticket shell and non-auto-sending driver chat quick replies", () => {
  const ticketListScreen = read("apps/driver/src/features/tickets/screens/TicketListScreen.tsx");
  const createTicketScreen = read("apps/driver/src/features/tickets/screens/CreateTicketScreen.tsx");
  assert.match(ticketListScreen, /<DriverPage[^>]*scroll=\{false\}[^>]*backFallback="\/support"/);
  assert.match(createTicketScreen, /<DriverPage[^>]*backFallback="\/tickets"/);

  const ticketListUi = read("packages/ui/src/tickets/TicketList.tsx");
  assert.doesNotMatch(ticketListUi, /fabIcon/);
  assert.match(ticketListUi, /s\.footer/);

  const chatUi = read("packages/ui/src/chat/ChatConversation.tsx");
  assert.match(chatUi, /quickReplies\?\.length/);
  assert.match(chatUi, /onPress=\{\(\) => onDraftChange\(reply\)\}/);

  const driverChat = read("apps/driver/src/features/chat/screens/DriverChatScreen.tsx");
  assert.match(driverChat, /DRIVER_QUICK_REPLIES/);
  assert.match(driverChat, /quickReplies=\{DRIVER_QUICK_REPLIES\}/);
});

test("Stage 4 critique fixes: compact filters, wallet presets/hierarchy, and non-auto-submit topup/withdraw", () => {
  const walletUi = read("packages/ui/src/wallet/WalletComponents.tsx");
  assert.match(walletUi, /PRESET_AMOUNTS = \[50_000, 100_000, 200_000, 500_000\]/);
  assert.match(walletUi, /onPress=\{\(\) => setAmount\(String\(maxWithdrawable\)\)\}/);
  assert.match(walletUi, /onPress=\{\(\) => setAmount\(String\(validSuggested\)\)\}/);

  const history = read("apps/driver/src/features/history/screens/HistoryScreen.tsx");
  assert.match(history, /statusFilters\.map/);
  assert.match(history, /7 ngày gần nhất/);

  const notifs = read("apps/driver/src/features/notifications/screens/NotificationsScreen.tsx");
  assert.match(notifs, /Đánh dấu đã đọc hết/);
  assert.match(notifs, /styles\.toolbar/);
});

test("Stage 5 critique fixes: consistent design tokens across verification, capabilities, ride and profile", () => {
  const verification = read("apps/driver/src/features/verification/VerificationScreen.tsx");
  assert.match(verification, /headerAction=/);
  assert.match(verification, /<GroupedList title="Tra cứu hồ sơ">/);
  assert.doesNotMatch(verification, /label="Làm mới trạng thái"/);

  const capabilities = read("apps/driver/src/features/verification/CapabilitiesScreen.tsx");
  assert.match(capabilities, /<GroupedList title="Nhóm xe đã xét duyệt">/);
  assert.match(capabilities, /headerAction=/);

  const inspection = read("apps/driver/src/features/ride/screens/VehicleInspectionScreen.tsx");
  assert.doesNotMatch(inspection, /mode="outlined"/);
  assert.match(inspection, /mode="flat"/);

  const directions = read("apps/driver/src/features/ride/screens/RideDirectionsScreen.tsx");
  assert.match(directions, /typography\.screenTitle/);
  assert.match(directions, /name="navigation"/);
});
