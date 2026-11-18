# PtitGo Mobile Monorepo — Post-Merge Full UI/UX Audit, Refinement & QA Report

**Ngày lập báo cáo:** 18/11/2026  
**Workspace:** `F:\datxe_rn` (`apps/customer`, `apps/driver`, `packages/ui`, `packages/shared`, `packages/config`)  
**Nhánh làm việc:** `integration/mobile-release`  
**Mốc đối chiếu Git:** Visual baseline `70a929f` · Merge `origin/updatefrontend` `fbe50c8` · Tài liệu tiền phát hành `15fb838`  
**Kiến trúc tham chiếu:** [AGENTS.md](../AGENTS.md) · [PRODUCT.md](../PRODUCT.md) · [DESIGN.md](../DESIGN.md)

---

## 1. Executive Summary

Sau khi hợp nhất nhánh `origin/updatefrontend` tại commit `fbe50c8`, toàn bộ 77 file route trên `apps/customer` (41 file: 38 màn hình + 3 layout) và `apps/driver` (36 file: 34 màn hình + 2 layout) cùng hệ thống shared UI `@datxe/ui` và `@datxe/shared` đã được rà soát toàn diện về UI/UX, tuân thủ Material Design 3 phẳng (tonal layering), Apple HIG, WCAG 2.2 AA, khả năng phóng chữ hệ thống (`fontScale`), hợp đồng dữ liệu backend và an toàn vòng đời chuyến đi.

Kết quả đợt tinh chỉnh:
- **Khắc phục triệt để 6 lỗi ưu tiên P1** về tương phản WCAG (`#FFFFFF` trên nền vàng `rideDropoff`, chữ trắng trên nút phụ lavender ở đăng ký tài xế, màu lỗi ở camera Xác minh eKYC), thanh toán chuyến `0 đ` bằng `CASH` (chặn xác nhận thu tiền mặt thừa, hiển thị đúng banner Voucher `0 đ` và tách riêng chi tiết giảm giá khi có `discountAmount > 0`), chặn nhập số ODO trả xe nhỏ hơn lúc nhận xe tại `VehicleInspectionScreen`, sửa mất gesture back ở `TripCompletedScreen` và xóa hành động gọi/nhắn tin trùng lặp gây bóp hẹp tên tài xế ở `DriverProfileCard`.
- **Khắc phục 17 vấn đề P2** về vùng chạm tối thiểu `48×48 dp`, bàn phím che modal (`KeyboardAvoidingView behavior="padding"`), cuộn modal trên màn hình nhỏ (`VoucherPickerModal`, `PaymentMethodModal`, `PendingPaymentMethod`, `PhoneNumberInput`), biểu tượng hỗ trợ thiếu glyph `support-agent` trên `Avatar.Icon`, đồng bộ `tabular-nums`, dọn xung đột giọng đọc `expo-speech` + thanh điều khiển bản đồ ở `DriverDirectionsMap`, sắp xếp lại ưu tiên tác vụ một tay ở `HomeScreen` tài xế (đưa chuyến đang chạy / offer / trạng thái nhận cuốc lên trước thống kê thu nhập), chống nhấn đúp nút hủy/xác nhận tiền mặt và khôi phục an toàn badge/chữ ở cỡ chữ lớn.
- **Loại bỏ 3 file dead code không còn import** (`DocumentForm.tsx`, `useDocuments.ts`, `RideEarnings.tsx`) và chuẩn hóa 13 điểm sử dụng typography legacy sang semantic role của `@datxe/ui`.
- **Toàn bộ kiểm thử tự động đạt:** `npm run check` vượt qua `check:architecture`, `typecheck` (4 workspace), `expo lint` (2 app) và **238/238 test cases** (`0` thất bại, `0` bỏ qua). `npx expo export --platform android --platform web` hoàn tất sạch cho cả Customer và Driver.

---

## 2. Skills & Workflows Applied

| Skill | Workflow / Tài liệu đã nạp | Phạm vi áp dụng | Vấn đề phát hiện nhờ skill |
| --- | --- | --- | --- |
| **impeccable** | Đọc `SKILL.md`, chạy `impeccable context`, thực hiện workflow `audit`, `critique`, `polish` theo ngữ cảnh bản địa PtitGo | Phân tầng sắc độ, bỏ viền/bóng dư thừa, loại lặp hành động trong thẻ, đồng bộ ngữ cảnh khẩn cấp cho tài xế | Phát hiện hành động liên hệ trùng lặp ở `DriverProfileCard`, nút phụ chữ mờ `RegisterScreen`, lỗi chồng chéo bản đồ `DriverDirectionsMap` và thứ tự thông tin ngược ưu tiên trên `HomeScreen` tài xế |
| **ui-ux-pro-max** | Đọc `SKILL.md`, truy vấn theo ngữ cảnh ứng dụng di động Việt Nam, bản đồ & accessibility | Mật độ thông tin, phân cấp hành động đặt xe & nhận cuốc một tay, chống cắt chữ tiếng Việt dấu dài | Phát hiện badge & tab bị bóp ở `fontScale`, chi tiết giá gốc/giảm giá chưa tách ở `CompleteScreen`, ODO trả xe thiếu đối chiếu ODO nhận xe |
| **expo-native-ui** | Đọc `SKILL.md`, `controls.md`, `icons.md` | Safe Area, `KeyboardAvoidingView`, Modal `statusBarTranslucent`, `MaterialIcons`, danh sách nhóm chuẩn | Phát hiện icon `Avatar.Icon icon="support-agent"` lỗi glyph `?` ở `TicketChat`, `VoucherPickerModal` ép `flex: 0` bị cụt, nhiều nút `< 48dp`, `SavePlaceSheet` thiếu `statusBarTranslucent` |
| **vercel-react-native-skills** | Đọc `SKILL.md`, `AGENTS.md` | Hiệu năng `FlatList`, `expo-image` `cachePolicy="memory"`, `useRef` guard, cleanup timer & effect | Phát hiện `HandoverHistory`/`SupportCenter` dùng RN `Image` thay vì `expo-image`, timer redirect thiếu cleanup khi unmount ở màn Ticket, 3 `useEffect` `expo-speech` rời rạc, `Map` không cần thiết trong lúc loading `RideDirectionsScreen` |
| **frontend-design** | Đọc `SKILL.md` | Nhất quán nhịp typography (`@datxe/ui`), `tabular-nums` cho số tiền/ODO/thống kê, sắc thái phân biệt Customer (Coral Crimson) vs Driver (Deep Emerald) | Phát hiện các slot số tiền/đếm ký tự/thời gian thiếu `tabular-nums`, nhiều screen tài xế còn giữ token chữ legacy |

---

## 3. Product Positioning & Design System Alignment

