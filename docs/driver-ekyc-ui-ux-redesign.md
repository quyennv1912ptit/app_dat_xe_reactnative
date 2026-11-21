# Driver eKYC — Audit, UX Simplification & UI Redesign Report

> Workspace: `F:\datxe_rn` (`apps/driver`)
> North Star & Design System: **PtitGo Material Design 3** · **Deep Emerald (`brand="driver"`)** · **The Confident Co-Pilot** (`@datxe/ui`, `DESIGN.md`, `PRODUCT.md`, `apps/driver/PRODUCT.md`)
> Cập nhật 20/11/2026: xem mục 8 cho đợt sửa mới và kiểm chứng trên Android emulator. Mục 1–7 ghi lại đợt tái thiết kế trước. Thiết bị thật, iOS và trình đọc màn hình chưa được kiểm chứng trong đợt mới.

---

## 1. Executive Summary

Trước đợt tái thiết kế, luồng xác minh danh tính tài xế (`VerificationScreen.tsx`) là một component đơn khối (~2.151 dòng) dồn quá nhiều hộp/thẻ lồng nhau (`Card` → `fieldCard` / `prepItem` / `verifiedTile` / `summaryList`), yêu cầu tài xế tự bấm thêm bước đọc OCR thủ công sau khi đã chụp xong 5 ảnh, hiển thị mã kỹ thuật nội bộ (ví dụ: `"Mặt này chưa hỗ trợ OCR."`), và đặt CTA chính trong phần nội dung cuộn thay vì vùng ngón cái dưới màn hình.

Đợt tái thiết kế đã **tách kiến trúc rõ ràng**, **giảm tải nhận thức**, **chuyển toàn bộ thao tác chính xuống thanh đáy cố định (`DriverPage` `footer`)**, và **tự động hóa bước chuyển tiếp đọc QR/OCR**, trong khi giữ nguyên 100% hợp đồng API, Identity Lock, revision/generation guard và quy tắc an toàn pháp lý của PtitGo.

---

## 2. Skills & Quy chuẩn đã đọc và áp dụng

| Nguồn / Skill | Cách áp dụng cụ thể |
|---|---|
| `AGENTS.md`, `apps/driver/AGENTS.md` | Giữ ranh giới `src/app/` re-export `<= 10` dòng, không import chéo feature, không raw hex, không `shadow*`/`elevation`/`borderWidth > 0`, dùng `typography.*` & `@datxe/ui` primitives, `KeyboardAvoidingView behavior="padding"`. |
| `PRODUCT.md`, `apps/driver/PRODUCT.md`, `DESIGN.md` | Giữ Deep Emerald (`colors.primary`), bề mặt phẳng phân tầng sắc độ (`cardSurface` trên `background`), CTA một tay ở dưới màn hình, trung thực trạng thái chụp/máy chủ. |
| `impeccable` v4.9.1 (`context`, `doctor`, `operate.md`, `craft-floor.md`, `audit.native.md`, `critique.md`, `distill.md`, `clarify.md`, `harden.md`, `adapt.native.md`, `polish.md`) | Loại bỏ card lồng card (`fieldCard`, `verifiedTile`, `prepItem`), loại bỏ eyebrow/kicker trùng lặp (`stepBadge` ở `ApprovalStatusScreen`), đơn giản hóa copy sang tiếng Việt trực tiếp, giữ `mode: Operate` gọn gàng. |
| `expo-native-ui` | Tôn trọng safe-area qua `ScreenWrapper`/`useSafeAreaInsets`, `keyboardShouldPersistTaps="handled"`, `useWindowDimensions` (trong `KeyValueRow`), `expo-image` (`cachePolicy="none"`/`"memory"` cho ảnh nhạy cảm). |
| `vercel-react-native-skills` | Tách component đơn trách nhiệm để giảm phạm vi re-render, không đọc `ref.current` trong render (`react-hooks/refs` cho React Compiler), giữ JSX prop callbacks sạch. |
| `frontend-design` | Phân cấp 1 nhiệm vụ/màn, 1 Primary CTA/màn, rút ngắn chữ thừa, giảm trang trí, tập trung cấu trúc thẳng hàng rõ ràng. |

---

## 3. Audit Trước Tái Thiết Kế (Root Causes)

