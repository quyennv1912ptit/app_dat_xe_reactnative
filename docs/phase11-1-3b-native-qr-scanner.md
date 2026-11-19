# Phase 11.1.3B — Native Live QR Scanner (`apps/driver`)

Repository: `F:\datxe_rn\apps\driver`  
Prerequisite: Phase 11.1.3A (`F:\ekyc-service` & `F:\datxebackend`)

---

## 1. Kiến trúc & Thành phần đã triển khai

### 1.1. Cấu hình `expo-camera` (`~58.0.14`)
- Bật `"barcodeScannerEnabled": true` và cập nhật mô tả `cameraPermission` trong [app.json](file:///F:/datxe_rn/apps/driver/app.json), giữ `recordAudioAndroid: false`.
- Gỡ `expo.camera.barcode-scanner-enabled=false` khỏi [gradle.properties](file:///F:/datxe_rn/apps/driver/android/gradle.properties) để bản build native Android bật bộ giải mã QR của `expo-camera`.

### 1.2. Màn hình quét QR trực tiếp — [QrScannerScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/QrScannerScreen.tsx)
- Mở toàn màn hình trong `Modal` dùng `CameraView` (`expo-camera` `~58.0.14`) với `facing="back"` và `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`.
- **Khung hướng dẫn & lớp phủ:** Khung vuông căn giữa (`SquareQrOverlay`) vẽ bằng 4 lớp phủ tối `colors.scrim70` và 8 thanh góc `<View>` (không viền trang trí, tuân thủ `material-design.test.cjs`), kết hợp panel đáy dùng token `@datxe/ui` để đảm bảo tương phản WCAG 2.2 AA cả Light/Dark mode.
- **Điều khiển & hướng dẫn theo mẫu thẻ:**
  - Nút bật/tắt đèn flash (`enableTorch={torch}`) tự động tắt khi quét xong hoặc khi app vào nền.
  - Chuyển nhanh giữa **CCCD 2021 · Mặt trước** (hướng dẫn góc trên bên phải mặt trước) và **Căn cước 2024 · Mặt sau** (hướng dẫn mã QR mặt sau).
  - Rõ 4 trạng thái UI: `scanning` (camera sống), `submitting` (loading đang gửi máy chủ), `success` (đã nhận QR chờ đối chiếu), `error` (lỗi format/mạng/revision) cùng 2 nút rõ nghĩa **Quét lại** và **Bỏ qua**.
- **Quyền camera & vòng đời:** Dùng `useCameraPermissions()`, hỗ trợ mở Cài đặt khi quyền bị từ chối vĩnh viễn (`!canAskAgain`), giải phóng camera + tắt đèn flash + hủy request đang chạy khi `AppState !== 'active'`.

### 1.3. Bảo vệ payload, chống trùng & không tự mở URL
- `handleBarcodeScanned` dùng khóa đồng bộ `scanLock.current` (cùng việc chuyển sang `phase = 'submitting'`) để chặn toàn bộ callback lặp ngay trong cùng frame và không gửi video hay luồng frame liên tục.
- Chuỗi QR đọc được chỉ gửi thẳng tới endpoint authenticated `POST /ekyc/driver-verification/v1/applications/{id}/qr-scan` qua `submitQrLivePayload` trong [VerificationScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx).
- Không gọi `Linking.openURL` với dữ liệu QR và không tự parse/tin trường dữ liệu phía client.

---

## 2. Điều phối quy trình & Đọc từ ảnh vs Quét trực tiếp

Hàm `qrScanDecision()` trong [workflow.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/workflow.ts) và luồng `continueAfterDocumentBack()` / Bước 3 (`OCR`) trong [VerificationScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx) yêu cầu đủ `5/5` ảnh bắt buộc (`gplx_back` bắt buộc) và kích hoạt kiểm tra QR ngay sau khi hoàn tất chụp mặt sau CCCD (`cccd_back`) lẫn mặt sau GPLX (`gplx_back`), đồng thời vẫn có ở Bước 3 `OCR` và Bước 4 `CONFIRM_FIELDS`:

| Trạng thái từ ảnh CCCD | Chế độ (`QrPromptMode`) | Hành vi trong Bước 3 |
|---|---|---|
| `DECODED_VALID` / `CONFLICT` | `SKIP_DECODED` | Tự động bỏ qua màn hình quét QR trực tiếp thêm |
| `DETECTED_UNREADABLE` | `RECOMMEND_LIVE_SCAN` | Đề nghị nổi bật **Quét mã QR trực tiếp** kèm nút **Bỏ qua · Dùng OCR / nhập tay** |
| `NOT_FOUND` (mẫu 2021/2024) / `INVALID_FORMAT` / `UNSUPPORTED_FORMAT` | `ALLOW_LIVE_SCAN` | Cho phép chọn **Quét mã QR trực tiếp** hoặc **Bỏ qua** |
| Thẻ không có QR (`cardHasQrExpected: false`) hoặc người dùng bấm Bỏ qua | `NO_QR_CARD` / `qrSkipped` | Tiếp tục bằng OCR và nhập tay |
| Lỗi mạng / timeout / `ENGINE_UNAVAILABLE` | `SERVER_FALLBACK` | Không khóa quy trình: cho phép **Quét mã QR trực tiếp** hoặc nhập tay |
| Đã quét trực tiếp (`DECODED_VALID` / `CONFLICT`) | `LIVE_SCANNED` | Hiển thị trạng thái đã nhận mã QR (chờ đối chiếu) và nút **Quét lại mã QR** |

---

## 3. Form xác nhận, Nguồn dữ liệu & Vô hiệu hóa khi thay ảnh

- **Đề xuất & hiển thị nguồn ([workflow.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/workflow.ts), [VerificationScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx)):**
  - `collectChoices(observations, liveQr)` tách bạch `ProposalOrigin`: `QR_IMAGE` (**Đọc từ QR trên ảnh**), `QR_LIVE_SCAN` (**Đọc từ quét QR trực tiếp**), `OCR` (**OCR**), và trạng thái chỉnh tay `manualFields` (**Tài xế nhập**).
  - `autofillChoices` chỉ điền sẵn trường còn trống khi có đúng 1 đề xuất hợp lệ, không mâu thuẫn (`!conflict`), không nằm trong `touched`, và không thuộc Identity Lock (`isIdentityLockedField`).
  - Giao diện không bao giờ hiển thị nhãn **"Đã xác thực danh tính"** chỉ vì giải mã được QR; luôn giữ nguyên các candidate gốc và cảnh báo (`verificationWarnings`) để admin kiểm tra.
- **Vô hiệu hóa khi thay ảnh CCCD (`acceptAsset`, `cancelReading`, `sameExtractionGeneration`):**
  - Khi thay `cccd_front` hoặc `cccd_back`: tăng `generation.current`, hủy các request `/extract` và `/qr-scan` đang chạy, xóa `observations` + `liveQr` cũ gắn với ảnh trước, đặt cờ `cccdRevalidationNeeded` yêu cầu đối chiếu lại QR/OCR, đồng thời giữ nguyên dữ liệu đã được admin duyệt (`approvedDocument.confirmed`) và các trường **Identity Lock**.

---

## 4. Kết quả kiểm thử tự động & Ma trận kiểm thử Android

### 4.1. Kiểm thử tự động (`F:\datxe_rn`)
- `npm run check:architecture`: PASSED.
- `npm run typecheck` (`customer`, `driver`, `@datxe/shared`, `@datxe/ui`): PASSED.
- `npm run lint` (`expo lint` cho `customer`, `driver`): PASSED (0 errors, 0 warnings).
- `npm test` (`node --test tests/*.test.cjs`): 243/243 PASSED (bao gồm 3 bài test Phase 11.1.3B + GPLX QR / `gplx_back` bắt buộc trong [driver-verification.test.cjs](file:///F:/datxe_rn/tests/driver-verification.test.cjs), kiểm thử `theme.test.cjs`, `material-design.test.cjs`, `typography-system.test.cjs`).

### 4.2. Ma trận kiểm thử thiết bị Android thật (`DEVICE_VALIDATION_PENDING`)

| Kịch bản kiểm thử thực tế | Kết quả kỳ vọng | Trạng thái |
|---|---|---|
| CCCD gắn chip mẫu 2021 (QR trên ảnh rõ) | `DECODED_VALID` bỏ qua quét trực tiếp; nguồn `Đọc từ QR trên ảnh` | `DEVICE_VALIDATION_PENDING` |
| Căn cước mẫu 2024 (QR mặt sau mờ trên ảnh -> quét trực tiếp) | Gợi ý mở `QrScannerScreen`, hướng dẫn mặt sau, nguồn `Đọc từ quét QR trực tiếp` | `DEVICE_VALIDATION_PENDING` |
| Quét QR hợp lệ vs QR không đọc được / sai định dạng | Hợp lệ hiện `success`; sai định dạng báo lỗi rõ ràng, cho `Quét lại` hoặc `Bỏ qua` | `DEVICE_VALIDATION_PENDING` |
| Quét QR của thẻ người khác (hoặc khác OCR/Identity Lock) | Giữ cảnh báo mâu thuẫn, không ghi đè Identity Lock, báo xung đột số CCCD | `DEVICE_VALIDATION_PENDING` |
| Bấm `Bỏ qua` hoặc thẻ cũ không có QR | Tiếp tục mượt qua `CONFIRM_FIELDS` với OCR/nhập tay | `DEVICE_VALIDATION_PENDING` |
| Mất mạng khi đang ở Bước 3 hoặc đang gửi `/qr-scan` | Không khóa workflow, cho phép thử lại hoặc chuyển sang nhập tay | `DEVICE_VALIDATION_PENDING` |
| Từ chối quyền camera (tạm thời / "Don't ask again") | Hiện lý do rõ, nút cấp quyền / Mở cài đặt và nút Bỏ qua | `DEVICE_VALIDATION_PENDING` |
| Quét nhiều lần liên tiếp / camera giữ 1 QR lâu | `scanLock` + UI `submitting` chặn callback lặp và request trùng | `DEVICE_VALIDATION_PENDING` |
| Quay lại thay ảnh `cccd_front` hoặc `cccd_back` | Hủy request cũ, xóa `liveQr` + đề xuất ảnh cũ, hiện nhắc đối chiếu lại | `DEVICE_VALIDATION_PENDING` |
| Luồng Re-verification, Driver submit & Admin review | Revision đồng bộ sau `/qr-scan`, submit & admin panel nhận đủ `qrLiveScan` + warnings | `DEVICE_VALIDATION_PENDING` |