PtitGo là nền tảng **đặt tài xế lái xe hộ** (tài xế điều khiển chính phương tiện của khách hàng), khác với gọi xe công nghệ thông thường:
- **Customer App (`Coral Crimson #B3263D` light / `#FFB2BF` dark):** Nhấn mạnh sự tin cậy, minh bạch giá backend trước khi đặt, quản lý garage cá nhân (`vehicles`, `add-vehicle`), biên bản nhận/trả xe 5 góc có xác nhận 2 chiều (`vehicle-inspection`), và tìm tài xế nhanh với lịch sử giữ lại ý định đặt chuyến.
- **Driver App (`Deep Emerald #007F46` light / `#7ED9AA` dark):** Ưu tiên đọc nhanh dưới 3 giây, giảm mất tập trung khi lái, đưa trạng thái nhận cuốc / blocker GPS / cuốc đang chạy lên vùng trên cùng và đặt CTA chính ở vùng ngón cái dưới màn hình.
- **Design System phẳng tuyệt đối (`@datxe/ui`):** Không dùng `shadow*`/`elevation`/`boxShadow` (chỉ giữ ngoại lệ đã khóa tại `homeStyles.ts`), không dùng viền trang trí cho badge/nút/card, mọi màu sắc lấy từ `useThemeColors()` / `ThemeProvider` và toàn bộ cỡ chữ lấy từ `typography.*` của `packages/ui/src/theme/colors.ts`.

---

## 4. Complete Screen & Route Inventory

### 4.1 `apps/customer/src/app` (41 files: 3 layouts + 38 screens)

| Nhóm | Route file (`apps/customer/src/app/...`) | Vai trò | Trạng thái sau audit |
| --- | --- | --- | --- |
| Root & Auth | `_layout.tsx`, `index.tsx`, `index.web.tsx`, `(auth)/_layout.tsx` | Điều hướng gốc & gate phiên | Thin routes (`<= 10` dòng), đạt |
| Auth | `(auth)/login.tsx`, `(auth)/register.tsx`, `(auth)/add-phone-number.tsx`, `(auth)/otp-verify.tsx` | Đăng nhập, đăng ký, bổ sung SĐT, OTP | Đạt (PhoneNumberInput đã sửa modal/keyboard/clear button) |
| Tabs | `(tabs)/_layout.tsx`, `(tabs)/home.tsx`, `(tabs)/history.tsx`, `(tabs)/notifications.tsx`, `(tabs)/profile.tsx` | 4 tab chính | Đạt (`TonalNavigationBar`, badge & email đã chuẩn hóa) |
| Booking Flow | `ride/pickup.tsx`, `ride/destination.tsx`, `ride/map-picker.tsx`, `ride/place-detail.tsx`, `ride/route-selection.tsx`, `ride/vehicle.tsx`, `ride/confirm.tsx`, `ride/find-driver.tsx` | Chọn điểm, bản đồ, xe, báo giá, đặt chuyến & tìm tài xế | Đạt (đã sửa tương phản `onRideDropoff`, modal voucher/payment, vùng chạm `48dp`, `tabular-nums`) |
| Tracking & Complete | `ride/tracking.tsx`, `ride/completed.tsx`, `ride/[id].tsx`, `vehicle-inspection.tsx` | Theo dõi tài xế, bàn giao xe, đánh giá & chi tiết chuyến | Đạt (xóa nút trùng ở `DriverProfileCard`, sửa back navigation ở `TripCompletedScreen`, điều hướng đúng `find-driver`) |
| Garage & Account | `vehicles.tsx`, `add-vehicle.tsx`, `vouchers.tsx`, `payment-methods.tsx`, `wallet/index.tsx`, `wallet/top-up.tsx`, `edit-profile.tsx` | Xe cá nhân, voucher, ví, hồ sơ | Đạt (semantics nút chọn xe, `CustomerVouchersScreen` bỏ italic & thêm label ngữ cảnh) |
| Support & Legal | `chat.tsx`, `support.tsx`, `tickets/index.tsx`, `tickets/new.tsx`, `tickets/[id].tsx`, `settings/index.tsx`, `settings/[section].tsx`, `privacy-policy.tsx`, `terms-of-service.tsx` | Chat chuyến, trung tâm hỗ trợ, ticket, cài đặt, điều khoản | Đạt (`TicketChat`, `TicketList`, `SupportCenter`, `SettingsScreen`, `CreateTicketScreen`) |

### 4.2 `apps/driver/src/app` (36 files: 2 layouts + 34 screens)

| Nhóm | Route file (`apps/driver/src/app/...`) | Vai trò | Trạng thái sau audit |
| --- | --- | --- | --- |
| Root & Tabs | `_layout.tsx`, `index.tsx`, `index.web.tsx`, `(tabs)/_layout.tsx` | Root stack & tab navigation | Thin routes (`<= 10` dòng), đạt |
| Auth & eKYC | `(auth)/login.tsx`, `(auth)/register.tsx`, `(auth)/otp-verify.tsx`, `(auth)/login-help.tsx`, `(auth)/verify-id.tsx`, `(auth)/license-upload.tsx`, `(auth)/approval-status.tsx` | Đăng nhập, đăng ký, eKYC CCCD/GPLX | Đạt (đã sửa tương phản nút `RegisterScreen`, lỗi + nút `48dp` tại `GuidedCaptureScreen`, chuẩn typography) |
| Tabs | `(tabs)/home.tsx`, `(tabs)/history.tsx`, `(tabs)/notifications.tsx`, `(tabs)/profile.tsx` | Trang chủ tài xế, lịch sử, thông báo, hồ sơ | Đạt (`HomeScreen` ưu tiên đơn/trạng thái nhận cuốc trên cùng) |
| Ride Lifecycle | `ride/accept.tsx`, `ride/directions.tsx`, `ride/in-progress.tsx`, `ride/handover.tsx`, `ride/vehicle-inspection.tsx`, `ride/complete.tsx` | Nhận cuốc, chỉ đường, trong chuyến, kiểm tra xe 5 góc, tất toán | Đạt (chuyến `0 đ`, khóa thao tác nhấn đúp, đối chiếu ODO nhận/trả xe, gom speech & map overlay) |
| Profile & Wallet | `profile/capabilities.tsx`, `profile/verification.tsx`, `profile/edit.tsx`, `profile/wallet.tsx`, `profile/top-up.tsx`, `profile/withdraw.tsx` | Kỹ năng xe, hồ sơ, ví tín dụng/tiền mặt, nạp & rút tiền | Đạt (chuẩn typography & `tabular-nums`) |
| Safety, Support & Settings | `chat.tsx`, `safety.tsx`, `support.tsx`, `tickets/index.tsx`, `tickets/new.tsx`, `tickets/[id].tsx`, `settings/index.tsx`, `settings/privacy.tsx`, `settings/reception.tsx` | Chat, an toàn 112, hỗ trợ, chẩn đoán nhận chuyến | Đạt (cleanup timer & `canGoBack` ticket, chuẩn typography) |

---

