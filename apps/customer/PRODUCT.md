# Product — PtitGo Customer (`apps/customer`)

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

**Khách hàng chủ xe (`PtitGo`):** Người sở hữu hoặc đang sử dụng phương tiện cá nhân cần tìm tài xế lái hộ đưa cả người và xe về an toàn. Khách hàng thường mở app trong lúc vừa kết thúc buổi gặp gỡ, đang ở điểm đỗ xe, hoặc lên lịch trước trên điện thoại; yêu cầu trải nghiệm **nhanh gọn, dễ hiểu ngay lần đầu, ít bước thừa và minh bạch tuyệt đối** về tài xế, lộ trình, hiện trạng xe và chi phí.

## Product Purpose

Cho phép khách hàng:
1. Đặt tài xế lái hộ ngay hoặc đặt lịch hẹn chỉ với vài chạm tối thiểu (quản lý xe cá nhân, chọn điểm đón/trả chính xác, xem giá minh bạch từ máy chủ).
2. Theo dõi tài xế theo thời gian thực, xem hồ sơ/đánh giá tài xế đã xác minh, liên hệ qua chat hoặc gọi điện và cùng kiểm tra biên bản bàn giao hiện trạng xe.
3. Thanh toán rõ ràng (tiền mặt, ví PtitGo, MoMo), áp dụng ưu đãi hợp lệ và quản lý lịch sử chuyến, vé hỗ trợ, địa điểm đã lưu.

## Positioning

Trải nghiệm **giao xe an tâm ngay từ bước đặt chuyến**: thay vì các màn form rườm rà, PtitGo dẫn dắt khách hàng qua một dòng chảy liên tục từ bản đồ & thẻ đặt chuyến 3 tầng trên Home → chọn xe của mình → bảng giá chi tiết không phí ẩn → theo dõi tài xế & biên bản xe trực quan.

## Operating Context

- **Kế thừa từ hệ sinh thái:** Sử dụng chung bộ token, `AppThemeProvider` (`brand="customer"`), component và quy chuẩn thiết kế từ root [PRODUCT.md](../../PRODUCT.md) và [DESIGN.md](../../DESIGN.md).
- **Các luồng nghiệp vụ chính trong `apps/customer/src/features/`:**
  - `auth`: Đăng nhập/đăng ký SĐT + OTP, Google/Facebook Sign-In, bổ sung SĐT, điều khoản & chính sách.
  - `booking`: Home trên `MapSheetLayout` (lời chào, thẻ ví trung tính, thẻ đặt chuyến nổi bật với điểm đón xanh/điểm đến tonal primary và nút hẹn giờ), `route-selection` → `pickup` / `destination` (gợi ý gần đây, phổ biến, ghim chi tiết Goong, chọn 1 chạm địa điểm đã lưu có tọa độ) → `map-picker` → `place-detail` → `vehicle` (danh sách xe của khách) → `confirm` (giá mở đầu, km, tối thiểu, voucher, phương thức trả, đặt lịch) → `find-driver` (radar quét).
  - `tracking`: Theo dõi tài xế đến điểm đón & trong chuyến, thẻ hồ sơ & đánh giá tài xế, chia sẻ trạng thái chuyến, màn hoàn tất (`completed`) và chi tiết hóa đơn (`ride/[id]`).
  - `vehicles`, `vouchers`, `wallet`, `chat`, `history`, `notifications`, `profile`, `support`, `tickets`, `settings`: Quản lý xe, ví và nạp tiền, ưu đãi, trò chuyện với tài xế, kiểm tra xe (`vehicle-inspection`) và gửi hỗ trợ.

## Capabilities and Constraints

