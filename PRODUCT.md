# Product — PtitGo Ecosystem

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Hệ sinh thái **PtitGo** phục vụ hai nhóm người dùng chính trong giao dịch lái xe hộ tại Việt Nam:

1. **Khách hàng (`apps/customer` — PtitGo):** Chủ phương tiện (ô tô, xe máy) cần thuê tài xế lái xe của chính mình về nhà hoặc đến điểm hẹn an toàn (sau khi dự tiệc, mệt mỏi, công tác hoặc cần đưa đón kèm xe), theo dõi hành trình trực tiếp và thanh toán minh bạch.
2. **Tài xế đối tác (`apps/driver` — PtitGo Tài Xế):** Tài xế đã qua xác minh danh tính điện tử (eKYC CCCD/GPLX/selfie) và kiểm duyệt thủ công, hoạt động linh hoạt ngoài trời và trên đường bằng thao tác một tay, nhận cuốc theo nhóm xe đủ điều kiện và thực hiện bàn giao hiện trạng xe khách hàng.

## Product Purpose

Kết nối nhu cầu **lái xe hộ** an toàn và minh bạch giữa chủ xe và tài xế đủ pháp lý: khách hàng giao tay lái cho đúng người đã xác minh danh tính, tài xế nhận cuốc phù hợp hạng bằng lái, và cả hai bên cùng đối chiếu tình trạng phương tiện trước – sau chuyến đi. Thành công được đo bằng tỷ lệ hoàn thành chuyến an toàn, không tranh chấp bàn giao xe, thời gian thao tác ngắn và sự an tâm của chủ xe.

## Positioning

Khác với ứng dụng gọi xe thông thường nơi tài xế dùng xe riêng, PtitGo giải bài toán **người và xe của khách cùng về đích an toàn** với ba trụ cột nghiệp vụ ràng buộc chặt chẽ:

- **Tài xế xác minh danh tính & năng lực xe theo thời gian thực:** Hồ sơ eKYC lưu vết revision, khóa danh tính sau duyệt (Identity Lock) và tách biệt quyền lái từng nhóm xe từ GPLX.
- **Biên bản hiện trạng & bàn giao xe hai đầu chuyến (`vehicle-inspection`, `handover`):** Ghi nhận ảnh thực tế theo từng pha đón/trả trước khi mở bước tiếp theo.
- **Minh bạch giá & trạng thái vận hành từ backend:** Toàn bộ biểu giá tối thiểu, phụ phí, giảm giá, trạng thái ví và ghép chuyến lấy từ một nguồn sự thật duy nhất ở Spring Boot backend; ứng dụng không tự bịa giá hoặc giả lập trạng thái sẵn sàng.

## Operating Context

- **Môi trường sử dụng thực địa:** Ngoài trời nắng gắt hoặc ban đêm thiếu sáng, trong xe đang đỗ hoặc chuẩn bị di chuyển, mạng di động biến động. Giao diện phải giữ tương phản cao, hỗ trợ Dark Mode hạng nhất và khôi phục an toàn khi mất kết nối.
- **Ngôn ngữ & thị trường:** Việt Nam (tiếng Việt làm chuẩn giao diện, đơn vị tiền tệ đồng Việt Nam `đ`, múi giờ Việt Nam; có lớp dịch `@datxe/shared`), tọa độ dự phòng tại Hà Nội khi chưa có GPS.
- **Nền tảng mục tiêu:** Ứng dụng mobile native đóng gói bằng Expo SDK 58 / React Native 0.88 cho **Android (Material Design 3)** và **iOS (Human Interface Guidelines)**, kèm bản web chỉ mang tính tương thích hạn chế (OTP, Google/Facebook Sign-In và một số luồng native yêu cầu dev build trên thiết bị thật).
- **Hệ sinh thái dùng chung (`packages/ui`, `packages/shared`):** Mọi màn hình của `apps/customer` và `apps/driver` buộc phải tiêu thụ chung token, theme và primitive từ `@datxe/ui`, tuyệt đối giữ tách biệt khỏi logic thuần nghiệp vụ trong `@datxe/shared`.

## Capabilities and Constraints

- **Ràng buộc giao diện & kiến trúc đã kiểm thử tự động:**
  - `scripts/check-architecture.cjs`: Route trong `src/app/` chỉ re-export (tối đa 10 dòng), không import chéo giữa các `features/*`, không đọc `process.env.EXPO_PUBLIC_*` ngoài `config/env.ts`, `packages/shared` không chứa React/UI.
  - `tests/theme.test.cjs` & `tests/material-design.test.cjs`: Cấm màu hex cứng trong màn hình/component ngoài `packages/ui/src/theme/`, cấm bóng đổ (`elevation`, `shadow*`, `boxShadow`) trừ 1 ngoại lệ thanh tìm kiếm trên Home Customer (`homeStyles.ts`), cấm viền trang trí trừ các ngoại lệ chức năng (`functionalOutlines`).