| # | Vấn đề gốc | Vị trí cũ | Mức độ |
|---|---|---|---|
| 1 | **Đơn khối 2.151 dòng + Card lồng Card:** `CONFIRM_FIELDS` tạo 10 `fieldCard` con lồng trong `Card`; `PREPARE` lồng `prepItem` + `consentBox`; `APPROVED` lồng `verifiedTile` trong `statusCard`. | `VerificationScreen.tsx` | **P0** |
| 2 | **Chốt chặn OCR thủ công thừa thãi:** Sau 5 bước chụp (đã tự trích QR ở mặt sau CCCD & GPLX), màn hình lại dừng ở `"Bước 3/5 · Đọc thông tin tự động"`, hiện 5 nút `"Chụp lại ..."` và bắt bấm `"Đọc thông tin tự động"`. | `VerificationScreen.tsx` (Stage `OCR`) | **P0** |
| 3 | **Rò rỉ thuật ngữ kỹ thuật:** Cảnh báo `"Mặt này chưa hỗ trợ OCR."` (`OCR_UNSUPPORTED`) hiện thành banner vàng; mô tả kỹ thuật dài dòng (`chờ đối chiếu cùng ảnh giấy tờ và dữ liệu OCR...`, `Bản 1`). | `VerificationScreen.tsx` | **P1** |
| 4 | **CTA không nằm ở vùng ngón cái:** Nút chính (`Mở camera`, `Tiếp tục`, `Nộp hồ sơ`) nằm trôi trong `ScrollView`; chuyển bước không reset cuộn (`scrollResetKey`). | `VerificationScreen.tsx`, `ApprovalStatusScreen.tsx` | **P1** |
| 5 | **Preview chụp ảnh nhiều chữ EXIF:** `GuidedCaptureScreen` luôn bung danh sách 5 dòng kiểm tra kỹ thuật (cả `pass` và `unchecked`) ngay trên nút `"Dùng ảnh này"`, đẩy CTA xuống dưới trên màn nhỏ hoặc `fontScale >= 1.3`. | `GuidedCaptureScreen.tsx` | **P1** |
| 6 | **Eyebrow thừa & ProgressBar giả 100%:** `ApprovalStatusScreen` đặt `stepBadge` ngay trên `<ProgressBar progress={1} />` ngay cả khi hồ sơ bị `REJECTED` hoặc đang `PENDING`. | `ApprovalStatusScreen.tsx` | **P1** |
| 7 | **Trang Tóm tắt (`SUMMARY`) quá dài:** Xếp dọc 5 ảnh lớn nối tiếp bảng 10 dòng và tối đa 3 công tắc Switch. | `VerificationScreen.tsx` (Stage `SUMMARY`) | **P2** |
| 8 | **Nút chọn mặt ở `QrScannerScreen` dễ ép chữ:** Hai nút nằm 1 hàng không `flexWrap` khi `fontScale` lớn. | `QrScannerScreen.tsx` | **P2** |
| 9 | **Mục Hồ sơ thiếu ngữ cảnh trạng thái:** Hàng `"Xác minh tài xế"` trên `ProfileScreen` không gợi ý bước tiếp theo khi chưa duyệt / bị từ chối. | `ProfileScreen.tsx` | **P2** |

---

## 4. Kiến Trúc & Trải Nghiệm Sau Tái Thiết Kế

### 4.1 Luồng 4 Mốc Rõ Ràng (Giữ Nguyên State Machine 5 Stage Nội Bộ)

Mặc dù `FlowStage` nội bộ giữ nguyên `'PREPARE' | 'CAPTURE' | 'OCR' | 'CONFIRM_FIELDS' | 'SUMMARY'` để bảo toàn deep-link `NEEDS_MORE_INFO` và khôi phục trạng thái, người dùng nhìn thấy **4 mốc tự nhiên**:

1. **Bước 1/4 · Chuẩn bị giấy tờ (`VerificationPrepareStep`):**
   - Bỏ hộp lồng; dùng 1 `GroupedList` phẳng cho 3 mục (CCCD 2 mặt, GPLX 2 mặt, Ảnh chân dung).
   - 1 công tắc đồng ý gửi ảnh + giải thích rõ lý do nếu nút `"Bắt đầu chụp ảnh"` đang khóa (`disabledHint` ngay trên CTA ở `VerificationFooter`).
