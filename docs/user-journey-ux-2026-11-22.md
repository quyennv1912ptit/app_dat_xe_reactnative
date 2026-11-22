# Rà soát và cải thiện hành trình Customer / Driver

Ngày 22/11/2026; nhánh `integration/mobile-release`, nền Git `9129879`. Bao gồm các sửa F1–F7 của lượt trước trong cùng đợt cập nhật. Tiếp cận theo PRODUCT.md/DESIGN.md, ui-ux-pro-max, Impeccable harden/clarify và quy chuẩn React Native. Giữ nguyên token và hợp đồng backend; không thêm dependencies.

## Phạm vi và thay đổi

| Chặng | Customer | Driver |
| --- | --- | --- |
| Mở app / quyền vị trí | Giải thích mục đích trước hộp thoại OS; cho phép Để sau và chọn điểm thủ công | Giải thích vị trí để nhận cuốc/chia sẻ hành trình; cho phép xem hồ sơ trước |
| Đăng nhập / đăng ký | Giữ sửa chống gửi lặp, khóa form lúc gửi và giữ draft khi lỗi; bàn phím handled | Cùng bảo vệ, kể cả gửi/xác nhận OTP liên kết |
| Thông báo thiết bị | Giải thích lợi ích sau khi đã ra khỏi màn auth, chỉ hỏi lần đầu chưa quyết định; có Để sau | Giải thích cuốc/cập nhật/hỗ trợ, không làm gián đoạn nhập đăng ký; có lối vào quyền từ inbox |
| Danh tính / eKYC | Xác minh số bằng Firebase; không có quy trình CCCD/GPLX như Driver | Bỏ cam kết thời gian chưa có bằng chứng; giải thích 5 ảnh, lần lượt chụp/QR hoặc nhập tay/kiểm tra/nộp/theo dõi duyệt/bật nhóm xe |
| Đặt / nhận chuyến | Địa chỉ đầy đủ, danh sách không cắt chữ; quote/active ride/wallet vẫn do backend quyết định | Offer hiển thị tiền mặt dự kiến sau giảm giá từ `fareEstimate`; chip cho phép wrap, không biến WALLET pending thành đã trả |
| Trong chuyến | Giữ presentation theo trạng thái và revision bàn giao; Reduce Motion cho cuộn form | Giữ CTA theo pha; giải thích thiếu tọa độ khi nút chỉ đường bị khóa; không bịa GPS hoặc ONLINE |
| Kết thúc / thanh toán / đánh giá | Giữ xác nhận thanh toán thực và chống đánh giá trùng; thêm đường hỗ trợ có rideId | Giữ biên nhận/thu tiền/đánh giá theo quyền; thêm hỗ trợ có rideId ở chi tiết chuyến |
| Khiếu nại / hội thoại | Nút tải trang tiếp, không hiển thị empty giả khi lỗi; mở hội thoại sau tạo thành công | Nối hasNext/loadingMore/loadMore từ controller ra danh sách; mở hội thoại sau tạo thành công |
| Soạn hỗ trợ | Chặn cùng-frame gửi lặp; không xóa nội dung trước xác nhận; chọn chủ đề khóa khi gửi | Dùng cùng component; ảnh expo-image memory, báo lỗi chọn ảnh và tôn trọng Reduce Motion |
| Inbox | Thêm Chưa đọc; TICKET_REPLY mở đúng hội thoại hoặc danh sách an toàn nếu thiếu ID; có kiểm tra quyền thông báo | Giữ All/Unread/mark-all và xử lý notification hết hiệu lực; thêm đường kiểm tra quyền thông báo |
| Lịch sử | Giữ tìm mã/địa chỉ, trạng thái, 7/30 ngày và pagination backend | Thêm 30 ngày vào bộ lọc backend đang có; không lọc giả trên riêng trang hiện tại |
| Hồ sơ / quyền nền | Giữ nhóm Dịch vụ & Xe / Hỗ trợ & An toàn / Cài đặt | Tách Hồ sơ tài xế khỏi Cài đặt & hỗ trợ; thêm Kết nối, GPS & thông báo. Giải thích quyền nền và cách giữ app mở khi chưa cấp quyền |

## Những ràng buộc giữ nguyên