- **Tích hợp phần cứng & dịch vụ native:** Firebase Auth (OTP, Google, Facebook), FCM push notification theo `installationId`, Goong Maps qua MapLibre native, `expo-camera` chụp eKYC có khung hướng dẫn, `@gorhom/bottom-sheet` cho màn bản đồ.
- **Quy chuẩn chất lượng hướng tới:** Độ hoàn thiện tương đương chuẩn sản xuất của Grab, Uber, Gojek trong tác vụ đặt xe/nhận cuốc nhưng giữ nguyên nhận diện hai nhánh màu và ngôn ngữ phẳng của PtitGo.

## Brand Commitments

- **Tên thương hiệu chính thức:** **PtitGo** (app khách) và **PtitGo Tài Xế** / **PtitGoDriver** (app tài xế).
- **Nhận diện màu tách bạch theo vai trò trên nền hệ thống dùng chung:**
  - **Customer:** Coral Crimson (`#B3263D` nền sáng / `#FFB2BF` nền tối) cho hành động đặt chuyến và dẫn hướng khách hàng.
  - **Driver:** Deep Emerald (`#007F46` nền sáng / `#7ED9AA` nền tối) cho trạng thái vận hành, nhận cuốc và xác minh của tài xế; màn hình nhận cuốc thời gian thực luôn dùng nền tối tương phản cao (`offerPalette`).
- **Giọng điệu nội dung (UX Copy):** Trung thực, ngắn gọn, có hành động khắc phục cụ thể khi lỗi hoặc thiếu điều kiện; không giấu trạng thái chưa kiểm tra dưới nhãn "đạt".

## Evidence on Hand

- Source code đầy đủ cho hai app (`apps/customer`, `apps/driver`), thư viện UI (`packages/ui`) và kiểm thử tự động (`tests/theme.test.cjs`, `tests/material-design.test.cjs`, `scripts/check-architecture.cjs`).
- Tài liệu rà soát UX thực tế trên ảnh chụp Android: [docs/ui-ux-audit.md](docs/ui-ux-audit.md) và [docs/ui-ux-audit-round-2.md](docs/ui-ux-audit-round-2.md).
- Chưa có dữ liệu kiểm thử VoiceOver/TalkBack trên iOS simulator và thiết bị iPhone trong repo hiện tại (`docs/ui-ux-audit-round-2.md`); các chuẩn kiểm chứng iOS vẫn là mục tiêu bắt buộc cho phát triển tiếp theo.

## Product Principles

1. **Một ngôn ngữ hệ thống, hai sắc thái vai trò:** Dùng chung một design system từ `packages/ui` và `DESIGN.md`; khác biệt giữa Khách và Tài xế nằm ở palette thương hiệu và nhịp tác vụ, không tạo component hay theme rời rạc.
2. **Đúng việc, ít bước, không mơ hồ:** Mỗi màn hình ưu tiên đúng một hành động chính theo pha nghiệp vụ; thông tin quyết định (địa chỉ, giá tiền, thời hạn, lý do bị khóa) phải đọc được ngay không cần đoán.
3. **Trung thực với trạng thái thực tế:** Luôn phân biệt rõ đang tải, rỗng, lỗi kèm nút thử lại, chưa kiểm tra, thành công và bị khóa — không bao giờ hiển thị lạc quan giả tạo ở giao dịch tiền, eKYC hay bàn giao xe.
4. **Thiết kế cho thiết bị thật khi đang di chuyển:** Tôn trọng safe area, cử chỉ quay lại gốc của Android/iOS, vùng chạm lớn, chữ co giãn theo hệ thống và chế độ giảm chuyển động.

## Accessibility & Inclusion

- **Tiêu chuẩn mục tiêu:** Tuân thủ **WCAG 2.2 AA** ở các tiêu chí áp dụng cho ứng dụng mobile native:
  - Độ tương phản: văn bản nội dung và trạng thái thành công đạt tối thiểu **4.5:1**; chữ lớn, tiêu đề nổi bật và thành phần UI/icon chức năng đạt tối thiểu **3.0:1** trên cả Light và Dark Mode (đã có kiểm thử tự động ở `tests/theme.test.cjs`).
  - Vùng chạm: tối thiểu **48×48 dp** trên Android và **44×44 pt** trên iOS, có khoảng cách an toàn giữa các nút liền kề.
  - Phóng đại chữ & bọc dòng: dùng thang chữ của hệ thống/Material (`sp`), không dùng `adjustsFontSizeToFit` ép thu nhỏ email/địa chỉ quan trọng; các hàng dài phải cho phép xuống dòng hoặc mở rộng xem chi tiết.
  - Screen reader & chuyển động: mọi nút chỉ có icon, switch, badge đếm (như tab Thông báo có số chưa đọc) và cảnh báo phải có `accessibilityLabel` / `accessibilityRole` / `accessibilityState` rõ nghĩa tiếng Việt; tôn trọng cài đặt giảm chuyển động qua `useReducedMotion()`.