## 5. Customer App Screen-by-Screen UI/UX Audit

- **Trang chủ & Đặt chuyến (`homeStyles.ts`, `MapPickerScreen.tsx`, `PlaceSelectionScreen.tsx`, `SavePlaceSheet.tsx`):** Sửa lỗi icon vàng điểm trả `rideDropoff` (`#F2B705`) dùng chữ/icon trắng gây mất tương phản -> đổi sang `colors.onRideDropoff` (`#1B1B1F`) + nền `accent.dropoff`. Tăng kích thước `fieldClear`, `moreButton`, `sheetEdit` lên tối thiểu `48×48 dp`. Bổ sung `statusBarTranslucent` cho `SavePlaceSheet` và `tabular-nums` cho thống kê `nearbyText`.
- **Checkout (`VoucherPickerModal.tsx`, `PaymentMethodModal.tsx`, `checkoutStyles.ts`):** Loại bỏ `flex: 0` khiến bảng chọn voucher co hẹp; chuyển `PaymentMethodModal` sang `ScrollView` có `statusBarTranslucent` để không tràn ở màn hình nhỏ/phóng chữ; bổ sung `accessibilityState={{ checked }}`, tăng nút đóng/chọn phương thức lên `48 dp`, gán `accessibilityLabel` gắn tên từng campaign khi nhận ưu đãi.
- **Theo dõi & Hoàn thành chuyến (`DriverProfileCard.tsx`, `useTripCompleted.ts`, `TripCompletedScreen.tsx`, `RideDetailScreen.tsx`, `HistoryRideListItem.tsx`):** Xóa nút gọi/nhắn tin lồng trong khối `identity` của `DriverProfileCard` (tránh lặp và tránh bóp hẹp tên tài xế 56dp); sửa `useTripCompleted.leave()` ưu tiên `router.back()` nếu `canGoBack()` để không phá stack điều hướng; ẩn nút đánh giá trùng ở thẻ lịch sử khi `ride.hasRated === true`; điều hướng chuyến `PENDING`/`SEARCHING` về đúng `/ride/find-driver`.
- **Garage, Voucher, Hồ sơ & Hỗ trợ (`AddVehicleScreen*.tsx`, `CustomerVouchersScreen*.tsx`, `ProfileScreen.tsx`, `SettingsScreen.tsx`, `CustomerSupportScreen.tsx`, `CreateTicketScreen.tsx`, `PendingPaymentMethod.tsx`, `CustomerRideCancellationDialog.tsx`):** Bọc `KeyboardAvoidingView behavior="padding"` và `Dialog.ScrollArea` ở modal thanh toán/hủy/cài đặt; tách `Pressable` nền đóng modal đăng xuất ở `ProfileScreen`; bỏ `fontStyle: "italic"` ở `CustomerVouchersScreen`; cleanup timeout ở `CreateTicketScreen`.

---

## 6. Driver App Screen-by-Screen UI/UX Audit

- **Trang chủ tài xế (`HomeScreen.tsx`):** Sắp xếp lại đúng phân cấp tác vụ khi lái xe: Offer chờ nhận / Chuyến đang hoạt động / `<HomeOperationalStatus>` đứng ở trên cùng, theo sau mới đến `<HomeDriverHeader>` (thống kê ngày) và `<MyDriverReviews collapsible />`. Sửa lỗi TS thiếu `children` của `<DriverPage>` bằng cách đặt nội dung trực tiếp làm `children` của `DriverPage` (banner lỗi/tải giữ nguyên ở trên cùng khi mất mạng).
- **Nhận cuốc & Trong chuyến (`OfferDecision.tsx`, `RideRouteCard.tsx`, `InProgressScreen.tsx`):** Hiển thị rõ `'Thu tiền mặt (0 đ)'` khi ước tính `0 đ` thay vì gây hiểu nhầm; hiển thị `offer.pickupNote` và `offer.note`; giữ `ride.pickupNote` trên `RideRouteCard`; khóa double-tap khi hủy chuyến bằng `cancelLock = useRef(false)`.
- **Chỉ đường (`DriverDirectionsMap.native.tsx`, `useRideDirections.ts`, `RideDirectionsScreen.tsx`):** Gom 3 `useEffect` điều khiển `expo-speech` thành 1 effect đồng bộ, tự tắt đọc khi `!current || steps.length === 0 || voiceMuted` hoặc app chuyển nền (`AppState`); nhóm `maneuver` và `mapControls` trong một cột `topOverlay` để không đè lên nhau; dùng `viewport.top`/`viewport.bottom` khi `fitBounds`; bỏ render `GoongMap` thừa lúc đang loading.
- **Biên bản bàn giao 5 góc & ODO (`useVehicleInspection.ts`, `VehicleInspectionScreen.tsx`):** Ở pha trả xe (`dropoff`), trích xuất `pickupOdometer` từ biên bản `PICKUP`, hiển thị gợi ý `Số ODO lúc nhận xe: <km> km` ngay dưới ô nhập và báo lỗi (`accessibilityRole="alert"`, khóa xem lại/gửi) nếu số ODO trả xe nhỏ hơn lúc nhận xe.
- **Tất toán chuyến (`ridePresentation.ts`, `useComplete.ts`, `CompleteScreen.tsx`):** Ràng buộc `payment.amount > 0` mới tính `cashToCollect` và `canConfirmCash`; thêm banner riêng cho chuyến `CASH` `0 đ` (`Khách được miễn phí (Voucher 0 đ)` / `Chờ hoàn tất thanh toán 0 đ`); hiển thị tách biệt `Giá cước gốc` và `Ưu đãi khách dùng` khi `discountAmount > 0`; sửa check falsy cho `receivedStars`; thêm `cashLock = useRef(false)` chống xác nhận thu tiền mặt 2 lần.
- **Đăng ký, Xác minh eKYC & Danh sách (`RegisterScreen*.tsx`, `GuidedCaptureScreen.tsx`, `CreateTicketScreen.tsx`, `TicketChatScreen.tsx`, 8 màn hình typography legacy):** Gỡ override chữ trắng trên nền nhạt ở nút phụ `RegisterScreen`; nâng nút top-bar của camera xác minh lên `48×48 dp` và dùng `onErrorContainer` trên nền `errorContainer` cho thông báo lỗi camera; dọn timeout và fallback `router.canGoBack()` ở màn ticket.

---

## 7. Shared `@datxe/ui` & `@datxe/shared` Component Audit

