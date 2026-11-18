# Product — PtitGo Tài Xế (`apps/driver`)

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

**Tài xế đối tác PtitGo (`PtitGo Tài Xế` / `PtitGoDriver`):** Người trực tiếp nhận yêu cầu lái xe hộ, di chuyển tới vị trí khách hàng, kiểm tra hiện trạng xe trước/sau khi cầm lái và hoàn tất thu tiền/bàn giao. Bối cảnh sử dụng đặc thù là **cầm một tay trên điện thoại**, đứng ngoài trời hoặc trong khoang lái thiếu sáng, cần ra quyết định trong vài giây mà vẫn đảm bảo an toàn giao thông.

## Product Purpose

Giúp tài xế:
1. Đăng ký, xác minh danh tính & giấy tờ (CCCD, GPLX, selfie) qua luồng chụp ảnh có hướng dẫn và quản lý các nhóm xe được phép nhận lái hộ.
2. Kiểm soát trạng thái trực tuyến, GPS và điều kiện sẵn sàng nhận chuyến một cách minh bạch.
3. Quyết định nhận/từ chối cuốc nhanh với đầy đủ thông tin cốt lõi, điều hướng chính xác, hoàn thành kiểm tra bàn giao xe hai đầu chuyến và theo dõi thu nhập, ví tín dụng/tiền mặt rõ ràng.

## Positioning

Là công cụ tác nghiệp tốc độ cao ưu tiên **an toàn – đọc nhanh – thao tác một tay**: mọi luồng quan trọng (bật nhận chuyến, đồng ý cuốc đang đếm ngược, xác nhận bước bàn giao, mở khẩn cấp/hỗ trợ) đều đặt thông tin quyết định ở phần dễ quét mắt và đặt nút hành động chính trong vùng ngón cái dưới màn hình.

## Operating Context

- **Kế thừa từ hệ sinh thái:** Sử dụng chung bộ token, `AppThemeProvider` (`brand="driver"`), component và quy chuẩn thiết kế từ root [PRODUCT.md](../../PRODUCT.md) và [DESIGN.md](../../DESIGN.md).
- **Các luồng nghiệp vụ chính trong `apps/driver/src/features/`:**
  - `auth` & `verification`: Đăng nhập/OTP, luồng 5 bước xác minh tài xế (`GuidedCaptureScreen` dùng `expo-camera` với khung dọc ID-1 cho CCCD/GPLX và khung oval camera trước cho selfie), kiểm tra chất lượng cục bộ + tùy chọn kiểm tra máy chủ, khóa danh tính sau duyệt (`APPROVED`) và cập nhật gia hạn/nâng hạng GPLX, màn chọn nhóm xe nhận lái hộ (`/profile/capabilities`).
  - `offers` (Home & Offer): Trang chủ ưu tiên trạng thái vận hành & GPS blocker; modal/màn `ride/accept` nhận cuốc hiển thị nền tối tương phản cao bất kể theme hệ thống (`offerPalette`), đồng hồ đếm ngược 25 giây (kèm margin 2 giây từ server) dùng chữ số `tabular-nums`, hiển thị rõ địa chỉ đón/trả.
  - `ride`: Điều hướng Goong (`directions`), kiểm tra hiện trạng xe (`vehicle-inspection`), bàn giao (`handover`), trong chuyến (`in-progress`), hoàn tất & thu tiền mặt (`complete`).
  - `history`, `notifications`, `chat`, `profile`, `tickets`, `support`, `safety`, `settings`: Lịch sử chuyến, ví tài xế (phân biệt ví tín dụng và tiền mặt, nạp/rút tiền), đánh giá từ khách, cài đặt trạng thái nhận chuyến (`/settings/reception`) và hỗ trợ khẩn cấp (`/safety`).

## Capabilities and Constraints

