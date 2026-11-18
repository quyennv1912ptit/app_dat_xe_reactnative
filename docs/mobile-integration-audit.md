# Báo cáo Tích hợp & Kiểm toán Phát hành Mobile PtitGo (`integration/mobile-release`)

- **Workspace:** `F:\datxe_rn` (`apps/customer`, `apps/driver`, `packages/ui`, `packages/shared`, `packages/config`)
- **Backend tham chiếu:** `F:\datxebackend` (nhánh `integration/backend-release`)
- **Nhánh baseline giao diện & hợp đồng API:** `feat/ekyc-service` (`70a929f`, backup tại `backup/mobile-before-merge`)
- **Nhánh tích hợp vào:** `origin/updatefrontend` (`812b582`, đã bao gồm 100% commit từ `origin/main` `06f59c3`: `e0fae6c`, `f9051ee`, cộng thêm `9101266`, `76e74f3`, `812b582`)
- **Nhánh làm việc hiện tại:** `integration/mobile-release`

---

## 1. Nguyên tắc hợp nhất & Design System

1. Bảo toàn Design System PtitGo tại `DESIGN.md` và `packages/ui/src/theme/`:
   - Màu sắc theo semantic role Light/Dark (`customer` Coral Crimson, `driver` Deep Emerald, `offerPalette`), không viết màu cứng trong `apps/*/src/**` hoặc non-theme UI.
   - Phẳng theo sắc độ (`tonal layering`), không thêm shadow/elevation mới ngoài ngoại lệ `homeStyles.ts`.
   - 12 semantic typography roles từ `@datxe/ui` (`typography.*`), tôn trọng `fontScale`, vùng chạm tối thiểu `48dp` / `44pt`, `KeyboardAvoidingView behavior="padding"` cho form/modal, ảnh nhạy cảm dùng `expo-image` với `cachePolicy="memory"`.
2. Đối chiếu trực tiếp hợp đồng API với `F:\datxebackend`:
   - `RideRatingController.kt`, `RideRatingResponse.kt`, `CreateRideRatingRequest.kt`, `RatingQueryDtos.kt`, `RideResponseMapper.kt`: xác nhận `GET /api/customer/rides/{id}/rating/me`, `GET /api/driver/rides/{id}/rating/me`, `POST /api/customer/rides/{id}/rating`, `POST /api/driver/rides/{id}/rating`, `payableFare`, `driverExpectedEarning`, `driverHasRatedCustomer`, `customerHasRatedDriver`, `transmission: MANUAL | AUTO`.

---

## 2. Tổng hợp giải quyết xung đột theo nhóm

### A. Bảo vệ các bản vá nghiệp vụ & bảo mật ở `HEAD` (khôi phục/loại bỏ hồi quy từ incoming)
- `apps/customer/src/lib/useSupportRequests.ts`, `apps/customer/src/features/tracking/hooks/useRideQuery.ts`, `apps/customer/src/features/tracking/screens/RideDetailScreen.tsx`, `apps/customer/src/features/vehicles/hooks/useVehicleInspection.ts`, `docs/support-and-ride-reliability.md`
- `packages/ui/src/chat/ChatConversation.tsx`, `packages/ui/src/tickets/TicketChat.tsx`
- `.github/workflows/build-and-release.yml`, `apps/driver/tsconfig.json`, `tests/{driver-bank-profile,driver-credit,payment-method-change,ride-display-handover,wallet-api,customer-ui-layout,driver-offer-recovery,support-ride-reliability}.test.cjs`
- Xóa `.idea/markdown.xml` và loại bỏ `DriverRateCustomerCard.tsx` (trùng lặp với `RideCustomerRating.tsx`).

### B. Customer App (`apps/customer`)
- **Đặt chuyến & Lịch hẹn:** Tích hợp lưới chọn giờ đón theo ngày Việt Nam (`SchedulePickerModal.tsx`, `bookingUtils.ts`, `useBookingConfirmation.ts`), hỗ trợ chọn/nhận chiến dịch voucher trong luồng đặt xe (`VoucherPickerModal.tsx`, `BookingConfirmationScreen.tsx`, `VehicleSelectionScreen.tsx`, `HomeScreen.tsx`) và `voucherPresentation.ts` cho quà chào mừng / suất chiến dịch (`campaignTitle`, `claimSequence`).
- **Lịch sử & Theo dõi chuyến:** Khôi phục `FlatList` trong `TripHistoryScreen.tsx`, giữ `MoneyText` + trạng thái `hasRated`/`myRatingStars` trong `HistoryRideListItem.tsx` kèm nút điều hướng đánh giá chuyến `COMPLETED`; giữ `useDriverTracking.ts` & `useApproachRoute.ts` làm nguồn route duy nhất; đảm bảo nút gọi/nhắn trên `DriverProfileCard.tsx` đạt vùng chạm `48×48dp`.
- **Hoàn thành chuyến & Đánh giá (`useTripCompleted.ts`, `TripCompletedScreen.tsx`):** Kết hợp truy vấn `GET /customer/rides/{id}/rating/me` với khóa `customerHasRatedDriver` / `hasRated`, giữ `KeyboardAvoidingView behavior="padding"` và `scrollRef`.
- **Ưu đãi (`CustomerVouchersScreen.tsx`, `CustomerVouchersScreenParts.tsx`, `useCustomerVouchers.ts`):** Hợp nhất `getVoucherPresentation`, danh sách chiến dịch mở nhận, trạng thái rỗng có CTA đặt chuyến và badge chuẩn tương phản `primaryContainer` / `onPrimaryContainer`.