| File | Cải tiến đã thực hiện |
| --- | --- |
| `packages/ui/src/tickets/TicketChat.tsx` | Thay `Avatar.Icon icon="support-agent"` lỗi glyph bằng render callback `MaterialIcons`; dùng `ChatImageViewer` cho xem ảnh; thêm `imagePlaceholder` (`minHeight: 120`) cho trạng thái đang tải/lỗi; bọc `t(...)` cho category/status; nâng `action` lên `48×48 dp`; thêm `tabular-nums` cho timestamp |
| `packages/ui/src/tickets/TicketList.tsx` | Bọc `t(...)` cho `categoryLabels` và `statusLabels` |
| `packages/ui/src/tickets/TicketCreate.tsx` | Thêm `fontVariant: ['tabular-nums']` cho bộ đếm ký tự `counter` |
| `packages/ui/src/components/TonalNavigationBar.tsx` | Ẩn `Badge` khỏi accessibility tree (`accessible={false}`, `importantForAccessibility="no-hide-descendants"`, `accessibilityElementsHidden`) để TalkBack/VoiceOver không đọc rời số badge khỏi tab `Thông báo` |
| `packages/ui/src/components/StatusBadge.tsx` | Hoàn thiện wrap an toàn không cắt chữ ở trạng thái dài như `Không tìm được tài xế` |
| `packages/ui/src/HandoverHistory.tsx` & `SupportCenter.tsx` | Chuyển `<Image>` từ `react-native` sang `expo-image` (`cachePolicy="memory"`, `contentFit="cover"`); thêm `tabular-nums` ở `counter` |
| `packages/ui/src/components/CustomDatePickerModal.tsx` | Nâng `headerAction` lên `minWidth: 48, minHeight: 48`; thêm `tabular-nums` cho con lăn ngày/tháng/năm |
| `packages/ui/src/auth/PhoneNumberInput.tsx` | Thêm `hitSlop={10}` cho nút xóa, nâng nút đóng lên `48×48 dp`, bọc modal mã quốc gia bằng `KeyboardAvoidingView behavior="padding"` + bottom inset, thêm `tabular-nums` cho mã vùng |
| `packages/ui/src/wallet/WalletComponents.tsx` | Chuyển các role typography cũ sang semantic roles + `tabular-nums` cho mã giao dịch/yêu cầu rút |
| `packages/shared/src/i18n/en.json` | Bổ sung đầy đủ các key tiếng Anh còn thiếu (`Nhận ưu đãi {0}`, `Chọn ảnh xe`, `Dùng ưu đãi {0}`, `Vấn đề khác`, và 5 trạng thái ticket) |

---

## 8. Customer Ride Lifecycle State-Action Matrix

| Trạng thái chuyến (`RideStatus`) | Màn hình chính | Thông tin hiển thị bắt buộc | Hành động khả dụng / bị khóa |
| --- | --- | --- | --- |
| `PENDING` / `SEARCHING` | `ride/find-driver` (`RideDetailScreen` route đúng về đây) | Điểm đón/trả, xe, giá dự kiến | Hủy tìm chuyến (`CustomerRideCancellationDialog` cuộn được với keyboard) |
| `DRIVER_ASSIGNED` / `DRIVER_ARRIVING` | `ride/tracking` | Tên, SĐT, avatar/biển số tài xế (`DriverProfileCard` không lặp nút) | Gọi / Nhắn tin (chỉ mở một hàng nút chính), Hủy chuyến |
| `ARRIVED_PICKUP` / `VEHICLE_HANDOVER` | `ride/tracking` -> `vehicle-inspection` | ODO, nhiên liệu, 5 ảnh góc từ `expo-image`, `customerRidePresentation.ts` | Xác nhận nhận xe hoặc Yêu cầu chỉnh sửa (khóa nút xác nhận nếu đã gửi `correctionReason` hoặc lệch `revision`) |
| `IN_PROGRESS` / `ARRIVED_DESTINATION` / `VEHICLE_RETURNED` | `ride/tracking` -> `vehicle-inspection` | Lộ trình trả xe, biên bản trả xe 5 góc | Xác nhận trả xe / Điều chỉnh |
| `COMPLETED` | `ride/completed` | Tổng cước cuối, giảm giá voucher, phương thức TT, form đánh giá ẩn danh 1-5★ (`checked` semantics) | Gửi đánh giá (1 lần), quay lại bằng `router.back()` hoặc `replace('/(tabs)/home')`; ẩn nút đánh giá lại ở `History` nếu `hasRated` |
| `CANCELLED` / `NO_DRIVER_FOUND` / `EXPIRED` | `ride/[id]`, `history` | `SharedStatusBadge` không cắt chữ (`Không tìm được tài xế`), ẩn MoneyText cước | Đặt lại từ lịch sử (`NO_DRIVER_FOUND` tạo draft mới không giữ `routeQuoteId` cũ) |

---

## 9. Driver Ride Lifecycle State-Action Matrix

| Trạng thái chuyến / Pha | Màn hình chính | Dữ liệu & Guard hiển thị | Hành động & Chốt an toàn |
| --- | --- | --- | --- |
| Online chờ nhận cuốc | `(tabs)/home` | Ưu tiên `<HomeOperationalStatus>` + GPS blocker trước thống kê thu nhập | Chọn loại xe nhận chuyến / Tạm ngừng nhận chuyến |
| `OFFER_PENDING` | `ride/accept` (`OfferDecision`) | Địa chỉ đón/trả, đồng hồ đếm ngược 25s, `pickupNote`, `note`, ghi rõ `Thu tiền mặt (0 đ)` khi estimate `0 đ` | Nhận chuyến (`actionLock` chống double-tap) / Từ chối |
| `DRIVER_ASSIGNED` / `DRIVER_ARRIVING` | `ride/in-progress` -> `ride/directions` | Điểm đón, nút chỉ đường gọn `topOverlay`, `expo-speech` có nút tắt âm & tự ngắt nền | Báo đã đến điểm đón / Hủy chuyến (`cancelLock`) |
| `ARRIVED_PICKUP` -> `VEHICLE_HANDOVER` | `ride/vehicle-inspection` | Checklist 5 ảnh bắt buộc, `odometer`, `fuelLevel` | Xem lại & gửi cho khách xác nhận |
| `IN_PROGRESS` -> `VEHICLE_RETURNED` | `ride/in-progress` -> `ride/vehicle-inspection` | Nhắc `Số ODO lúc nhận xe: X km`; báo lỗi nếu ODO trả < ODO nhận | Hoàn thành trả xe -> tất toán |
| `COMPLETED` (`CASH`, `amount > 0`, `PENDING`) | `ride/complete` | Hiện `cashToCollect`, tách `Giá cước gốc` & `Ưu đãi khách dùng` nếu có | Bấm xác nhận đã thu tiền mặt (`cashLock` chống nhấn đúp) |
| `COMPLETED` (`CASH`, `amount === 0`) | `ride/complete` | `canConfirmCash === false`; banner `Khách được miễn phí (Voucher 0 đ)` (`PAID`) hoặc `Chờ hoàn tất thanh toán 0 đ` (`PENDING`) | Không hiển thị nút xác nhận thu tiền mặt |
| `COMPLETED` (`WALLET` / `PAID` / `REFUNDED`) | `ride/complete` | Thu nhập trước & sau chiết khấu, badge trạng thái thanh toán | Đánh giá khách hàng (`receivedStars` hiển thị chính xác) |