- Không bỏ kiểm tra eKYC hoặc tự đánh dấu giấy tờ đạt. QR đã đọc và ảnh server/local vẫn theo logic nguồn hiện có.
- Không mở GPS nền chỉ vì ONLINE: vẫn giới hạn theo chuyến đang hoạt động. Quyền hệ điều hành không đồng nghĩa GPS đã gửi thành công.
- Tiền mặt trên offer chỉ là dự kiến; biên nhận cuối chuyến vẫn là nguồn thu tiền chính thức. Đối chiếu `RideOfferBuilder.kt`: fareEstimate đã trừ discountAmount và làm tròn ở backend.
- Không suy ra thanh toán/đánh giá thành công từ UI. Không sửa khóa tiền, phân quyền hoặc migration.
- Không hợp nhất hai hệ thống support/tickets bằng client; chỉ nối đường điều hướng và ngữ cảnh có sẵn.

## Kiểm chứng và giới hạn

- Regression mới chạy hook/component bằng mocks: chấp nhận/từ chối giải thích quyền vị trí; không hỏi lại quyền denied; bỏ phản hồi cũ sau unmount; tải trang hỗ trợ; retry tạo yêu cầu và gửi chat không mất draft; TICKET_REPLY hợp lệ/không hợp lệ. Mocks không thay thế E2E.
- Kiểm tra nguồn toàn bộ nhóm luồng nêu trên; không có cơ sở tuyên bố mọi màn đã được nghiệm thu hình ảnh hoặc đạt điểm UX tuyệt đối.
- Thiết bị thật được phát hiện nhưng đang dùng ứng dụng khác, chỉ đọc trạng thái; không chuyển app, thay cỡ chữ hoặc thao tác tài khoản thật.
- Emulator Android 13 dùng mạng tắt và code hiện tại để quan sát login Light/Dark/font 1.3. Có cảnh báo Expo Router nhiều linking instance khi đổi cấu hình development client; mở lại app không còn banner trong lần quan sát, chưa kết luận đã sửa native dependency.
- Bố cục chuẩn bị eKYC và OfferDecision được kiểm tra bằng preview component với dữ liệu mẫu ở Light/Dark/font 1.3, không phải nhận cuốc/nộp hồ sơ thật. Đã quan sát nội dung dài cuộn được, tiền mặt/thu nhập/địa chỉ không bị ellipsis trong mẫu. Chưa nghiệm thu toàn bộ AcceptScreen, camera, form eKYC hoặc footer nộp hồ sơ bằng preview này.
- Chưa chạy hành trình xác thực thật, nộp/duyệt eKYC, quyền nền với OEM thật, push ngoài nền, tranh chấp nhận cuốc, giao dịch/hoàn tiền hay native iOS. Không gửi OTP thật, gọi bản đồ trả phí hoặc thanh toán thật.
- `npm run check` cuối PASS: architecture, TypeScript, lint, **319/319 tests**, 0 fail/skip. Log `%TEMP%/ptitgo-whole-journey-complete-check.log`; targeted `%TEMP%/ptitgo-journey-targeted-final.log`.
- Đã khôi phục `apps/driver/index.js` đúng bản gốc (không có diff), xóa `journey-preview.tsx`, dừng Metro và emulator; trả font 1.0/theme light/network emulator về trạng thái đầu. Không thay đổi thiết bị thật.
- Ảnh QA trong `%TEMP%`: `ptitgo-journey-preview-ekyc-light.png`, `ptitgo-journey-preview-ekyc-dark-final.png`, `ptitgo-journey-preview-offer-dark.png`, `ptitgo-journey-preview-offer-light-final.png`. Các ảnh mang nhãn KIỂM TRA BỐ CỤC - DỮ LIỆU MẪU là harness kiểm tra, không phải UI sản phẩm được thêm vào app.
- Chưa push/deploy. Không có env hoặc migration mới; phát hành thay đổi cần cập nhật bundle/bản app theo quy trình hiện có.

## Ưu tiên nghiệm thu tiếp trên môi trường test

1. Tài khoản mới và cũ: từ chối quyền rồi cấp lại; mạng chập chờn; đổi app và quay lại; không mất draft.
2. eKYC đủ 5 ảnh, QR thành công/thất bại/thẻ không QR, sửa ảnh, đọc lại thông tin, pending/needs-more-info/approved và đồng bộ nhóm xe.
3. Offer ở chữ lớn với địa chỉ dài; hết hạn khi đang đọc; cuốc đã được session khác nhận; ví thiếu hạn mức.
4. Bàn giao hai đầu chuyến và revision; kết thúc tiền mặt/ví; lỗi thanh toán; đánh giá một lần và bỏ qua.
5. Khiếu nại có nhiều hơn 20 mục; gửi nội dung/ảnh thất bại; phản hồi từ inbox mở đúng yêu cầu; lọc lịch sử và back về đúng nơi.
