# AGENTS.md — Quy chuẩn Monorepo PtitGo (`F:\datxe_rn`)

Tài liệu này là hiến chương dùng chung cho mọi agent làm việc trong monorepo **PtitGo** (`apps/customer`, `apps/driver`, `packages/ui`, `packages/shared`, `packages/config`).

## 1. Tài liệu sản phẩm & Design System bắt buộc đọc trước khi thiết kế/sửa UI

- Định vị sản phẩm hệ sinh thái: [PRODUCT.md](PRODUCT.md)
- Định vị riêng app Khách hàng: [apps/customer/PRODUCT.md](apps/customer/PRODUCT.md)
- Định vị riêng app Tài xế: [apps/driver/PRODUCT.md](apps/driver/PRODUCT.md)
- Design System dùng chung: [DESIGN.md](DESIGN.md) (sidecar token tại `.impeccable/design.json`)
- Quy chuẩn Expo SDK 58 riêng từng app (giữ nguyên và luôn tuân thủ khi đụng vào Expo/RN API):
  - [apps/customer/AGENTS.md](apps/customer/AGENTS.md)
  - [apps/driver/AGENTS.md](apps/driver/AGENTS.md)

## 2. Một Design System duy nhất (`@datxe/ui`)

1. **Không tạo design system song song hoặc trùng lặp:** Mọi màn hình trong `apps/customer` và `apps/driver` buộc phải dùng chung token từ `packages/ui/src/theme/` (`useThemeColors()`, `useThemedStyles()`, `fontFamily`, `typography`, `spacing`, `borderRadius`) và các component chuẩn từ `@datxe/ui` (`Button`, `Card`, `Typography`, `Input`, `ThemedTextInput`, `ScreenWrapper`, `GroupedList`, `SettingsListItem`, `TonalNavigationBar`, `MotionPressable`, `MapSheetLayout`).
2. **Cấm màu cứng (raw hex / rgb / rgba):** Không viết màu cứng trong `apps/*/src/**` hoặc component UI ngoài `packages/ui/src/theme/` (`tests/theme.test.cjs` kiểm tra tự động). Luôn dùng semantic role tokens để hoạt động chuẩn cả Light và Dark Mode.
3. **Phẳng theo mặc định, phân tầng bằng sắc độ (tonal layering):** Cấm `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`, `boxShadow` và `Card mode="elevated"` (ngoại lệ duy nhất đang được duyệt nằm ở `apps/customer/src/features/booking/components/homeStyles.ts`, được khóa chặt trong `tests/material-design.test.cjs`).
4. **Không viền trang trí:** Nút, badge, card dùng `borderlessFrame` (`borderWidth: 0`). Chỉ dùng `borderWidth > 0` ở các trường nhập liệu/chỉ dẫn chức năng nằm trong danh sách `functionalOutlines` của `tests/material-design.test.cjs`.
5. **Tách biệt sắc thái hai app qua `brand`:** `customer` dùng Coral Crimson (`#B3263D` / `#FFB2BF` dark); `driver` dùng Deep Emerald (`#007F46` / `#7ED9AA` dark) và `offerPalette` nền tối cho màn nhận cuốc khẩn cấp.

## 3. Quy chuẩn UI/UX (Material Design 3 · Apple HIG · WCAG 2.2 AA)

Mục tiêu hoàn thiện ở mức production như Grab, Uber và Gojek nhưng giữ đúng bản sắc phẳng, rõ và trung thực của PtitGo — **không sao chép máy móc**.