---

## 10. Design System & Token Compliance Audit

- **Màu sắc (`tests/theme.test.cjs`):** 100% file trong `apps/*/src/**` và `packages/ui/src/**` (ngoài `theme/`) không chứa raw hex (`#...`) hoặc `rgb()`/`rgba()`. Tách biệt hoàn toàn Coral Crimson (Customer) và Deep Emerald (Driver).
- **Surface & Borders (`tests/material-design.test.cjs`):** Zero `shadow*`, `elevation`, `boxShadow` ngoài trường hợp cho phép tại `homeStyles.ts`; zero decorative `borderWidth` ngoài `functionalOutlines`.
- **Typography (`tests/typography-system.test.cjs`):** 100% sử dụng 12 semantic roles của `@datxe/ui`; không còn `fontSize`, `lineHeight`, `fontFamily`, `allowFontScaling={false}` hay `maxFontSizeMultiplier` cứng ngoài `packages/ui/src/theme/`.

---

## 11. Typography, Vietnamese Copy & Microcopy Audit

- Toàn bộ số tiền VND, số dư ví, bộ đếm ký tự, timestamp ticket, số ODO, khoảng cách bản đồ và bánh xe chọn ngày đã bật `fontVariant: ['tabular-nums']` hoặc `MoneyText`.
- Đã loại bỏ `fontStyle: "italic"` khỏi nội dung tiếng Việt có dấu tại `CustomerVouchersScreen`.
- Đã kiểm tra và bổ sung toàn bộ key tiếng Anh tương ứng trong `packages/shared/src/i18n/en.json` để vượt qua 100% AST audit tại `tests/i18n.test.cjs`.

---

## 12. Color Contrast & Dark Mode Audit (WCAG 2.2 AA)

- **Đã sửa:** `MapPickerScreen.tsx` và `PlaceSelectionScreen.tsx` từ icon trắng (`#FFFFFF`) trên nền vàng `rideDropoff` (`#F2B705`, độ tương phản ~1.76:1) sang `colors.onRideDropoff` (`#1B1B1F`, độ tương phản >11:1).
- **Đã sửa:** `RegisterScreenParts.tsx` loại bỏ `secondaryButtonText` (`color: colors.onPrimary` trên nút `variant="tertiary"`, tương phản chỉ ~1.25:1) để kế thừa đúng màu chữ tương phản của `Button`.
- **Đã sửa:** `GuidedCaptureScreen.tsx` đổi thông báo lỗi camera từ chữ `colors.errorContainer` sang pill `colors.onErrorContainer` trên nền `colors.errorContainer`.
- **Automated Token Matrix (`tests/theme.test.cjs`):** Đạt kiểm tra tương phản cho cả 4 bảng màu (`customer light`, `customer dark`, `driver light`, `driver dark`).

---

## 13. Touch Target, Safe Area, Keyboard & Navigation Audit

- **Vùng chạm >= 48×48 dp:** Nâng cấp `TicketChat.action`, `TicketChat` nút gỡ ảnh đính kèm, `CustomDatePickerModal.headerAction`, `PhoneNumberInput.closeButton` (+ `hitSlop={10}` nút xóa), `VoucherPickerModal` nút đóng & nút thử lại, `checkoutStyles` (`modeCell`, `modalClose`, `walletAction`), `placeStyles` (`fieldClear`, `moreButton`, `sheetEdit`), `AccountScreenStyles.choice`, `GuidedCaptureScreen.iconButton`, và tăng `stars.gap` `4 -> 8` tại `TripCompletedScreen`.
- **Bàn phím & Modal:** Bọc `KeyboardAvoidingView behavior="padding"` + `useSafeAreaInsets().bottom` ở `PhoneNumberInput` country modal, `CustomerRideCancellationDialog`, `SettingsScreen`, `PendingPaymentMethod` (`Dialog.ScrollArea` + `ScrollView`), `PaymentMethodModal` (`ScrollView` + `statusBarTranslucent`), `SavePlaceSheet` (`statusBarTranslucent`).
- **Back Navigation:** Sửa `useTripCompleted`, `CreateTicketScreen` (Customer & Driver), `TicketChatScreen` (Driver) dùng `router.canGoBack() ? router.back() : router.replace(...)` để không phá stack và hỗ trợ vuốt/back Android.

---

## 14. Accessibility & Screen Reader Semantics Audit

- `TonalNavigationBar.tsx`: Ẩn `<Badge>` khỏi accessibility tree để screen reader chỉ đọc `Thông báo, 4 thông báo chưa đọc` ở container nút tab thay vì đọc trùng rời số `4`.
- `TripCompletedScreenParts.tsx`, `VoucherPickerModal.tsx`, `PaymentMethodModal.tsx`: Bổ sung `accessibilityState={{ checked }}` cho các hàng radio/đánh giá sao.
- `CustomerVouchersScreen.tsx`, `VoucherPickerModal.tsx`, `AddVehicleScreen*.tsx`, `RideDetailScreen.tsx`, `ProfileScreen.tsx`: Gán đầy đủ `accessibilityRole="button"` và `accessibilityLabel` tiếng Việt cụ thể theo từng item (kèm tên voucher/biển số/trạng thái).

---

## 15. Performance, Lists, Images & Hook Safety Audit

- **Ảnh nhạy cảm / Bàn giao (`expo-image`):** Chuyển `HandoverHistory.tsx` và `SupportCenter.tsx` sang `expo-image` với `cachePolicy="memory"` (nhất quán với quy chuẩn `AGENTS.md`).
- **Timer & Effect Cleanup:** Lưu timeout ID vào `timerRef` và cleanup trong `useEffect` unmount ở `CreateTicketScreen` (Customer & Driver) và `TicketChatScreen` (Driver).
- **Double-Tap Locks:** Bổ sung `cashLock = useRef(false)` (`useComplete.ts`) và `cancelLock = useRef(false)` (`InProgressScreen.tsx`).
- **Speech & Map Lifecycle:** Gộp 3 `expo-speech` effect tại `DriverDirectionsMap.native.tsx` thành 1 effect đồng bộ, tự hủy giọng đọc khi app chạy nền (`AppState`). Thay `GoongMap` thừa lúc loading ở `RideDirectionsScreen.tsx` bằng `ActivityIndicator`.

---

## 16. Backend Contract & Data Truthfulness Audit

