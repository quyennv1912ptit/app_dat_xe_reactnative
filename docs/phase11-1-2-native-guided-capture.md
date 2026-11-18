# Phase 11.1.2 — Chụp ảnh giấy tờ & Selfie có hướng dẫn (Native Guided Document & Selfie Capture)

Repository: `F:\datxe_rn\apps\driver`

---

## 1. Kiến trúc & Thành phần mới

- **`expo-camera` (`~58.0.14`)** tương thích Expo SDK 58 được tích hợp trong `apps/driver` với config plugin:
  - Quyền Android chỉ khai báo `android.permission.CAMERA` (`recordAudioAndroid: false`, `barcodeScannerEnabled: false`), không thêm quyền ghi âm hoặc bộ quét mã vạch dư thừa.
- **Component dùng chung [GuidedCaptureScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/GuidedCaptureScreen.tsx)**:
  - Render `CameraView` native toàn màn hình trong `Modal` hỗ trợ cả dọc và ngang (`supportedOrientations={['portrait', 'landscape']}`).
  - Tự động căn tỷ lệ vùng camera `4:3` khớp với kích thước thực của khung hình chụp để overlay thẳng hàng khi xoay màn hình.
  - Tự động tắt đèn flash và giải phóng camera khi ứng dụng vào nền (`AppState !== 'active'`), làm mới trạng thái quyền khi người dùng quay lại từ Cài đặt hệ thống, chống nhấn đúp (`capturing` lock + timeout 15 giây), và dọn ảnh tạm ngay qua [captureFiles.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/captureFiles.ts) khi hủy/chụp lại.
- **Logic đánh giá chất lượng cục bộ [captureQuality.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/captureQuality.ts)**:
  - Chỉ đánh dấu `pass` cho các tín hiệu thực sự đo được trên thiết bị (`format`, `size <= 8 MB`, `resolution >= 480 px` cạnh ngắn, ánh sáng/rung qua EXIF `ExposureTime` / `ISO`).
  - Các chỉ số chưa đo được cục bộ (`Độ nét`, `Đủ bốn góc, lóa, đúng mặt`, `Khuôn mặt`) hiển thị trung thực là `unchecked` (*Chưa kiểm tra*), tuyệt đối không giả trạng thái đạt xanh hay giả kết quả face matching / liveness.

---

## 2. Chế độ chụp theo loại giấy tờ

### 2.1. CCCD & GPLX (mặt trước / mặt sau)
- Sử dụng camera sau (`facing="back"`), hỗ trợ bật/tắt đèn flash (`enableTorch`).
- Thống nhất khung hướng dẫn **khung dọc tỷ lệ chuẩn ISO/IEC 7810 ID-1 (`54 / 85.6`)** khớp với cảm biến dọc `3:4` để tối đa hóa diện tích và độ nét chữ/QR/MRZ cho cả CCCD và GPLX, với lớp phủ tối xung quanh (`scrim70`) và 4 góc trắng chỉ dẫn (`RectOverlay` dùng `<View>` cạnh vuông không viền trang trí).
- Phân biệt tiêu đề mặt trước / mặt sau rõ ràng, hướng dẫn *Xoay dọc thẻ*; giữ nguyên **chọn ảnh từ thư viện** làm fallback hợp lệ cho giấy tờ.

### 2.2. Selfie
- Sử dụng camera trước (`facing="front"`).
- Khung oval hướng dẫn căn chỉnh khuôn mặt (`OvalOverlay`), lớp phủ tối bên ngoài, nhắc nhở *"Nhìn thẳng · Đủ sáng · Không che mặt"*.
- Ưu tiên chụp trực tiếp bằng camera native; ẩn nút chọn thư viện cũ cho selfie để đảm bảo ảnh đúng thời điểm xác minh.

---

## 3. Xem lại (Preview) & Kiểm tra chất lượng với Backend/Modal

- Không crop cứng gây mất góc ảnh; giữ nguyên độ phân giải gốc (`quality: 0.9`, `skipProcessing: false`) để phục vụ OCR/QR trên Modal.
- Không chạy YOLO trên từng frame preview hoặc stream liên tục lên Modal.
- Trên màn hình **Preview** sau khi chụp:
  - Hiển thị ảnh phóng to rõ ràng và danh sách kết quả kiểm tra cục bộ (`pass` / `warn` / `fail` / `unchecked`).
  - Cho phép **Chụp lại** (xóa file cache cũ) hoặc **Dùng ảnh này** (khóa nếu vi phạm định dạng/dung lượng).
  - Cung cấp nút **Kiểm tra chất lượng qua máy chủ**: chủ động tải ảnh nháp qua `PUT /ekyc/driver-verification/v1/applications/{id}/captures/{slot}` và gọi `POST .../extract/{slot}` (CCCD/GPLX) để nhận cảnh báo thực tế từ Modal/Spring Boot (`IMAGE_BLURRY`, `IMAGE_GLARE`, `CARD_CROPPED`, `CARD_NOT_FOUND`, `IMAGE_TOO_SMALL`), đồng thời cache kết quả theo URI ảnh để Bước 3 (`Đọc thông tin tự động`) không gọi OCR trùng lặp.

---

## 4. Tích hợp & Kiểm thử

- Tích hợp trọn vẹn vào [VerificationScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx) cho toàn bộ 5 slot (`cccd_front`, `cccd_back`, `gplx_front`, `gplx_back`, `selfie`) cả khi đăng ký lần đầu lẫn luồng **Cập nhật giấy tờ / Re-verification (Phase 11.1.1)**, giữ nguyên **Identity Lock**, **revision**, **warnings** và **Admin review**.
- Bộ kiểm thử đơn vị trong [driver-verification.test.cjs](file:///F:/datxe_rn/tests/driver-verification.test.cjs), kiểm thử thiết kế Material (`material-design.test.cjs`), TypeScript (`tsc --noEmit`), `expo lint`, và kiểm thử build + thiết bị Android thật (`10AE3H0A4C000LH`).
