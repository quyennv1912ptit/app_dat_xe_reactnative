# Rà soát UI/UX PtitGo

> Bản rà soát lần 2: xem [ui-ux-audit-round-2.md](ui-ux-audit-round-2.md). Bản mới ưu tiên bằng chứng mã nguồn, phân biệt lỗi xác nhận với đề xuất, sửa các nhận định quá rộng của bản này và bổ sung danh mục từng route.

Ngày 15/11/2026. Phạm vi gồm các route Customer và Driver trong `src/app`, 26 ảnh Customer và 29 ảnh Driver của phiên Android hiện tại, cùng 61 ảnh Driver từ bộ dữ liệu mẫu trước đó. Layout và redirect được tính chung với màn chúng điều hướng đến. Các mục ghi “mã” là đề xuất từ mã nguồn hoặc kịch bản chưa có ảnh đủ dữ liệu. Màu, vùng chạm, TalkBack và chữ phóng lớn cần đo/chạy lại trước khi kết luận đạt chuẩn. Ảnh phiên thật để ở thư mục screenshot và có dữ liệu cá nhân.

Áp dụng checklist Accessibility, Touch & Interaction, Layout, Typography và Forms của ui-ux-pro-max cho React Native. Gợi ý tự động thiên về dashboard/web, nên giữ hệ Material, màu đỏ Customer và xanh Driver hiện có. Mục tiêu kiểm thử là chữ thường tương phản ít nhất 4,5:1, vùng chạm Android 48dp và iOS 44pt, nội dung chính bọc dòng khi tăng cỡ chữ.

## Ưu tiên sửa

| Mức | Vị trí | Dấu hiệu và thay đổi đề xuất |
|---|---|---|
| P1 | Customer · Home → chọn địa điểm → xác nhận | Map, ví và vùng đặt chuyến cùng chiếm vùng đầu màn. Giữ thanh Đón/Đến và một CTA đặt chuyến dễ thấy. Tách vai trò của nút hẹn giờ bằng nhãn dễ hiểu. Địa điểm có tọa độ chọn trực tiếp; hiển thị tên và địa chỉ trên hai dòng. |
| P1 | Cả hai · Chuyến đang chạy, nhận cuốc, biên bản | Địa chỉ, thời hạn, số tiền và thao tác tiếp theo phải đọc được khi nhìn nhanh. Tổ chức theo thứ tự trạng thái → điểm đến/đón → một CTA theo pha; đặt chat, chỉ đường phụ và hỗ trợ trong nhóm riêng. Test đủ nhánh đón và trả xe. |
| P1 | Driver · Xác minh thử nghiệm | Ảnh cho thấy thông báo điều kiện bị dồn sát thanh hệ thống, phần còn lại gần như trống. Mã dùng nền/chữ hex, khác theme. Dùng DriverPage với safe area, tiêu đề, lý do chưa truy cập được và hướng dẫn bước tiếp theo. |
| P1 | Cả hai · OTP, form và chat | Thử bàn phím mở trên khung 360dp; giữ trường đang focus và CTA trong vùng có thể cuộn. Cho OTP dán/tự điền, giữ nút đổi số và gửi lại; hiện lỗi ngay cạnh trường. |
| P1 | Cả hai · Loading và lỗi | Ảnh chi tiết chuyến và thông báo có lúc chỉ hiện spinner; Driver directions còn hiển thị lỗi thiếu thông tin. Giữ tiêu đề, skeleton theo bố cục, và phân biệt đang tải, không có dữ liệu, lỗi, không đủ điều kiện. Luôn đưa ra CTA khôi phục đúng ngữ cảnh. |
| P2 | Cả hai · Lịch sử, ví, thông báo | Tăng khả năng quét bằng thứ bậc mã/trạng thái, số tiền và thời gian. Đưa thời gian và ghi chú xuống dòng riêng; nhóm theo ngày; giữ danh sách cũ khi làm mới. Dùng số tabular cho tiền và đếm ngược. |
| P2 | Cả hai · Hồ sơ và đánh giá Driver | Profile đang ép email một dòng và tự thu chữ. Bọc email, nhóm danh tính/liên hệ, dùng nhãn trạng thái có chữ; tóm tắt điểm, tổng lượt và cho mở rộng nhận xét. Ảnh Driver cho thấy lỗi tải đánh giá; kiểm thử với API có dữ liệu, rỗng và lỗi. |
| P2 | Hệ dùng chung · Mật độ và tương phản | Audit chữ 12 ở nhãn lộ trình, giá, map và biên bản. Đưa thông tin cần quyết định lên body 14–16sp, nội dung dài ưu tiên 16sp với khoảng dòng hợp lý. Đo các cặp chữ phụ/nền, chip và CTA trên sáng/tối; icon-only có nhãn và vùng chạm đủ. |
| P3 | Driver · ảnh development | Bánh răng Expo che vùng header trong ảnh. Chụp lại bản release khi nghiệm thu; đánh giá khoảng cách header bằng ảnh không có lớp phủ dev. |