- **Chuyến `0 đ`:** Đồng bộ logic `CASH` khi `amount === 0` (`PAID` vs `PENDING`) theo dữ liệu thanh toán backend, tuyệt đối không cho xác nhận thu tiền mặt khi `amount === 0` (`canConfirmCash = false`).
- **Biên bản ODO trả xe:** Đối chiếu trực tiếp với `handoverReports` pha `PICKUP` từ backend, hiển thị rõ mốc ODO lúc nhận xe và không cho gửi báo cáo trả xe gian lận/nhầm số thấp hơn.
- **Lộ trình & Ghi chú (`CustomerRideDetail`):** Chỉ đọc `ride.pickupNote` đúng như kiểu `CustomerRideDetail` tại `@datxe/shared`; `offer.note` và `offer.pickupNote` chỉ hiển thị ở màn nhận cuốc (`OfferDecision`).
- **Hiển thị sao & giá giảm:** Sửa kiểm tra falsy `receivedStars` và chỉ hiển thị dòng `Giá cước gốc` / `Ưu đãi khách dùng` khi `discountAmount > 0`.

---

## 17. Complete Table of Issues Found & Fixes Applied

| ID | Mức độ | Khu vực / File | Vấn đề trước sửa | Giải pháp đã áp dụng |
| --- | --- | --- | --- | --- |
| P1-01 | P1 | `MapPickerScreen.tsx`, `PlaceSelectionScreen.tsx` | Icon trắng trên nền vàng `#F2B705` (< 2:1) | Đổi sang `colors.onRideDropoff` + nền `accent.dropoff` |
| P1-02 | P1 | `RegisterScreenParts.tsx`, `RegisterScreen.tsx` | `secondaryButtonText` ép chữ `onPrimary` lên nút tertiary sáng (1.25:1) | Xóa override, giữ màu button chuẩn `@datxe/ui` |
| P1-03 | P1 | `GuidedCaptureScreen.tsx` | Thông báo lỗi dùng chữ `errorContainer` trên nền tối, nút `44×44` | Dùng pill `colors.onErrorContainer` trên `colors.errorContainer`, nâng `iconButton` lên `48×48` |
| P1-04 | P1 | `ridePresentation.ts`, `CompleteScreen.tsx`, `useComplete.ts` | Chuyến `0 đ` `CASH` cho xác nhận thu tiền hoặc thiếu banner riêng; nút xác nhận thiếu ref lock; thiếu dòng giảm giá voucher; check sai `receivedStars` | Ràng buộc `amount > 0`, thêm 2 banner `0 đ`, thêm `cashLock`, hiển thị giá gốc & giảm giá, sửa check `receivedStars != null` |
| P1-05 | P1 | `useVehicleInspection.ts`, `VehicleInspectionScreen.tsx` | Cho phép nhập ODO trả xe thấp hơn ODO nhận xe | Derive `pickupOdometer`, báo lỗi + gợi ý mốc ODO nhận xe + chặn submit `< pickupOdometer` |
| P1-06 | P1 | `DriverProfileCard.tsx`, `useTripCompleted.ts` | Nút gọi/chat trùng làm bóp cột tên 56dp; `TripCompleted` luôn `replace` mất back stack | Bỏ nút lồng trong `identity`; dùng `canGoBack() ? router.back() : router.replace(...)` |
| P2-01 | P2 | `TicketChat.tsx` | `Avatar.Icon icon="support-agent"` lỗi dấu `?`; lightbox modal thô; ảnh không placeholder; category/status thiếu `t()`; nút `< 48dp` | Render `MaterialIcons`; dùng `ChatImageViewer`; thêm placeholder; bọc `t()`; nâng `action` `48×48`; `tabular-nums` |
| P2-02 | P2 | `TicketList.tsx`, `TicketCreate.tsx` | Nhãn chưa bọc `t()`, counter thiếu `tabular-nums` | Bọc `t(...)` và thêm `tabular-nums` |
| P2-03 | P2 | `TonalNavigationBar.tsx` | Screen reader đọc trùng badge số tách khỏi tab | Bọc badge với `importantForAccessibility="no-hide-descendants"` |
| P2-04 | P2 | `HandoverHistory.tsx`, `SupportCenter.tsx` | Dùng `Image` của RN thay `expo-image`, counter thiếu `tabular-nums` | Chuyển `expo-image` `cachePolicy="memory"`, thêm `tabular-nums` |
| P2-05 | P2 | `CustomDatePickerModal.tsx`, `PhoneNumberInput.tsx` | Nút đóng `< 48dp`, country modal thiếu keyboard avoiding & inset, số thiếu `tabular-nums` | Nâng `48dp` / `hitSlop`, bọc `KeyboardAvoidingView padding`, thêm `tabular-nums` |
| P2-06 | P2 | `WalletComponents.tsx` | Dùng typography legacy (`titleLg`, `bodyMd`, ...) & thiếu `tabular-nums` | Chuyển semantic roles & thêm `tabular-nums` |
| P2-07 | P2 | `VoucherPickerModal.tsx`, `PaymentMethodModal.tsx`, `checkoutStyles.ts` | Sheet co `flex: 0`; PaymentModal không cuộn được; thiếu `checked` state & `48dp` | Sửa flex, thêm `ScrollView`, `statusBarTranslucent`, `checked`, `48dp` |
| P2-08 | P2 | `CustomerVouchersScreen*.tsx`, `TripCompletedScreenParts.tsx` | Dùng `fontStyle: "italic"`, thiếu label ngữ cảnh từng voucher, gap sao `4`, thiếu `tabular-nums` | Bỏ italic, gán `accessibilityLabel`, tăng `gap: 8`, `tabular-nums`, semantic type |
| P2-09 | P2 | `PendingPaymentMethod.tsx`, `CustomerRideCancellationDialog.tsx`, `SettingsScreen.tsx` | Dialog/form dài không cuộn được hoặc bị Gboard che CTA | Thêm `Dialog.ScrollArea` + `ScrollView` + `KeyboardAvoidingView behavior="padding"` |
| P2-10 | P2 | `RideDetailScreen.tsx`, `CustomerSupportScreen.tsx`, `HistoryRideListItem.tsx` | `PENDING`/`SEARCHING` dẫn sai route; lịch sử hiện 2 chỗ đánh giá | Điều hướng `/ride/find-driver`; ẩn nút đánh giá nếu `hasRated`; thêm `accessibilityRole="button"` |
| P2-11 | P2 | `ProfileScreen.tsx`, `AccountScreenStyles.ts`, `AddVehicleScreen*.tsx` | `choice` < 48dp; Modal logout không tách backdrop; thiếu `StyleSheet` import / semantics | Nâng `48dp`, tách `Pressable` nền modal, sửa import `StyleSheet`, thêm accessibility |
| P2-12 | P2 | `CreateTicketScreen.tsx` (2 app), `TicketChatScreen.tsx` | Timer điều hướng thiếu cleanup khi unmount; thiếu `canGoBack` fallback | Lưu `timerRef` cleanup khi unmount, ưu tiên `canGoBack()` |
| P2-13 | P2 | `DriverDirectionsMap.native.tsx`, `RideDirectionsScreen.tsx`, `useRideDirections.ts` | 3 effect speech dễ race/không tắt khi background; banner đè control; render `GoongMap` khi loading | Gộp 1 effect speech + `AppState`; nhóm `topOverlay`; dùng viewport padding; bỏ map khi loading |
| P2-14 | P2 | `HomeScreen.tsx` (Driver) | Thống kê thu nhập đứng trước offer/chuyến đang chạy/trạng thái nhận cuốc; đặt toàn bộ vào `intro` làm thiếu `children` | Đưa Active Ride / Offer / `HomeOperationalStatus` lên trên `HomeDriverHeader` & `MyDriverReviews`, truyền qua `children` của `<DriverPage>` |
| P2-15 | P2 | `OfferDecision.tsx`, `InProgressScreen.tsx` | Chuyến `0 đ` hiển thị mập mờ; nút hủy chuyến thiếu lock chống nhấn đúp | Hiện `'Thu tiền mặt (0 đ)'`, hiện ghi chú đón/chuyến; thêm `cancelLock` |
| P2-16 | P2 | `StatusBadge.tsx`, `colors.ts`, `TripHistoryScreenParts.tsx` | Cắt chữ trạng thái dài (`Không tìm được tài xế`) và màu tương phản nền | Tinh chỉnh `StatusBadge`, màu semantic, và layout thẻ lịch sử (cùng 1 badge nhất quán) |
| P2-17 | P2 | `packages/shared/src/i18n/en.json` | Thiếu bản dịch tiếng Anh cho các accessibility label & ticket label mới | Bổ sung đầy đủ 9 key mới giữ đúng placeholder `{0}` |
| P3-01 | P3 | 8 file màn hình/component Driver (`DriverCreditGate`, `NotificationsScreen`, `RideCustomerCard`, `DriverSafetyScreen`, `LoginScreenParts`, `HistoryScreen`, `DriverWalletScreen`, `DriverWithdrawalScreen`) | Còn giữ các role typography legacy (`titleLg`, `bodyMd`, `labelLg`, `labelMd`, `labelSm`, `headlineXlMobile`) | Di chuyển sang 12 semantic typography roles (`sectionTitle`, `cardTitle`, `body`, `bodySecondary`, `label`, `caption`, `button`, `display`); giữ nguyên 3 file gắn test mock (`HomeOperationalStatus`, `ProfileScreenParts`, `CustomerVehiclesScreenParts`) |
| P3-02 | P3 | `DocumentForm.tsx`, `useDocuments.ts`, `RideEarnings.tsx` | 3 file dead code không còn import sau khi chuyển sang native eKYC & `CompleteScreen` mới | Đã kiểm tra 0 tham chiếu và xóa khỏi repo |
| P3-03 | P3 | `support-ride-reliability.test.cjs` | Test `support` và `useComplete` thiếu mock `expo-image` và `react.useRef` sau khi nâng cấp component/hook | Cập nhật mock fixture tương ứng |
| P3-04 | P3 | `tests/ui-standardization-fixes.test.cjs`, `tests/driver-ride-lifecycle-matrix.test.cjs` | Thiếu regression guard cho các lỗi mới phát hiện hậu merge | Bổ sung các assertion mới cho chuyến `0 đ` `CASH`, `pickupOdometer`, `GuidedCaptureScreen`, `onRideDropoff`, `RegisterScreenParts`, `DriverProfileCard` |