- **Ưu tiên thao tác một tay:** CTA chính (`Bật nhận chuyến`, `Chấp nhận cuốc`, `Dùng ảnh này`, `Xác nhận pha bàn giao`) đặt ở vùng dưới vừa tầm ngón cái, chiều cao nút tối thiểu `48dp` (`Button`), khoảng cách an toàn tránh bấm nhầm giữa Chấp nhận và Từ chối hoặc giữa các bước chụp.
- **Đọc nhanh ngoài trời & trong cabin:** Số tiền thu, đếm ngược cuốc và địa chỉ đón/trả không nén dưới cỡ chữ khó đọc hay cắt mất phần quận/huyện quan trọng khi nhận cuốc; cảnh báo thiếu quyền GPS, hết hạn GPLX hoặc tạm giữ danh tính phải xuất hiện nổi bật kèm hành động khắc phục trực tiếp.
- **Tối ưu phần cứng an toàn:** Camera xác minh phải giải phóng khi app vào nền (`AppState`), khóa nhấn đúp khi chụp, không tự ý lưu ảnh giấy tờ ra thư viện công cộng và không giả lập nhận diện góc thẻ hoặc người thật.
- **Tôn trọng kiến trúc & ranh giới:** Feature trong `src/features/` không import chéo lẫn nhau; `src/app/` chỉ giữ file re-export (tối đa 10 dòng).

## Brand Commitments

- **Sắc thái thương hiệu Driver:** Deep Emerald (`#007F46` light / `#7ED9AA` dark) làm màu nhấn hành động chính; riêng bề mặt nhận cuốc dùng `offerPalette` tối (`#121212` / `#1E1E1E` / `#48E2A3`) để bảo đảm tương phản tối đa khi có cuốc gấp.
- **Ngôn từ điều hướng:** Dứt khoát, theo pha hành động (*Bật nhận chuyến*, *Đang tìm GPS*, *Đón xe*, *Trả xe*, *Đã xác minh*), giải thích rõ lý do khi bị chặn quyền nhận chuyến.

## Evidence on Hand

- Luồng eKYC/Identity Lock/Guided Capture đã hoàn thiện và kiểm thử thực tế trên Android (`docs/phase11-1-1-identity-lock.md`, `docs/phase11-1-2-native-guided-capture.md`).
- Danh mục cải thiện UX còn mở được ghi nhận tại `docs/ui-ux-audit.md` và `docs/ui-ux-audit-round-2.md` (ví dụ: hiển thị đủ địa chỉ trên `OfferDecision`, tách rõ lỗi thiếu ngữ cảnh chuyến ở `RideDirectionsScreen`, trạng thái tải/lỗi ảnh ở `TicketChat`).

## Product Principles

1. **Thông tin an toàn đứng trước số liệu thống kê:** Trên Home, tình trạng sẵn sàng, GPS và các chặn điều kiện pháp lý (eKYC/GPLX) luôn được ưu tiên nhìn thấy trước thống kê thu nhập.
2. **Thao tác một tay không bấm nhầm:** Tác vụ chính nằm ở dưới cùng, kích thước lớn, nút mang ý nghĩa đối nghịch hoặc hủy bỏ tách bạch rõ ràng.
3. **Thấy đủ để quyết định trong 3 giây:** Khi có cuốc mới, tài xế phải nhìn rõ điểm đón, điểm trả, loại xe/thu tiền và thời gian còn lại trước khi bấm nhận.
4. **Không tự động đánh dấu đạt giả:** Cả chụp giấy tờ lẫn kiểm tra GPS/bàn giao xe chỉ báo xanh khi có bằng chứng xác thực từ thiết bị hoặc máy chủ.

## Accessibility & Inclusion

- Tuân thủ đầy đủ chuẩn WCAG 2.2 AA, vùng chạm `>= 48×48 dp` (Android) / `>= 44×44 pt` (iOS), `tabular-nums` cho đồng hồ đếm ngược và số tiền, bọc dòng cho địa chỉ/email dài và hỗ trợ `useReducedMotion()`.
- Mọi trạng thái cảnh báo thời gian/hết hạn không chỉ dựa vào màu sắc mà phải kèm chữ và icon rõ ràng để hỗ trợ người dùng bị suy giảm nhận diện màu và trình đọc màn hình.