2. **Bước 2/4 · Chụp ảnh (`VerificationCaptureStep` + `VerificationStepHeader`):**
   - Thanh tiến độ phẳng ở `headerContent` kèm 5 pill trạng thái gọn (`CCCD trước`, `CCCD sau`, `GPLX trước`, `GPLX sau`, `Chân dung`).
   - Tập trung 1 ảnh/màn; khung trống có thể chạm trực tiếp để mở camera; thư viện nằm ở hành động phụ.
   - Sau mặt sau `cccd_back` / `gplx_back`: tự gọi `continueAfterDocumentBack(...)` kiểm tra QR từ ảnh, tự mở `QrScannerScreen` khi `RECOMMEND_LIVE_SCAN`, hoặc hiện khung gợi ý quét QR gọn khi `ALLOW_LIVE_SCAN`/`SERVER_FALLBACK`.
3. **Bước 3/4 · Đọc & Kiểm tra thông tin (`VerificationExtractionStep` -> `VerificationFieldsStep`):**
   - Khi xong ảnh cuối (`completeCaptureFlow()`), hệ thống **tự chạy `runSlotExtraction(..., { autoAdvance: true })`**. Nếu thành công sạch và không cần quét QR bắt buộc, màn hình tự chuyển thẳng vào `CONFIRM_FIELDS` — bỏ hẳn 1 lần bấm thừa.
   - Luôn có nút `"Dừng đọc & tự nhập thông tin"` ở footer khi đang xử lý lâu, và giữ màn `VerificationExtractionStep` gọn làm màn khôi phục khi mạng lỗi hoặc cần quét lại QR.
   - Ẩn hoàn toàn cảnh báo nội bộ `OCR_UNSUPPORTED` thông qua `visibleObservationWarnings(...)`.
   - `VerificationFieldsStep`: Gộp 10 `fieldCard` rời rạc thành **2 Section Card phẳng (CCCD & GPLX)** ngăn cách bằng `Divider`, dùng `FilterChip` cho Giới tính (`Nam` / `Nữ` / `Bỏ chọn`) và cho các đề xuất mâu thuẫn QR/OCR, dùng `SharedStatusBadge` báo trạng thái QR (`Đã có mã QR` / `Nên quét QR`), và nút `"Xem ảnh CCCD"` / `"Xem ảnh GPLX"` mở lưới thumbnail `DriverPhoto tile`.
4. **Bước 4/4 · Xác nhận & Nộp hồ sơ (`VerificationSummaryStep`):**
   - Thay 5 ảnh xếp dọc thành **lưới ảnh 2 cột (`tile`)** có nút `"Chụp lại"` từng ảnh.
   - Bảng thông tin dùng **`GroupedList` + `KeyValueRow`** (tự xuống dòng trên màn `320dp` hoặc `fontScale >= 1.35`, giữ `tabular-nums` cho số CCCD/GPLX/ngày tháng).
   - Giữ tùy chọn `faceConsent` (rõ nhãn không bắt buộc) và cơ chế `currentWarningReview` theo đúng `revision`.
   - CTA chính (`Nộp hồ sơ` / `Nộp bổ sung` / `Kiểm tra cảnh báo`) neo cố định trong `VerificationFooter`, kèm lý do khóa rõ ràng nếu thiếu xác nhận.

### 4.2 Cấu trúc Module Mới (`apps/driver/src/features/verification/`)