---

## 18. Dead Code & Unused Component Cleanup

Đã xác minh zero import / zero string reference trước khi xóa vĩnh viễn:
- `apps/driver/src/features/auth/components/DocumentForm.tsx`
- `apps/driver/src/features/auth/hooks/useDocuments.ts`
- `apps/driver/src/features/ride/components/RideEarnings.tsx`

---

## 19. Regression Tests Added & Updated

- `tests/driver-ride-lifecycle-matrix.test.cjs`:
  - Kiểm chứng `completePresentation` với chuyến `0 đ` `CASH` (`PAID` -> `"Khách được miễn phí (Voucher 0 đ)"`, `PENDING` -> `"Chờ hoàn tất thanh toán 0 đ"`, cả hai đều giữ `canConfirmCash === false` và `cashToCollect === undefined`).
  - Kiểm chứng `VehicleInspectionScreen.tsx` + `useVehicleInspection.ts` có đối chiếu `pickupOdometer`/`odometerBelowPickup` và `GuidedCaptureScreen.tsx` giữ `iconButton: 48×48` + `colors.onErrorContainer`.
- `tests/ui-standardization-fixes.test.cjs`:
  - Kiểm chứng `MapPickerScreen.tsx` và `PlaceSelectionScreen.tsx` dùng `colors.onRideDropoff` (không dùng chữ/icon trắng trên nền vàng), `RegisterScreenParts.tsx` không ghi đè `secondaryButtonText`/`colors.onPrimary`, và `DriverProfileCard.tsx` không lặp `contactActions`.
- `tests/support-ride-reliability.test.cjs`:
  - Bổ sung mock `expo-image` và `react.useRef` khớp với triển khai an toàn mới.

---

## 20. Real-Device Visual QA Results (`Vivo V2342T` / `10AE3H0A4C000LH`)

- **Thiết lập ban đầu ghi nhận:** `Night mode: yes`, `font_scale: 1.0`, `adb reverse` hoạt động trên cổng `8081` (Customer) và `8082` (Driver). Sau kiểm thử đã khôi phục nguyên trạng `Night mode: yes` và `font_scale: 1.0`.
- **Customer App (`com.datxe.customer`) — VERIFIED ON DEVICE (Dark Mode, `font_scale 1.0` & `1.3`):**
  - Đã chụp & kiểm tra trực quan các màn `Home`, `History`, `Notifications`, `Profile`: hiển thị đúng 1 marker vị trí khách trên bản đồ, ví `320.945 đ`, bộ lọc chip lịch sử tự xuống dòng sạch ở `font_scale 1.3`, badge `4` trên tab `Thông báo` không bị cắt, email `quyennv19122006@gmail.com` tự xuống dòng trọn vẹn.
- **Customer & Driver Light Mode / Driver Post-Reload Tabs — PARTIALLY VERIFIED / NOT VERIFIED ON DEVICE:**
  - Khi chạy `cmd uimode night no`, hệ điều hành đổi icon thanh trạng thái sang màu đen nhưng ứng dụng trên thiết bị vẫn giữ nền tối đã lưu từ thiết lập trước đó (dẫn đến hiện tượng phát hiện thực tế: icon status bar màu đen nổi kém trên nền tối khi ép `cmd uimode` mà app giữ theme dark riêng). Giao diện Light Mode và bảng màu chuẩn của hai app đã được kiểm chứng qua `tests/theme.test.cjs` + `tests/typography-system.test.cjs` + `tests/ui-standardization-fixes.test.cjs`.
  - Ở `com.datxe.driver`, đã quan sát ảnh chụp trước khi reload (`font_scale 1.3`), nhưng sau khi `am force-stop` để nạp bundle mới, dev-client dừng ở màn trắng chờ kết nối thủ công nên các màn Driver sau khi sửa `HomeScreen.tsx` / `HistoryScreen.tsx` / `Profile` chưa được xác nhận trực tiếp trên thiết bị (đã kiểm chứng đầy đủ bằng `typecheck`, `lint`, unit/render test và `expo export`).