- **Tương phản WCAG 2.2 AA:** Chữ nội dung và trạng thái thành công đạt tối thiểu **4.5:1**; chữ lớn, nhãn nút nhấn và icon chức năng đạt tối thiểu **3.0:1** trên cả Light và Dark Mode. Tuyệt đối không đặt icon/chữ trắng trên nền vàng `rideDropoff` (`#F2B705`, phải dùng `onRideDropoff` `#1B1B1F`) và không dùng màu `warningContainer` làm màu chữ trên nền tối.
- **Vùng chạm an toàn:** Tối thiểu **48×48 dp** trên Android và **44×44 pt** trên iOS cho mọi thành phần nhấn được (bao gồm các hàng chọn điểm đón/đến, nút hoán đổi lộ trình, nút đóng/lọc/xóa), giữ khoảng cách tối thiểu `8dp` giữa các nút cạnh nhau.
- **Typography & Phóng chữ hệ thống:** Mọi màn hình và component mới trong `apps/customer`, `apps/driver` và `packages/ui` **bắt buộc dùng các semantic typography tokens** từ `@datxe/ui` (`typography.display`, `moneyDisplay`, `screenTitle`, `sectionTitle`, `cardTitle`, `body`, `bodySecondary`, `label`, `button`, `badge`, `navigationLabel`, `caption` hoặc `<Typography variant="...">`). Cấm viết cứng `fontSize`, `lineHeight`, `fontFamily`, `maxFontSizeMultiplier`, `allowFontScaling={false}` hoặc `adjustsFontSizeToFit` ngoài `packages/ui/src/theme/`; không dùng `fontWeight: "800"` hoặc chia 2 hệ thống typography. Tôn trọng hoàn toàn `fontScale` hệ thống (kiểm chứng tới `2.0`), không cắt/nén email hay địa chỉ ngõ/ngách Việt Nam, và luôn dùng `fontVariant: ['tabular-nums']` (hoặc `moneyDisplay`) cho số tiền VND, số dư ví, khoảng cách và đồng hồ đếm ngược.
- **Safe Area, Bàn phím & Điều hướng gốc:** Mọi màn đều phải nằm gọn trong safe area (`ScreenWrapper`, `useSafeAreaInsets`), không che dưới status bar, notch, Dynamic Island hay thanh điều hướng/gesture home bar; luôn giữ cử chỉ vuốt quay lại (iOS edge-swipe) và nút Back hệ thống (Android); form/sheet dài phải cuộn được và giữ nút CTA khả dụng khi mở bàn phím ảo.
- **Đủ 5 trạng thái UI rõ nghĩa (`loading`, `empty`, `error`, `success`, `disabled`):**
  - *Loading:* Giữ tiêu đề & khung bố cục để người dùng biết màn nào đang tải.
  - *Empty:* Giải thích ngắn gọn + CTA điều hướng hợp ngữ cảnh.
  - *Error:* Giữ lại dữ liệu cũ nếu có, phân biệt lỗi mạng / thiếu quyền / thiếu dữ liệu với hành động thử lại cụ thể.
  - *Success:* Chỉ báo thành công khi đã có xác nhận thật từ máy chủ/thiết bị.
  - *Disabled:* Hiển thị trạng thái mờ rõ ràng (`dimWhenDisabled`) và luôn giải thích lý do khóa ngay cạnh CTA nếu là thao tác chính.
- **Chuyển động tự nhiên & Có mục đích:** Dùng `MotionPressable` và `useScreenMotion`; luôn tôn trọng `useReducedMotion()` (tắt thu phóng/chuyển cảnh nặng khi người dùng bật Giảm chuyển động).
- **Accessibility Semantics:** Mọi nút chỉ có icon, badge số (như tab Thông báo), công tắc và cảnh báo phải có `accessibilityLabel`, `accessibilityRole`, `accessibilityState` tiếng Việt tự nhiên.
- **Đặc thù từng app:**
  - *Driver:* Ưu tiên thao tác một tay (CTA chính ở vùng ngón cái dưới màn), đọc nhanh trong 3 giây (trạng thái sẵn sàng + blocker GPS đứng trước thống kê; nhận cuốc hiện đủ điểm đón/trả & thời hạn).
  - *Customer:* Giảm tối đa bước thao tác thừa (chọn 1 chạm điểm đã lưu có tọa độ; giữ ý định đặt lịch/đổi điểm đón chính xác; minh bạch thành phần giá backend trước khi bấm đặt).

## 4. Ràng buộc kiến trúc & Kiểm thử bắt buộc

1. **Ranh giới code (`scripts/check-architecture.cjs` & `packages/config/eslint.config.cjs`):**
   - File trong `apps/*/src/app/` chỉ được re-export màn hình/layout (`<= 10` dòng).
   - Các `features/*` không được import chéo nhau; `components/` và `lib/` không import ngược từ `features/`.
   - Không đọc `process.env.EXPO_PUBLIC_*` ngoài `config/env.ts`.
   - `packages/shared` tuyệt đối không chứa React hay UI (`@datxe/ui`, `.tsx`).
2. **Định danh & Bảo mật client:** Không chứa secret phía server trong app client; mọi `EXPO_PUBLIC_*` đều công khai trong bundle. Không tự ý thêm dependency khi chưa kiểm tra tương thích Expo SDK 58 (`npx expo install` khi cần).
3. **Lệnh kiểm chứng trước khi hoàn tất mọi tác vụ UI/Code:**
   - Từ thư mục gốc `F:\datxe_rn`: `npm run check` (chạy lần lượt `npm run check:architecture`, `npm run typecheck`, `npm run lint`, `npm test`).
   - Khi kiểm chứng giao diện Android trên máy thật/emulator: chụp cả Light/Dark mode và thử tăng cỡ chữ hệ thống (`font_scale 1.3`) trước khi kết luận đạt.

## 5. Điều phối UI/UX Skills & Thứ tự ưu tiên

Khi thực hiện các tác vụ thiết kế, triển khai, tối ưu hoặc đánh giá giao diện, agent phối hợp đúng vai trò từng skill đã cài đặt và tuân thủ nghiêm ngặt thứ tự ưu tiên bên dưới.

### Vai trò từng skill

- **`ui-ux-pro-max`:** Tư vấn UI/UX, trải nghiệm người dùng theo ngữ cảnh thực địa và cấu trúc design system.
- **`expo-native-ui`:** Triển khai giao diện React Native / Expo chuẩn cảm giác native (hệ điều khiển gốc, safe area, điều hướng, biểu tượng, danh sách).
- **`vercel-react-native-skills`:** Tối ưu hiệu năng render, danh sách cuộn, animation, bộ nhớ và kiến trúc phân tách component React Native / Expo.
- **`frontend-design`:** Cải thiện thẩm mỹ, phân cấp thị giác, nhịp chữ và bố cục màn hình.
- **`impeccable`:** Thực hiện `critique`, `audit`, `polish`, tinh chỉnh UX copy và kiểm tra chất lượng thiết kế theo ngữ cảnh `PRODUCT.md` / `DESIGN.md`.