| File | Trách nhiệm |
|---|---|
| [`verificationLabels.ts`](../apps/driver/src/features/verification/verificationLabels.ts) | Nhãn tiếng Việt thuần, ánh xạ 4 mốc (`visibleMilestone`), lọc cảnh báo người dùng (`visibleObservationWarnings`), helper khóa danh tính & quyền chỉnh sửa. |
| [`components/VerificationShared.tsx`](../apps/driver/src/features/verification/components/VerificationShared.tsx) | `AlertBanner`, `WarningBannerList`, `SlotPhotoFrame` dùng chung không trùng lặp. |
| [`components/VerificationStepHeader.tsx`](../apps/driver/src/features/verification/components/VerificationStepHeader.tsx) | Thanh tiến độ đầu màn và chỉ báo 5 khe ảnh (`headerContent`). |
| [`components/VerificationFooter.tsx`](../apps/driver/src/features/verification/components/VerificationFooter.tsx) | Thanh nút vùng ngón cái (`DriverPage` `footer`), giải thích trạng thái `disabled`. |
| [`components/VerificationStatusView.tsx`](../apps/driver/src/features/verification/components/VerificationStatusView.tsx) | `EditingStatusBanner`, `VerifiedBaselineView` (dùng `GroupedList` + `KeyValueRow` + `Divider`), `PendingReviewView`. |
| [`components/VerificationPrepareStep.tsx`](../apps/driver/src/features/verification/components/VerificationPrepareStep.tsx) | Bước chuẩn bị với `GroupedList` 3 mục và công tắc đồng ý. |
| [`components/VerificationCaptureStep.tsx`](../apps/driver/src/features/verification/components/VerificationCaptureStep.tsx) | Bước chụp từng khe ảnh, gợi ý QR mặt sau, xác nhận ảnh nhỏ. |
| [`components/VerificationExtractionStep.tsx`](../apps/driver/src/features/verification/components/VerificationExtractionStep.tsx) | Trạng thái tự đọc QR/OCR và khôi phục khi lỗi/bận. |
| [`components/VerificationFieldsStep.tsx`](../apps/driver/src/features/verification/components/VerificationFieldsStep.tsx) | Form 2 phần CCCD/GPLX phẳng dùng `ThemedTextInput`, `FilterChip`, `SharedStatusBadge`, `Divider`. |
| [`components/VerificationSummaryStep.tsx`](../apps/driver/src/features/verification/components/VerificationSummaryStep.tsx) | Lưới 5 ảnh `tile`, `GroupedList` + `KeyValueRow`, đối chiếu ảnh chân dung tùy chọn, checklist nộp. |
| [`VerificationScreen.tsx`](../apps/driver/src/features/verification/VerificationScreen.tsx) | Điều phối state, API, upload/extract/qr-scan, `Idempotency-Key`, `AppState`, `scrollResetKey`, modal camera/QR. |
| [`GuidedCaptureScreen.tsx`](../apps/driver/src/features/verification/GuidedCaptureScreen.tsx) | Thu gọn bảng EXIF mặc định sau nút `"Xem chi tiết kiểm tra ảnh"`, luôn hiện ngay cảnh báo `warn`/`fail`. |
| [`QrScannerScreen.tsx`](../apps/driver/src/features/verification/QrScannerScreen.tsx) | Bổ sung `flexWrap: 'wrap'` cho hàng chọn mặt thẻ để không ép chữ khi phóng chữ hệ thống. |
| [`ApprovalStatusScreen.tsx`](../apps/driver/src/features/auth/screens/ApprovalStatusScreen.tsx) | Bỏ eyebrow `stepBadge` & `ProgressBar progress={1}`, đặt nút `"Kiểm tra lại kết quả"` ở `footer`. |
| [`ProfileScreen.tsx`](../apps/driver/src/features/profile/screens/ProfileScreen.tsx) | Hiển thị mô tả động theo trạng thái `verification_status` ngay tại dòng `"Xác minh tài xế"`. |

---

## 5. Bảo Toàn Quy Tắc Nghiệp Vụ & Bảo Mật

- **5 ảnh bắt buộc:** Giữ nguyên `['cccd_front', 'cccd_back', 'gplx_front', 'gplx_back', 'selfie']` ở `workflow.ts`.
- **QR CCCD & GPLX:** Giữ nguyên logic `qrScanDecision`, `collectChoices`, `autofillChoices`, đối chiếu `sameExtractionGeneration`, `submitQrLivePayload`, không tự mở URL trong QR (`Linking.openURL` bị chặn bởi test).
- **Identity Lock & Chống ghi đè:** `isIdentityLockedField` khóa cố định `cccd_id`, `cccd_name`, `cccd_dob` sau duyệt; giữ nguyên `ocrLockedCccdConflict`, `startReverify`, `cancelReverify`, và `requestedChanges` khi `NEEDS_MORE_INFO`.
- **Thay ảnh làm mới kết quả cũ:** Giữ nguyên vô hiệu hóa `qrLiveScan` / `gplxQrLiveScan`, `observations`, `serverExtracted` và `cccdRevalidationNeeded` / `gplxRevalidationNeeded` trong `acceptAsset`.
- **An toàn ảnh & Token:** `DriverPhoto sensitive` dùng `cachePolicy="none"`, xóa file tạm cache qua `removeCacheFile`, truyền `Idempotency-Key` khi nộp.

---

## 6. Đánh Giá Kỹ Thuật Impeccable (Code & Native Audit)