## Customer theo màn hình

| Màn hình / route | Nguồn | Việc nên sửa |
|---|---|---|
| Khởi động / | Mã | Trạng thái khôi phục phiên có lời dẫn; hẹn lỗi mạng và thử lại nếu chờ lâu. |
| Login, register, add-phone-number, otp-verify | Ảnh + mã OTP | Thống nhất tiêu đề và bước tiếp theo. Nhãn trường luôn hiện; chọn mã nước và số điện thoại dễ đọc; nhóm đăng nhập xã hội dưới CTA chính. OTP xem P1. |
| Home | Ảnh | Gom điểm đón/đến thành nhóm nổi bật; giảm cạnh tranh với ví; kiểm tra vị trí và thao tác đổi điểm đón không cần mở rộng sheet. |
| Route-selection, pickup, destination | Ảnh pickup + mã | Rõ đang chọn Đón hay Đến; giữ đích trước đó với tọa độ; phân nhóm đã lưu/gần đây/kết quả; trạng thái tìm kiếm trống có chọn bản đồ. |
| Map-picker, place-detail | Mã | Ghim được chọn, tên/địa chỉ và nút xác nhận rõ; giữ safe area, có nút thay cho thao tác chỉ kéo; báo giới hạn khi chưa định vị được. |
| Vehicle, confirm | Mã | Tăng khả năng so sánh loại xe; giữ lộ trình, lịch hẹn, phương thức trả và tổng giá ngay trước CTA; lý do CTA bị khóa phải đọc được. |
| Find-driver, tracking, driver profile modal | Mã | Diễn đạt bước tìm/đã gán/đang đến bằng chữ; trạng thái GPS, liên hệ và đánh giá ở đúng ngữ cảnh; đảm bảo sheet cuộn độc lập với nút liên hệ. |
| History, ride/[id], completed, vehicle-inspection | Ảnh lịch sử/chi tiết + mã | Ảnh lịch sử có địa chỉ dài và chip dày; tách dòng đón/trả, ưu tiên trạng thái và tổng tiền. Trang hoàn tất làm rõ đã thu/chờ thu; biên bản nhóm ảnh theo pha và chỉ ra ảnh thiếu. |
| Chat | Mã | Giữ composer trên bàn phím; dễ nhận ra gửi lỗi và nút thử lại; nhãn đọc được cho gửi, ảnh và cuộc gọi. |
| Profile, edit-profile | Ảnh | Bọc email và tên dài; nhóm thông tin thành cá nhân, phương tiện, thanh toán, hỗ trợ. Giữ nút lưu có trạng thái và báo lỗi cạnh trường. |
| Vehicles, add-vehicle | Ảnh | Nổi bật biển số/loại xe; đặt vùng chạm xóa đủ lớn và xác nhận; tách nhóm bắt buộc và ảnh tùy chọn. |
| Wallet, wallet/top-up, payment-methods, vouchers | Ảnh | Tách số dư khỏi sổ giao dịch; dòng giao dịch có loại, trạng thái, số tiền dễ quét. Nạp tiền giải thích hạn mức và lỗi tại trường. Voucher rỗng có đường quay lại đặt chuyến. |
| Notifications | Ảnh | Giữ bộ lọc và hành động đọc tất cả có phân cấp; trạng thái chưa đọc có chữ/nhãn cho TalkBack, tránh chỉ chấm màu. |
| Support, tickets, tickets/new, tickets/[id] | Ảnh danh sách/tạo + mã | Tên nhóm hỗ trợ rõ, nút tạo dễ thấy khi rỗng. Mã chuyến ghi tùy chọn; lỗi, mức ký tự và trạng thái tải ảnh dưới trường liên quan. Chat ticket nên đồng nhất với chat chuyến. |
| Settings, settings/[section] | Ảnh | Tách tùy chọn thông báo, quyền hệ thống và địa điểm đã lưu. Quyền bị từ chối cần nút mở đúng cài đặt; địa điểm đã lưu hiển thị tên và địa chỉ rõ ràng. |
| Privacy-policy, terms-of-service | Ảnh | Thêm mục lục rút gọn cho nội dung dài, tăng khoảng dòng, giữ ngày cập nhật dễ tìm. |