### C. Driver App (`apps/driver`) & Shared UI (`packages/shared`, `packages/ui`)
- **Khởi động & An toàn token (`RootLayout.tsx`, `rideStyles.ts`):** Giữ `useStartupLocationPermission`, thêm `fontTimeout` 3 giây chống treo màn hình trắng; giữ 100% `typography.*` trong `rideStyles.ts`.
- **Offer & Lộ trình đang chạy (`driverOffer.ts`, `OfferDecision.tsx`, `InProgressScreen.tsx`, `RideCustomerCard.tsx`):** Bổ sung giờ đón đặt lịch (`scheduledPickup.ts`), điểm đánh giá khách hàng (`customer.rating` / `averageRating`), `payableFare` và `driverExpectedEarning` trên card thu nhập dự kiến, giữ nguyên `48dp` `DriverChatButton` và nút gọi khách.
- **Chỉ đường bằng giọng nói (`RideDirectionsScreen.tsx`, `DriverDirectionsMap.native.tsx`, `DriverDirectionsMap.web.tsx`):** Giữ cấu trúc `MapSheetLayout` + `DriverPage` lỗi của local và tái cấu trúc `DriverDirectionsMap` (MapLibre + `expo-speech` tiếng Việt + auto re-route) sang token `@datxe/ui` & `packages/ui/src/theme/mapColors.ts` (không còn màu hex cứng, shadow hay `fontSize` cứng; thêm cleanup `Speech.stop()` khi unmount).
- **Hoàn tất chuyến & Đánh giá khách (`CompleteScreen.tsx`, `useComplete.ts`, `RideCustomerRating.tsx`, `api.ts`):** Giữ `ReceiptRow`, `MoneyText`, `HandoverSummary`, timeline mốc chuyến đi; bổ sung preview đánh giá từ push notification `RATING_RECEIVED`, `GET /driver/rides/{id}/rating/me` qua `useComplete.ts` và quick tags (`FilterChip`) trong `RideCustomerRating.tsx`.
- **Cấu hình build & iOS (`app.json`, `app.config.js`, `eas.json`, `.github/workflows/ios-unsigned.yml`, `scripts/build-ios-device.sh`):** Hỗ trợ cả `GoogleServiceCustomer-Info.plist`/`GoogleServiceDriver-Info.plist` lẫn fallback `GoogleService-Info.plist`, giữ `google-services.json`, `typedRoutes: true` và EAS project IDs gốc; thêm `expo-speech ~58.0.3` và `expo-build-properties ~58.0.12`.

---

## 3. Kết quả kiểm chứng sau chỉnh sửa cuối

| Hạng mục | Lệnh / Phạm vi | Kết quả quan sát | Trạng thái |
| --- | --- | --- | --- |
| Architecture & Boundaries | `npm run check:architecture` | Thin routes, feature boundaries, env & shared/UI separation | **PASS** |
| TypeScript Strictness | `npm run typecheck` (4 workspaces) | `customer`, `driver`, `@datxe/shared`, `@datxe/ui` đều 0 lỗi | **PASS** |
| Lint | `npm run lint` (`expo lint` Customer & Driver) | 0 errors, 0 warnings | **PASS** |
| Unit & Regression Tests | `npm test` (`node --test tests/*.test.cjs`) | **237/237 pass, 0 fail** (bao gồm 6 test khôi phục/bổ sung từ `origin/main` & `voucherPresentation` & `RideCustomerRating`) | **PASS** |
| Export Bundle (Android & Web) | `EXPO_NO_DOTENV=1 npx expo export --platform android --platform web` cho cả 2 app | Customer (`web 47` + `android .hbc`), Driver (`web 41` + `android .hbc`) thành công | **PASS** |
| App Config Evaluation | Kiểm tra `app.json` + `app.config.js` qua Node | `customer` (`PtitGo`, `GoogleServiceCustomer-Info.plist`), `driver` (`PtitGoDriver`, `GoogleServiceDriver-Info.plist`, `PtitGo Tài Xế`) | **PASS** |
| Hygiene & Logs | `git diff --check` & `git grep console.log/debug` | 0 lỗi whitespace, 0 `console.log`/`console.debug` | **PASS** |
| Expo SDK Doctor | `npx expo-doctor` tại `apps/customer` & `apps/driver` | 19/20 pass; cảnh báo 16/17 gói SDK 58 lệch patch/minor giữ nguyên lockfile (`expo ~58.0.17` vs `58.0.18..32`) | **CONDITIONAL (Warn)** |
| Dependency Security | `npm audit --omit=dev` | 45 advisories (6 moderate, 39 high) thuộc dependency thượng nguồn Expo/Firebase/React Native (không chạy `--force` để tránh phá Expo SDK 58) | **KNOWN RISK** |
| On-device Android UI/E2E & iOS macOS Native Build | `adb devices -l` thấy máy `10AE3H0A4C000LH`, chưa build/chạy runtime APK và chưa có macOS cho Xcode `.ipa` | Chưa chạy Light/Dark/fontScale `1.3` trên thiết bị thật và chưa chạy `.github/workflows/ios-unsigned.yml` trên `macos-14` | **NOT VERIFIED** |

---

## 4. Kết luận sẵn sàng phát hành

- **Trạng thái:** **CONDITIONAL**
- **Điều kiện trước khi phát hành chính thức:**
  1. Build dev/preview APK mới (gồm `expo-speech` & `expo-build-properties`) và QA trực tiếp trên Android (Light/Dark + `fontScale` 1.3 + E2E hai máy Khách/Tài xế nối `integration/backend-release`).
  2. Chạy workflow `ios-unsigned.yml` hoặc EAS build trên macOS/Xcode để xác nhận biên dịch native iOS (`pod install` + `xcodebuild`).