- `impeccable context --target apps/driver/src/features/verification/VerificationScreen.tsx`: Đã chạy thành công.
- `impeccable doctor`: **PASS** (`exit code 0`), ghi nhận 2 lưu ý có sẵn từ trước của repo (`design-sidecar-stale` giữa `DESIGN.md` và `.impeccable/design.json`, và 3 package kế thừa root `PRODUCT.md` — không tự ý sửa ngoài phạm vi theo quy tắc `impeccable`).
- `impeccable detect`: Không áp dụng cho React Native (`critique.md`: native sử dụng đánh giá trực tiếp trên mã nguồn).
- **Chấm điểm Native Audit (`audit.native.md`) trên mã nguồn sau chỉnh sửa:**
  - *Accessibility:* Dùng `Typography`, `FilterChip`, `Button`, `KeyValueRow` (`fontScale`-safe), gán `accessibilityRole`, `accessibilityLabel`, `accessibilityLiveRegion="polite"`, và giữ mục tiêu chạm `>= 48dp`. (Chưa kiểm chứng trực tiếp TalkBack/VoiceOver trên thiết bị -> xem mục 7).
  - *Appearance & Theming:* `tests/theme.test.cjs`, `tests/material-design.test.cjs`, `tests/typography-system.test.cjs` xác nhận 0 raw hex, 0 shadow, 0 border trang trí, 100% semantic typography.
  - *Platform Conformance & Adaptivity:* Safe area qua `DriverPage` / `ScreenWrapper`, `KeyboardAvoidingView behavior="padding"` + `keyboardShouldPersistTaps="handled"`, lưới ảnh `flexWrap` + `minWidth`, `scrollResetKey` reset cuộn khi đổi bước.

---

## 7. Kết Quả Kiểm Chứng Thực Tế (Verification Ledger)

| Kiểm tra | Kết quả | Chi tiết quan sát được |
|---|---|---|
| `cmd /c "npm run check"` (`check:architecture`) | **PASS** | `Architecture passed: thin routes, imports, feature boundaries, environment and shared/UI separation.` |
| `cmd /c "npm run check"` (`typecheck`) | **PASS** | `customer`, `driver`, `@datxe/shared`, `@datxe/ui` chạy `tsc --noEmit` đều thành công (0 lỗi). |
| `cmd /c "npm run check"` (`lint`) | **PASS** | `customer` (`expo lint`) và `driver` (`expo lint` kèm React Compiler) đạt **0 errors, 0 warnings**. |
| `cmd /c "npm run check"` (`npm test`) | **PASS** | **244/244 tests passed**, 0 failed, 0 skipped (bao gồm 16 test trong `tests/driver-verification.test.cjs` và toàn bộ `tests/driver-audit-fixes.test.cjs`, `tests/theme.test.cjs`, `tests/material-design.test.cjs`, `tests/typography-system.test.cjs`). |
| `npx expo export --platform android` (`apps/driver`) | **PASS** | Đóng gói thành công Android Hermes bundle (`3217 modules`, `index-56009ac1bbf4244a5b35e435d4c97913.hbc`, `exit code 0`). |
| `git diff --check` (`F:\datxe_rn`) | **PASS** | `exit code 0`, không có lỗi whitespace / conflict marker. |
| Android Emulator / Thiết bị thật (`adb`, Light/Dark, `font_scale 1.3`, camera/QR live, TalkBack) | **NOT VERIFIED / BLOCKED** | Máy host không cài `adb` (`'adb' is not recognized`) và không có Android emulator/thiết bị kết nối. |
| iOS Simulator / iPhone (Edge-swipe, VoiceOver, Dynamic Type) | **NOT VERIFIED / BLOCKED** | Môi trường Windows, không có macOS/Xcode Simulator. |

## 8. Sửa luồng đăng ký ngày 20/11/2026

### Nguyên nhân và thay đổi