## Driver theo màn hình

| Màn hình / route | Nguồn | Việc nên sửa |
|---|---|---|
| Khởi động / | Ảnh mẫu + mã | Thêm trạng thái khôi phục phiên và xử lý chờ lâu; kiểm tra màn cold start khi mất mạng. |
| Login, login-help, register, otp-verify | Ảnh + mẫu OTP | Giữ một CTA rõ, có trợ giúp ổn định; đăng ký cho thấy bước hiện tại. Kiểm tra OTP khi bật bàn phím và phóng chữ. |
| License-upload, verify-id, approval-status | Ảnh | Nhóm trường theo giấy tờ, rõ tiến độ ảnh, mục còn thiếu và nút sửa ngay tài liệu lỗi. Trạng thái duyệt cần chữ lẫn icon. |
| Home | Ảnh | Ưu tiên trạng thái nhận chuyến, blocker và CTA trước số liệu thu nhập. Giữ đánh giá thu gọn; kiểm tra nút nhận chuyến/chi tiết GPS không bị đẩy khỏi vùng thấy ngay. |
| Ride/accept, in-progress | Ảnh rỗng + mẫu | Đưa thời hạn, địa chỉ và thao tác tiếp theo lên đầu; trạng thái hết cuốc có đường quay lại. Không dùng màu làm tín hiệu duy nhất khi còn ít thời gian. |
| Ride/vehicle-inspection, handover, directions | Ảnh hạn chế + mẫu | Nhãn pha và địa chỉ khớp Đón/Trả. Nhóm bước/ảnh có tiến độ, nút xác nhận theo pha; bản đồ có trạng thái lỗi và chỉ dẫn bước tiếp theo. |
| History, ride/complete | Ảnh | Bộ lọc tạo vùng riêng, thẻ chuyến nhấn được rõ; dòng thu tiền/phí/thu nhập dễ so sánh và trình bày theo trạng thái thực. |
| Chat | Ảnh rỗng + mẫu | Hiện ngữ cảnh chuyến dưới tiêu đề, bọc tên dài; ảnh có mô tả thao tác mở, lỗi gửi có thử lại. |
| Notifications | Ảnh | Nhóm theo ngày, mô tả thông báo và trạng thái đọc rõ; giữ đủ tương phản ở dark mode khi badge nhỏ. |
| Profile, profile/edit, profile/verification | Ảnh | Bọc tên/email, nhóm mục theo tác vụ, hàng đánh giá có trạng thái lỗi/rỗng. Xác minh thử nghiệm dùng safe area và theme như P1. |
| Profile/wallet, top-up, withdraw | Ảnh | Phân biệt ví tín dụng và tiền mặt bằng nhãn, hướng dẫn nghĩa của số tiền. Giữ trường số tiền/CTA nhìn được khi bàn phím mở; trạng thái chờ rút giải thích số tiền khả dụng. |
| Support, safety, tickets, tickets/new, tickets/[id] | Ảnh | CTA khẩn cấp tách khỏi hỗ trợ thông thường; nhãn gọi nêu rõ số; nhóm tin nhắn theo người gửi và thời gian, đặc biệt khi giao diện tối. |
| Settings, settings/privacy, settings/reception | Ảnh | Tách trạng thái vận hành khỏi quyền thiết bị; mỗi trạng thái lỗi có cách sửa tương ứng. Nội dung quyền riêng tư tăng khoảng dòng và dễ tìm theo nhóm. |

## Kiểm tra sau khi sửa

1. Chạy một luồng đặt chuyến và một luồng nhận → đón → trả với tài khoản test. Kiểm tra các trường hợp không GPS, không kết nối, cuốc hết hạn, API chậm, và lỗi gửi biểu mẫu.
2. Chạy hai app trên Android 360dp và iOS, ở cỡ chữ mặc định và 130% hoặc lớn hơn. Kiểm tra bàn phím, safe area, luồng back, đọc màn hình và không tràn ngang. Đo độ tương phản thực tế trên light/dark cho cả hai brand.
3. Chụp lại màn P1 ở bản release. Tiêu chí là nhìn thấy và hiểu thao tác chính, địa chỉ và trạng thái trước khi cần cuộn, với nút thao tác đủ vùng chạm.