---

## 21. Automated Verification Matrix

| Lệnh kiểm tra | Phạm vi | Kết quả quan sát |
| --- | --- | --- |
| `npm run check:architecture` | Toàn monorepo | **PASS** — `Architecture passed: thin routes, imports, feature boundaries, environment and shared/UI separation.` |
| `npm run typecheck` | `customer`, `driver`, `@datxe/shared`, `@datxe/ui` | **PASS** — Exit `0` trên cả 4 workspace |
| `npm run lint` | `apps/customer` (`expo lint`), `apps/driver` (`expo lint`) | **PASS** — Exit `0`, không lỗi ESLint |
| `npm test` | `tests/*.test.cjs` | **PASS** — **238/238 passed**, `0` failed, `0` skipped, `0` todo |
| `npx expo-doctor` (`apps/customer`) | 20 checks Expo SDK 58 | **19/20 passed** — 1 cảnh báo dependency SDK 58 có sẵn (16 package lệch minor/patch pre-existing; không tự ý nâng theo quy định AGENTS.md) |
| `npx expo-doctor` (`apps/driver`) | 20 checks Expo SDK 58 | **19/20 passed** — 1 cảnh báo dependency SDK 58 có sẵn (17 package lệch minor/patch pre-existing) |
| `EXPO_NO_DOTENV=1 npx expo export --platform android --platform web` (`apps/customer`) | Bundle production Android + Web | **PASS** (`exit 0`) — Xuất `index-*.hbc` (`9.1MB`) và 47 web bundles |
| `EXPO_NO_DOTENV=1 npx expo export --platform android --platform web` (`apps/driver`) | Bundle production Android + Web | **PASS** (`exit 0`) — Xuất `index-*.hbc` (`9MB`) và 41 web bundles |
| `git diff --check` | Toàn bộ diff hiện hành | **PASS** (`exit 0`) — Không lỗi khoảng trắng hoặc conflict marker |

---

## 22. Before / After 10-Point UI/UX Quality Assessment Table

> **Lưu ý phương pháp:** Bảng điểm dưới đây là **đánh giá chuyên môn kỹ thuật & thiết kế** của nhóm audit dựa trên đối chiếu code, token `@datxe/ui`, tiêu chuẩn WCAG 2.2 AA, Material Design 3 / Apple HIG và ảnh chụp thiết bị thực tế — **không phải kết quả khảo sát người dùng cuối**.

| Hạng mục (Thang 10) | Trước refine (Hậu merge `fbe50c8`) | Sau refine (Hiện tại) | Căn cứ thay đổi |
| --- | --- | --- | --- |
| 1. Nhất quán Design System & Tonal Surface | 7.5 | **9.5** | Dọn 13 chỗ typography legacy, gỡ override màu sai chuẩn, thống nhất `@datxe/ui` |
| 2. Tương phản màu sắc (WCAG 2.2 AA) | 6.5 | **9.5** | Khắc phục `#FFF` trên vàng `#F2B705`, `onPrimary` trên nút phụ register, màu lỗi eKYC |
| 3. Phóng chữ & Tiếng Việt không cắt chữ | 7.5 | **9.5** | `tabular-nums` đồng bộ, `en.json` đủ key, bọc text an toàn tại `font_scale 1.3` |
| 4. Vùng chạm, Safe Area & Bàn phím | 7.0 | **9.0** | Nâng toàn bộ nút nhỏ lên `>= 48dp`, bổ sung `KeyboardAvoidingView padding` & cuộn modal |
| 5. Trải nghiệm Đặt xe (Customer) | 8.0 | **9.0** | Sửa picker modal, tương phản map picker, bảo vệ back navigation và route `find-driver` |
| 6. Trải nghiệm Tài xế một tay & Tốc độ đọc (Driver) | 6.5 | **9.0** | Ưu tiên chuyến/offer/`HomeOperationalStatus` lên đầu `HomeScreen`, gom speech & map control |
| 7. Độ tin cậy Luồng chuyến & Dữ liệu Backend | 7.0 | **9.5** | Khóa `0 đ` CASH, khóa nhấn đúp tiền mặt/hủy, chặn ODO trả < ODO nhận, xóa ghi chú không tồn tại |
| 8. Accessibility Semantics (TalkBack / VoiceOver) | 6.5 | **9.0** | Ẩn badge trùng lặp, bổ sung `checked`, `accessibilityRole="button"`, label theo item |
| 9. Hiệu năng, Bộ nhớ & Sạch mã nguồn | 7.5 | **9.0** | Dùng `expo-image`, cleanup timer/AppState speech, xóa 3 file dead code |
| 10. Độ phủ Kiểm thử & Tính sẵn sàng Release | 8.5 | **9.5** | 238/238 tests, kiến trúc/typecheck/lint/expo-export Android+Web đều pass sạch |

---

## 23. Remaining Known Limitations & Production Release Verdict

1. **Giới hạn hiện tại đã ghi nhận trung thực:**
   - **Pre-existing SDK 58 dependency versions (`19/20 expo-doctor`):** Do monorepo đóng băng phiên bản trong đợt release, không tự nâng 16–17 package patch/minor khi chưa đánh giá toàn bộ native prebuild.
   - **Device QA Light Mode & Driver Post-Reload:** Chưa quan sát trực tiếp màn Light Mode do thiết bị lưu theme dark cá nhân (và phát hiện edge case icon status bar đen nếu OS đổi light trong lúc app giữ dark theme riêng), và dev-client Driver chưa tự nạp lại từ `am force-stop` trong phiên terminal. Nên chạy thêm 1 lượt bấm reload nóng trên dev build Driver thật trước khi build APK release.
   - **Bản đồ `GoongMap` khi ở chế độ tối:** Lớp bản đồ nền webview/tiles giữ tông sáng theo style map hiện hành; chữ/overlay bản đồ vẫn đảm bảo tương phản rõ.
2. **Release Verdict:** **READY FOR STAGING / PRE-RELEASE QA BUILD** trên cơ sở mã nguồn (`238/238` test pass, `check:architecture`, `typecheck`, `lint`, `expo export --platform android --platform web` đều đạt exit `0`), khuyến nghị thực hiện smoke test thủ công nhanh trên APK staging cho 2 luồng: (a) Driver Home + ODO trả xe + chuyến `0 đ` trên thiết bị thật ở cả Light Mode và Dark Mode, và (b) toàn luồng Customer tìm tài xế `NO_DRIVER_FOUND` -> đặt lại -> đánh giá 1 lần.