- `acceptAsset` từng xóa toàn bộ QR, kết quả đọc và thông tin tự điền khi nhận bất kỳ ảnh nào. Nay chỉ vô hiệu hóa chứng cứ của giấy tờ vừa thay ảnh. Chụp GPLX giữ CCCD, chụp chân dung giữ cả hai giấy tờ. Lựa chọn bỏ qua QR cũng được giữ khi chụp mục khác.
- Kết quả QR đã lưu trên backend được dùng lại khi hiển thị và điền thông tin. QR đã đọc hiện trạng thái hoàn thành, không yêu cầu quét lại ở bước đọc thông tin.
- Trước khi mở tổng hợp, app kiểm tra đủ năm ảnh, tải ảnh còn chờ và lưu thông tin xác nhận theo revision hiện tại. Lỗi mạng giữ lại dữ liệu để thử lại. Hồ sơ bị thay đổi từ phiên khác phải kiểm tra lại trước khi ghi.
- `F:/datxebackend` trả document hiện tại trong các phản hồi `withWarnings`, tránh dựng trạng thái ảnh từ metadata cũ. Snapshot bản nộp giữ thêm QR GPLX giống QR CCCD.
- Không gọi ảnh là kém chất lượng chỉ vì chưa đọc được QR hoặc chưa nhận diện được khung thẻ. Các lưu ý được gom trùng và ghi rõ ảnh liên quan. Lỗi chặn nộp, chặn kích hoạt và sai lệch nghiêm trọng vẫn hiện trực tiếp.
- Màn tổng hợp có một xác nhận chung gắn với revision máy chủ. Thông tin kỹ thuật nằm trong mục mở rộng. Ngày tháng hiển thị `dd/mm/yyyy`, bỏ hướng dẫn nhập liệu khỏi bảng xem lại.
- Camera có một hướng dẫn chính. Mẹo chụp và chi tiết kiểm tra mở theo nhu cầu. Nút dùng ảnh/chụp lại nằm ngoài vùng chi tiết cuộn. Không báo kiểm tra chất lượng thành công chỉ vì endpoint đọc ảnh trả HTTP thành công.
- Bỏ nhãn trùng trên thumbnail, dùng cache ảnh nhạy cảm trong bộ nhớ. Nhãn chi tiết kiểm tra camera dùng `onScrim` để đọc được trên nền ảnh kể cả khi app đang ở chế độ sáng.
- Màn chờ xét duyệt thu gọn lưu ý không khẩn cấp và không đưa ra thời hạn xét duyệt chưa được xác nhận.

### Kiểm chứng đợt mới

| Phạm vi | Kết quả |
|---|---|
| `npm run check` tại `F:/datxe_rn` | Đạt architecture, typecheck, lint và 249 tests. |
| Regression frontend mới | 5 ca chạy logic phân nhóm, phân loại chất lượng, phạm vi vô hiệu hóa theo giấy tờ, xác nhận theo revision và không gợi ý quét lại QR đã hoàn thành. |
| Backend eKYC | 11 tests của `DriverVerificationIdentityLockTest` và `DriverVerificationWorkflowTest` đạt, không bỏ qua ca nào. |
| PostgreSQL | Chạy migration và luồng integration trên PostgreSQL 17 trong container riêng cổng 55434. Kiểm tra phản hồi ảnh đã tải không còn `DOCUMENT_REQUIRED` cho ảnh đó và snapshot giữ QR GPLX. Container thử đã dừng, không thao tác DB server. |
| Android build | `:app:assembleDebug -PreactNativeArchitectures=x86_64` đạt. |
| Android UI | Pixel 4a emulator, Android 13. Render component thật bằng entry thử tạm với ảnh/thông tin giả, kiểm tra Light/Dark, font 1.0/1.3 và khả năng cuộn tới xác nhận ở 2.0. Camera emulator chụp và mở xem lại ảnh, chi tiết có thể mở và hai nút chính còn khả dụng ở 2.0. Entry thử đã xóa, entry app gốc đã khôi phục. |
| Chưa kiểm chứng | Đăng ký đầy đủ với giấy tờ thật, OCR/QR và đối chiếu khuôn mặt trên dịch vụ triển khai, điện thoại thật, iOS, TalkBack/VoiceOver. Không gọi dịch vụ trả phí hoặc thanh toán thật. |

Bằng chứng giao diện trên máy này nằm trong `C:/Users/quyennv/AppData/Local/Temp/ptitgo-ekyc-ux`, gồm `light-1.3-bottom.png`, `dark-1.3-confirmed.png`, `dark-2.0-bottom.png` và `preview-final.png`. Đây là dữ liệu mẫu kiểm tra bố cục, không phải kết quả xác minh danh tính thật.

### Cập nhật môi trường

Cần phát hành JavaScript mới của app Driver và deploy lại backend để nhận phản hồi document mới cùng snapshot QR GPLX. Không thêm biến môi trường, dependency hoặc migration. Chưa commit, push hoặc deploy trong tác vụ này.