### Thứ tự ưu tiên khi xử lý xung đột (từ cao xuống thấp)

1. **`PRODUCT.md` và yêu cầu nghiệp vụ của từng app** ([PRODUCT.md](PRODUCT.md), [apps/customer/PRODUCT.md](apps/customer/PRODUCT.md), [apps/driver/PRODUCT.md](apps/driver/PRODUCT.md)).
2. **`DESIGN.md` và design system trong `packages/ui`** ([DESIGN.md](DESIGN.md), `.impeccable/design.json`, `@datxe/ui`).
3. **Quy chuẩn nền tảng Android (Material Design 3) / iOS (Human Interface Guidelines)** và tiêu chí **WCAG 2.2 AA** tương ứng.
4. **Hướng dẫn từ các skills** (mọi đề xuất từ skill mâu thuẫn với tầng 1–3 đều phải bị loại bỏ hoặc điều chỉnh theo đúng chuẩn native của PtitGo).

### Nguyên tắc sử dụng

- **Đúng việc, đúng skill:** Chỉ nạp và áp dụng skill phù hợp với nhiệm vụ cụ thể (ví dụ: không gọi skill thẩm mỹ cho bài toán hiệu năng thuần túy, không áp lời khuyên CSS/web máy móc cho màn hình React Native).
- **Cấm vượt quyền phạm vi:** Không tự ý thay đổi design system dùng chung (`DESIGN.md`, token màu/kiểu chữ trong `packages/ui/src/theme/`), không tự ý cài thêm dependencies và không thay đổi luồng nghiệp vụ, API hay hợp đồng dữ liệu khi chưa có yêu cầu rõ ràng của người dùng.

## 6. Quy chuẩn kỹ thuật chống tái lỗi (`apps/customer`, `apps/driver`, `@datxe/ui`)

1. **Keyboard Handling Android/iOS:** Mọi `KeyboardAvoidingView` ở màn hình có form hoặc `Modal` phải dùng `behavior="padding"` (không đặt `undefined` trên Android) kết hợp `ScrollView keyboardShouldPersistTaps="handled"` để Gboard không che ô nhập hoặc nút CTA.
2. **Safe Area & Tab Bar khi phóng chữ (`font_scale 1.3`):**
   - `RootLayout` luôn bọc `<SafeAreaProvider initialMetrics={initialWindowMetrics}>` và `ScreenWrapper` tự cộng fallback `StatusBar.currentHeight` trên Android khi `insets.top === 0` ở frame mount đầu tiên.
   - `TonalNavigationBar` không dùng `overflow: "hidden"` + `borderRadius: 999` trên ô tab hoặc indicator bọc badge, để badge số lượng lớn và nhãn 2 dòng không bị cắt ở cỡ chữ lớn.
3. **Vòng đời chuyến & Biên bản Khách hàng (`customerRidePresentation.ts`):**
   - Toàn bộ trạng thái bàn giao (`not_submitted`, `pending_confirmation`, `stale_revision`, `correction_requested`, `confirmed`) phải đi qua `customerRidePresentation.ts`; tuyệt đối không mở CTA xác nhận khi đã gửi `correctionReason` hoặc khi `report.revision` đã tăng so với phiên bản khách đang xem.
   - Sau khi đặt chuyến thành công, phải xóa stack đặt chuyến (`resetToRideScreen`) và lưu `lastBookedDraft` (không bao giờ lưu hoặc tái sử dụng `routeQuoteId` cũ khi thử tìm lại ở `NO_DRIVER_FOUND`).
4. **Danh sách dài & Ảnh nhạy cảm:** Dùng `FlatList` (với JSX element ổn định cho `ListHeaderComponent` khi có `TextInput`) thay cho `.map()` trong `ScrollView`; ảnh hồ sơ/xe/bàn giao chỉ dùng `expo-image` với `cachePolicy="memory"`.
5. **Khôi phục phiên (`SessionGate`) & Bản đồ Dark Mode:** Không đăng xuất hoặc điều hướng về Login khi gặp `NETWORK_ERROR` / `HTTP_5xx` — luôn hiển thị nút `Thử lại`. `GoongMap` phải đặt nền placeholder `colors.background` phủ toàn vùng trước khi map ready và hiển thị marker định hướng hình học tối giản.
6. **Chống cắt chữ & Thích ứng hiển thị:** Không được cắt chữ của trạng thái nghiệp vụ, số tiền và các thông tin quan trọng. Component phải thích ứng với nội dung dài, màn hình nhỏ và font scaling. Mọi hàng nhãn-giá trị và nút chọn lọc phải ưu tiên dùng chung `MoneyText`, `SharedStatusBadge`, `FilterChip` và `KeyValueRow` từ `@datxe/ui`.