- **Giảm bước thao tác thừa:** Địa điểm đã lưu có tọa độ hợp lệ chọn trực tiếp vào lộ trình; các entry point trên Home (đổi điểm đón, tìm điểm đến, hẹn giờ) phải phản ánh đúng ý định bấm của người dùng thay vì gom vào một luồng chung; từ màn xác nhận cho phép quay lại chỉnh từng mục mà không mất nháp.
- **Minh bạch tuyệt đối trước khi đặt & khi thanh toán:** Hiển thị rõ cấu phần giá, mức tối thiểu của backend, điều kiện voucher, cảnh báo khi giá thay đổi trước lúc tạo chuyến và trạng thái đã thu/chờ thu tiền mặt. Dùng `idempotency key` cho đặt chuyến và giao dịch tiền để tránh tạo trùng khi mạng chập chờn.
- **Tôn trọng địa chỉ Việt Nam đầy đủ:** Không tự ý cắt cụt số nhà, ngõ, ngách trên màn chọn hoặc xác nhận; khi bản đồ không định vị được GPS phải cho phép chọn thủ công và thông báo rõ giới hạn.
- **Ranh giới mã nguồn:** Tuân thủ `scripts/check-architecture.cjs` — không import chéo giữa `features/*`, giữ route `src/app/` thuần re-export (<= 10 dòng).

## Brand Commitments

- **Sắc thái thương hiệu Customer:** Coral Crimson (`#B3263D` light / `#FFB2BF` dark) làm màu nhấn chính cho điểm đến và CTA đặt tài xế, phân biệt nhẹ với hai màu định vị trên lộ trình (`ridePickup` `#2F6BFF`, `rideDropoff` `#F2B705` kèm chữ/icon than `#1B1B1F` đạt chuẩn tương phản).
- **Ngôn từ thân thiện & rõ ràng:** Dùng văn phong gần gũi, minh bạch (*Đặt chuyến lái hộ*, *Xác nhận đặt lịch*, *Đang tìm tài xế*), luôn nói rõ lý do nếu nút bị khóa (thiếu xe, thiếu giá, đang có chuyến chưa hoàn tất).

## Evidence on Hand

- Luồng đặt chuyến, bản đồ Goong, khám phá địa điểm (`docs/place-discovery.md`), ví, đánh giá tài xế và kiểm toán UX (`docs/ui-ux-audit.md`, `docs/ui-ux-audit-round-2.md`) đã ghi nhận cụ thể những điểm mạnh và các lỗi cần tiếp tục hoàn thiện (như chọn 1 chạm địa điểm đã lưu, vùng chạm `RideRouteBar`, độ tương phản icon trên nền vàng `rideDropoff`).

## Product Principles

1. **Ít bước hơn, ít phân vân hơn:** Giữ Home gọn 3 tầng; thao tác quen thuộc (chọn Nhà/Cơ quan, đổi điểm đón, hẹn giờ) đi thẳng vào đúng đích.
2. **Giá cả và hiện trạng luôn trước mắt:** Khách biết chính xác mình đi xe nào, trả bao nhiêu, ưu đãi nào áp dụng và tài xế nào đang nhận xe trước khi xác nhận.
3. **An toàn thao tác chạm trên bản đồ và sheet:** Thanh lộ trình, ghim bản đồ và nút xác nhận trên `MapSheetLayout` phải đủ cao để chạm chính xác và không bị bàn phím hay system bar che khuất.
4. **Phản hồi rõ ràng ở mọi trạng thái mạng:** Khi không tìm thấy địa điểm, mất mạng lúc gọi báo giá hay chờ ghép tài xế, luôn giữ lại ngữ cảnh đã nhập và đưa ra bước khôi phục dễ hiểu.

## Accessibility & Inclusion

- Tuân thủ WCAG 2.2 AA: vùng chạm tối thiểu `48×48 dp` Android / `44×44 pt` iOS (đặc biệt lưu ý hàng chọn đón/đến và nút hoán đổi lộ trình), tương phản `>= 4.5:1` cho chữ thường và `>= 3:1` cho icon/label chức năng (dùng màu tối `onRideDropoff` trên nền vàng `#F2B705` thay cho chữ/icon trắng).
- Hỗ trợ Dynamic Type / font scaling trên iOS & Android: mọi sheet (`SavePlaceSheet`, `ReportPlaceSheet`), địa chỉ ngõ/ngách và email hồ sơ phải cuộn/xuống dòng tự nhiên, không ép cắt một dòng khi tăng cỡ chữ.
