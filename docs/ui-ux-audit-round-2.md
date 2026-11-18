# Rà soát UI/UX lần 2 — Customer và Driver

Ngày: 15/11/2026. Đây là báo cáo rà soát, chưa sửa giao diện ứng dụng.

## Phạm vi và cách đọc

Kiểm kê toàn bộ route của hai app, lần theo màn triển khai và các component dùng chung. Đối chiếu hai contact sheet chứa 26 ảnh Customer và 29 ảnh Driver; mở ảnh gốc ở các điểm nghi vấn. Ảnh hiện có không có thông tin commit để chứng minh trùng tuyệt đối mã đang sửa. Bộ `previous-fixtures` không được dùng để khẳng định trạng thái runtime hiện tại trong lần này.

- **Xác nhận mã**: có hành vi hoặc thuộc tính cụ thể trong source; không đồng nghĩa đã chạy E2E.
- **Xác nhận ảnh**: nhìn thấy trong ảnh đã lưu; cần chụp lại nếu mã đã đổi.
- **Rủi ro cần thử**: chưa tái hiện trên thiết bị, không gọi là lỗi chắc chắn.
- **Đề xuất**: cải thiện phân cấp hoặc cách diễn đạt; không phải yêu cầu tính năng đang thiếu.

Áp dụng skill `ui-ux-pro-max`: accessibility, touch, typography, layout, forms và navigation. Tìm kiếm `dynamic type text scaling` theo React Native trả kết quả không đúng trọng tâm, đã loại; truy vấn lại `dynamic type` trong domain `web` trả hướng dẫn đúng nền tảng mobile. Không áp dụng lời khuyên CSS/web cho native một cách máy móc.

Không chạy lại app, không kiểm thử VoiceOver/TalkBack, bàn phím thật, chữ lớn, xoay ngang hoặc iOS trong lượt này. Danh mục route cuối báo cáo là kiểm kê mã, không phải danh sách màn đã kiểm thử trực tiếp.

## Những chỗ nên sửa trước

### UX-01 · P1 · Chọn địa điểm đã lưu vẫn thêm một bước xác nhận

**Xác nhận mã.** `PlaceSelectionScreen.tsx:126` gọi `h.select(place)` cho chip đã lưu. `usePlaceSelection.ts:213` gán `select: openMapFor`; hàm này resolve tọa độ rồi mở `/ride/map-picker`, chưa ghi điểm đến và đi tiếp ngay. Dữ liệu đã lưu có tọa độ, nhưng thao tác vẫn phải qua bản đồ.

**Ảnh hưởng:** chưa đáp ứng trọn trải nghiệm một lần nhấn mà người dùng đã yêu cầu trước đó. Đây không còn là lỗi chỉ điền chuỗi search, nhưng vẫn có bước dư.

**Sửa:** địa điểm đã lưu có tọa độ hợp lệ được ghi vào draft và đi tiếp theo đúng ngữ cảnh pickup/dropoff/edit. Giữ thao tác “Chỉnh vị trí” riêng. Chỉ resolve hoặc mở map khi dữ liệu thiếu/chưa hợp lệ.

**Nghiệm thu:** nhấn Nhà/Cơ quan chọn ngay; giữ nguyên đầu còn lại của lộ trình; edit không tạo draft mới; địa điểm cũ thiếu tọa độ có giải thích và đường khôi phục.

### UX-02 · P1 · Ba thao tác khác nghĩa trên Home đi cùng một luồng

**Xác nhận mã.** `HomeScreen.tsx` truyền cùng `h.openBooking()` cho `onPickup`, `onSearch`, `onSchedule`. `useHome.ts:123` chỉ chuyển tới route-selection; `useBookingStart.ts` luôn chuyển tiếp `/ride/pickup`, không mang ý định hẹn giờ.

**Ảnh hưởng:** nhấn “Bạn muốn đi đâu?” vẫn vào chọn điểm đón; icon có nhãn đọc “Đặt chuyến hẹn giờ” không mở hoặc đánh dấu đặt lịch.

**Sửa:** phân biệt ý định. Đổi điểm đón mở pickup; tìm điểm đến mở destination khi có pickup hợp lệ; hẹn giờ giữ ý định để mở chọn thời gian ở bước phù hợp. Cho icon lịch thêm nhãn nhìn thấy “Hẹn giờ”.

**Nghiệm thu:** ba entry point có kết quả phù hợp nhãn; thiếu GPS vẫn chọn thủ công; nếu đang có chuyến thì giải thích và mở chuyến đó.

### UX-03 · P1 · Vùng chạm của thanh lộ trình quá thấp

**Xác nhận mã.** `checkoutStyles.ts:33` đặt `routeRow.minHeight = 34`; `RideRouteBar` không thêm vùng chạm cho hai hàng này. Nút swap là 44×44, chưa đạt mục tiêu Android 48×48. Hai hàng sát nhau nên tăng hitSlop đơn thuần dễ chồng vùng chạm.

**Sửa:** mỗi hàng tối thiểu 48 đơn vị layout, cho nội dung lớn tự tăng chiều cao; swap 48×48; tính lại phần map được nhìn thấy. Không áp dụng kết luận này cho nút xóa xe: nút xóa xe hiện đã 48×48.

**Nghiệm thu:** đo layout và chạm gần mép hai hàng trên Android; không chọn nhầm đầu lộ trình; chữ 200% không bị cắt.

### UX-04 · P1 · Nhận cuốc thiếu địa chỉ đầy đủ để quyết định

**Xác nhận mã.** `OfferDecision.tsx` dùng `compactAddress()` bỏ bớt thành phần địa chỉ, sau đó `numberOfLines={1}`. Nhãn accessibility có đầy đủ địa chỉ, nhưng người nhìn màn hình chỉ thấy bản rút gọn; component không có nút mở rộng địa chỉ.

**Sửa:** hiển thị nhãn Đón/Trả bằng chữ, tên điểm/số nhà và đường ở dòng chính, quận/thành phố ở dòng phụ; cho mở rộng trong sheet mà không mất nút nhận. Không ép thông tin quyết định xuống 12sp để nhét vừa.

**Nghiệm thu:** thử địa chỉ trùng tên đường khác quận và tên tòa nhà dài; đọc đủ trước khi nhận; thời hạn và nút nhận luôn thấy được. Màn hiện đã có footer riêng, số giây, trạng thái hết hạn và reduced motion: giữ các điểm tốt này.

### UX-05 · P1 · Xác minh thử nghiệm phá safe area và theme

**Xác nhận ảnh + mã.** Ảnh `driver/actual/verification-sandbox-required.png` cho thấy nội dung chồng thanh trạng thái. `VerificationScreen.tsx:22` trả trực tiếp Text có padding, không có page/header/back; toàn màn dùng màu hex riêng. Profile vẫn hiển thị entry thử nghiệm.

**Sửa:** ẩn entry khi môi trường không hỗ trợ. Khi mở qua deep link, hiển thị trang trạng thái có safe area, tiêu đề và nút về hồ sơ. Nếu giữ công cụ thử nghiệm, tách khỏi tác vụ hồ sơ thường và dùng theme của app.

**Nghiệm thu:** người dùng production không gặp yêu cầu token/demo; deep link thiếu điều kiện không thành màn cụt; sáng/tối đều đúng màu thanh hệ thống.

### UX-06 · P1 · Ảnh chat hỗ trợ có thể trở thành bong bóng trống

**Xác nhận ảnh + thiếu xử lý trong mã.** `driver/actual/ticket-detail.png` có các khối ảnh trống lớn. `packages/ui/src/tickets/TicketChat.tsx` render Image từ `message.imageUrl` nhưng không có trạng thái tải/lỗi hay nút tải lại. Chưa xác định ảnh trống do URL, mạng, quyền hay nội dung ảnh; không quy kết backend.

**Sửa:** giữ khung ảnh với trạng thái “Đang tải ảnh”, “Không tải được ảnh” và thử lại; xem ảnh lớn có cùng khả năng khôi phục. Tránh để trống mà vẫn giống tin nhắn gửi thành công. Avatar dấu hỏi trong ảnh cần kiểm tra icon/font khi chạy lại.

**Nghiệm thu:** URL lỗi/timeout vẫn có nội dung giải thích; ảnh hợp lệ mở được; tin có ảnh và caption không mất caption. Kiểm tra cả hai app vì dùng chung TicketChat.

### UX-07 · P1 · Sheet lưu/báo lỗi địa điểm chưa bảo đảm vừa màn hình

**Rủi ro từ mã, chưa tái hiện.** `SavePlaceSheet` và `ReportPlaceSheet` dùng View cho nội dung, không có scroll/max-height; `placeStyles.modalSheet` có paddingBottom cố định 28. Report có KeyboardAvoidingView trên iOS nhưng không làm nội dung cao có thể cuộn. Trường mô tả chỉ có placeholder, chưa có nhãn accessibility riêng.

**Sửa:** sheet có chiều cao tối đa theo vùng khả dụng, cuộn nội dung, chừa bottom inset thực tế, giữ nút Hủy/Gửi tiếp cận được. Gắn nhãn trường và thông báo lỗi bằng semantics phù hợp.

**Nghiệm thu:** màn 360dp, bàn phím mở, chữ 200%, landscape vẫn đọc/chạm được các lựa chọn và nút gửi. Mở/đóng với TalkBack/VoiceOver phải trả focus hợp lý.

### UX-08 · P2 · Email bị tự thu nhỏ ở cả hai hồ sơ

**Xác nhận mã.** Customer `ProfileScreen.tsx:193` và Driver `ProfileScreen.tsx:88` dùng `numberOfLines={1}` + `adjustsFontSizeToFit`.

**Sửa:** cho email xuống dòng; vùng thông tin có flexShrink/minWidth phù hợp. Nếu cần giới hạn ở trang tổng quan, cung cấp chỗ xem đầy đủ và sao chép. Không tự giảm cỡ chữ để nhét email dài.

**Nghiệm thu:** email dài 50–70 ký tự, tên 40 ký tự và chữ 200%; vẫn phân biệt được tên, số điện thoại, email và nút sửa.

### UX-09 · P2 · Icon trắng trên nền vàng điểm đến khó nhìn

**Xác nhận mã và tính toán.** `PlaceRow.tsx:96` dùng `accent.onAccent` = trắng cho cả điểm đón lẫn điểm đến. Nền điểm đến `#F2B705`, icon `#FFFFFF`: tương phản **1,818:1**.

**Sửa:** token màu icon riêng cho nền vàng, ưu tiên màu than; giữ nhãn chữ Đón/Đến. Nếu icon chỉ trang trí và đã có chữ tương đương thì đây là cải thiện khả năng nhìn, không tự động kết luận vi phạm tiêu chí icon có ý nghĩa.

**Nghiệm thu:** icon cần nhận biết đạt mục tiêu 3:1; kiểm tra cả nền sáng/tối và trạng thái selected.

### UX-10 · P2 · Chữ phụ quá nhỏ ở một số tác vụ

**Xác nhận mã.** TicketChat timestamp 10 (`:211`); chat chuyến metadata 11; nhãn biển số xe dùng `labelMd` 12; optionLabel thanh checkout 12; địa chỉ danh sách place 13. Không phải mọi nhãn 12 đều là lỗi.

**Sửa theo vai trò:** timestamp 12–13; địa chỉ và biển số cần quyết định 14–16; nội dung dài 16/24; giá/đếm giờ 22–28 hoặc lớn hơn theo khoảng trống. Giữ metadata nhẹ hơn bằng màu/khoảng cách, không chỉ bằng thu nhỏ.

**Nghiệm thu:** đọc được địa chỉ, số tiền, biển số trong ánh sáng ban ngày; không đổi toàn bộ font cùng một cỡ; không cắt nội dung khi chữ tăng.

### UX-11 · P2 · Badge thông báo chưa nằm trong tên đọc của tab

**Xác nhận mã; cần thử screen reader.** `TonalNavigationBar.tsx:42` đặt accessibilityLabel chỉ bằng tên tab dù có badge count. Nhãn visual tab giới hạn một dòng.

**Sửa:** tên đọc đầy đủ như “Thông báo, 3 chưa đọc”, giữ selected state; khi count đổi không đọc lặp liên tục. Kiểm tra khả năng đọc riêng Badge để tránh đọc trùng. Cho nhãn tab co giãn hoặc hai dòng có kiểm soát khi font tăng.

**Nghiệm thu:** 0/1/99+ tin, tiếng Việt/Anh và TalkBack; mỗi tab một điểm focus dễ hiểu. Tab hiện đã có role/selected và minHeight 48, không cần làm lại phần đó.

### UX-12 · P2 · Chỉ đường thiếu chuyến vẫn mở bản đồ chờ

**Xác nhận ảnh + mã.** Ảnh `ride-directions.png` hiển thị bản đồ đang tải cùng lỗi thiếu chuyến; `RideDirectionsScreen` vẫn render GoongMap với fallbackCenter khi chưa có origin/destination. CTA cập nhật không giúp bổ sung chuyến còn thiếu.

**Sửa:** tách thiếu ngữ cảnh chuyến, thiếu quyền GPS, lỗi tải tuyến và lỗi map. Thiếu chuyến nên là trang trạng thái có “Về chuyến đang chạy” hoặc “Về trang chủ”; chỉ retry khi retry có thể khắc phục.

**Nghiệm thu:** deep link thiếu id, chuyến đã kết thúc, từ chối GPS và mạng lỗi có thông điệp/hành động khác nhau; không để spinner bản đồ gây hiểu nhầm.

### UX-13 · P2 · Danh sách lịch sử và ví cần tối ưu cho dữ liệu dài

**Đề xuất + rủi ro hiệu năng cần đo.** History và Wallet dùng ScrollView rồi map nhiều item; ví đã có nút xem thêm, nhóm notification theo ngày đã tồn tại. Chưa đo giật, không gọi là lỗi hiệu năng đã tái hiện.

**Sửa:** thẻ lịch sử ưu tiên trạng thái, Đón/Trả, tiền; metadata thời gian/mã một hàng phụ. Ví giữ dấu cộng/trừ, loại giao dịch và trạng thái bằng chữ (đã có). Khi danh sách thực tế lớn, cân nhắc list virtualization tại màn cấp ngoài, tránh lồng FlatList cuộn cùng chiều vào ScrollView.

**Nghiệm thu:** dữ liệu 100+ mục, refresh không mất vị trí và dữ liệu đang đọc; cuộn tới cuối, mở chi tiết rồi back giữ ngữ cảnh; số tiền lớn không đẩy nhãn khỏi màn.

### UX-14 · P2 · Các form Driver và nạp/rút tiền cần kiểm thử bàn phím riêng

**Rủi ro từ mã.** DriverPage có ScrollView nhưng không tự xử lý KeyboardAvoidingView; EditDriverProfile, DocumentForm, Withdrawal/TopUp dùng wrapper này. Customer WalletTopUp cũng chỉ có ScrollView. Có thể Android resize đã xử lý một phần; chưa được phép kết luận nút bị che trên mọi máy.

**Sửa nếu tái hiện:** wrapper form giữ trường focus và lỗi nhìn được, nội dung cuộn trên bàn phím, CTA không nằm sau thanh điều hướng. Giữ inline error đã có ở DocumentForm và WalletMoneyForm.

**Nghiệm thu:** chỉnh trường cuối, gửi sai, sửa lại; bàn phím số và văn bản, Android/iOS; lỗi ngân hàng/số dư có hướng khắc phục đúng chỗ.

## Kết quả đo màu, tránh kết luận cảm tính

Tính từ giá trị sRGB trong tokens theo công thức relative luminance. Không đo pixel anti-alias, bản đồ hoặc nền có alpha; không suy ra toàn app đạt chuẩn chỉ từ bảng này.

| Cặp màu | Tỉ lệ | Nhận định |
|---|---:|---|
| Customer onPrimary trắng / primary #B3263D | 6,439 | Đạt mục tiêu chữ thường 4,5 |
| Driver light trắng / #007F46 | 5,092 | Đạt |
| Driver dark #003820 / #7ED9AA | 7,811 | Đạt |
| onSurfaceVariant #61616B / trắng | 6,122 | Đạt |
| dark onSurfaceMuted #9CA3AF / #1E1E1E | 6,566 | Đạt |
| onSurfaceMuted #6B7280 / trắng | 4,834 | Đạt |
| onSurfaceMuted #6B7280 / #ECEEF2 | 4,162 | Không dùng cho chữ thường nếu ghép cặp này; chưa xác nhận callsite cụ thể |
| Trắng / vàng #F2B705 | 1,818 | Icon điểm đến cần cải thiện |

Ngưỡng chữ thường 4,5:1 và các ngoại lệ tham chiếu [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Semantics nhãn, trạng thái và thông báo cập nhật tham chiếu [React Native Accessibility](https://reactnative.dev/docs/accessibility). Không đánh dấu nút disabled không đạt tương phản như một vi phạm chữ thường.

## Những kết luận của lần trước cần điều chỉnh

1. OTP đã có `autoComplete="sms-otp"`, `textContentType="oneTimeCode"` và một input nhận cả chuỗi. Việc còn lại là chạy kiểm thử paste/autofill/keyboard, không phải thêm lại tính năng này.
2. Nút xóa xe đã 48×48. Không suy kích thước vùng chạm từ glyph nhỏ trong ảnh thu nhỏ.
3. Notification hai app đã nhóm theo ngày; Wallet đã dùng `tabular-nums`, phân biệt loại và trạng thái. Không đưa các việc này vào backlog như thiếu hoàn toàn.
4. OfferActions đã có số giây bằng chữ, accessibility state và reduced-motion. InProgress đã có bước 1–4 và CTA footer theo pha.
5. Ảnh Customer `notifications.png` thực chất hiển thị Lịch sử. Chỉ dùng mã để rà notification, cần chụp lại đúng màn. Không kết luận router lỗi chỉ từ tên file ảnh.
6. Ảnh Customer `tickets.png` không chứng minh giao diện `/support`; hai màn này khác nhau. Ảnh hợp lệ được ghi riêng trong danh mục route.
7. Lỗi tải review trong ảnh không chứng minh layout review bị lỗi. Component đã có loading, empty, retry, phân bố sao và nhãn đọc cho thanh phân bố; cần fixture hợp lệ để đánh giá bố cục đông dữ liệu.
8. Giữ màu đỏ Customer, xanh Driver và hệ Material hiện có. Không có bằng chứng cần thay toàn bộ palette/font/icon library.

## Trình tự cải thiện và tiêu chí kiểm thử

1. UX-01/02/03/04: sửa luồng chọn nơi, ý định entry point và khả năng quyết định chuyến; kiểm thử cả edit và tạo mới.
2. UX-05/06/07/12: không để màn cụt, ảnh trống và sheet không cuộn; thêm trạng thái khôi phục đúng ngữ cảnh.
3. UX-08/09/10/11: typography, màu icon và semantics dùng chung; chạy regression cả hai brand sáng/tối.
4. UX-13/14: thử dữ liệu lớn, bàn phím và điều chỉnh dựa trên kết quả thực tế.

Ma trận nghiệm thu: Android nhỏ 360dp và máy lớn; iPhone có home indicator; portrait/landscape; light/dark; chữ mặc định/130%/200%; giảm chuyển động; đọc màn hình; keyboard mở; mạng chậm/mất mạng; từ chối quyền một lần/vĩnh viễn. Luồng chuyến dùng tài khoản và dữ liệu test, không tạo cuốc thật để chụp.

Mỗi màn quan trọng chụp các trạng thái có dữ liệu, rỗng, loading và error. Modal bổ sung ảnh keyboard và chữ lớn. Lưu tên ảnh kèm route, theme, kích thước và trạng thái, không gọi ảnh redirect là ảnh route đích ban đầu.

Kiểm tra nền mã: `npm run typecheck` và `npm run lint` đều thành công trong lượt rà soát. Các lệnh này không xác nhận chất lượng visual hoặc hành vi trên thiết bị.

## Danh mục từng route — kiểm kê lần 2

Mỗi hàng là file route, không đồng nghĩa một màn độc lập. Link ảnh trỏ ảnh hiện có, không phải ảnh mới chụp. Mục không có ảnh chỉ được rà mã/đặt kịch bản kiểm thử.


### Customer — 38 file route (bao gồm index.web)

| Route | Mã triển khai | Ảnh đối chiếu | Nhận xét / kiểm thử tiếp |
|---|---|---|---|
| `(auth)/add-phone-number` | [AddPhoneNumberScreen](F:/datxe_rn/apps/customer/src/features/auth/screens/AddPhoneNumberScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/add-phone-number.png) | Kiểm thử OTP trong cùng màn, đổi số và lỗi liên kết; giữ nhãn trường. |
| `(auth)/login` | [LoginScreen](F:/datxe_rn/apps/customer/src/features/auth/screens/LoginScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/login.png) | Giữ CTA chính; kiểm thử số dài, bàn phím và lỗi đăng nhập xã hội. |
| `(auth)/otp-verify` | [OtpVerifyScreen](F:/datxe_rn/apps/customer/src/features/auth/screens/OtpVerifyScreen.tsx) | Chưa có ảnh đúng trạng thái | Đã có autofill; thử dán mã, hết hạn, gửi lại và chữ lớn. |
| `(auth)/register` | [RegisterScreen](F:/datxe_rn/apps/customer/src/features/auth/screens/RegisterScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/register.png) | Làm rõ trường bắt buộc; kiểm thử ngày sinh và CTA cuối form. |
| `(tabs)/history` | [TripHistoryScreen](F:/datxe_rn/apps/customer/src/features/history/screens/TripHistoryScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/history.png) | UX-13; metadata nhẹ hơn địa chỉ và trạng thái. |
| `(tabs)/home` | [HomeScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/HomeScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/home.png) | UX-02; ưu tiên đặt chuyến hơn ví, giữ trạng thái GPS rõ. |
| `(tabs)/notifications` | [NotificationScreen](F:/datxe_rn/apps/customer/src/features/notifications/screens/NotificationScreen.tsx) | Chưa có ảnh đúng trạng thái | Ảnh cũ sai màn; kiểm tra mark-all, filter, empty/error; UX-11. |
| `(tabs)/profile` | [ProfileScreen](F:/datxe_rn/apps/customer/src/features/profile/screens/ProfileScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/profile.png) | UX-08; nhóm thông tin liên hệ và tác vụ. |
| `add-vehicle` | [AddVehicleScreen](F:/datxe_rn/apps/customer/src/features/vehicles/screens/AddVehicleScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/add-vehicle.png) | Ưu tiên biển số/loại xe; kiểm thử cả thêm và sửa, lỗi ảnh. |
| `chat` | [CustomerChatScreen](F:/datxe_rn/apps/customer/src/features/chat/screens/CustomerChatScreen.tsx) | Chưa có ảnh đúng trạng thái | Chat dùng chung; thử mất mạng, gửi lại, keyboard; metadata UX-10. |
| `edit-profile` | [EditProfileScreen](F:/datxe_rn/apps/customer/src/features/profile/screens/EditProfileScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/edit-profile.png) | Giữ inline error; thử tên dài, email khóa và lưu khi keyboard mở. |
| `index` | [SessionGateScreen](F:/datxe_rn/apps/customer/src/features/auth/screens/SessionGateScreen.tsx) | Chưa có ảnh đúng trạng thái | Session gate: kiểm thử cold start, hết phiên, mạng chậm; không coi là màn nội dung. |
| `index.web` | [SessionGateScreen.web](F:/datxe_rn/apps/customer/src/features/auth/screens/SessionGateScreen.web.tsx) | Chưa có ảnh đúng trạng thái | Biến thể web session gate; chưa kiểm thử trình duyệt. |
| `payment-methods` | [PaymentMethodsScreen](F:/datxe_rn/apps/customer/src/features/profile/screens/PaymentMethodsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/payment-methods.png) | Đã có radio và CTA lưu; thử ví không tải được/thiếu số dư, thông báo kết quả lưu. |
| `privacy-policy` | [LegalDocumentsScreen](F:/datxe_rn/apps/customer/src/features/support/screens/LegalDocumentsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/privacy-policy.png) | Đề xuất mục lục, body 16/24 và dòng ngắn dễ đọc. |
| `ride/[id]` | [RideDetailScreen](F:/datxe_rn/apps/customer/src/features/tracking/screens/RideDetailScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/ride-detail.png) | Giữ thứ bậc thanh toán/lộ trình/timeline; thử lỗi và biên bản nhiều ảnh. |
| `ride/completed` | [TripCompletedScreen](F:/datxe_rn/apps/customer/src/features/tracking/screens/TripCompletedScreen.tsx) | Chưa có ảnh đúng trạng thái | Kiểm thử đã/chưa trả tiền, gửi đánh giá; không gây hiểu nhầm gửi lại. |
| `ride/confirm` | [BookingConfirmationScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/BookingConfirmationScreen.tsx) | Chưa có ảnh đúng trạng thái | UX-03/07/10; thử voucher, đổi phương thức, ghi chú và hẹn giờ. |
| `ride/destination` | [DestinationScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/DestinationScreen.tsx) | Chưa có ảnh đúng trạng thái | UX-01/09; không buộc xác nhận map lại cho điểm đã lưu. |
| `ride/find-driver` | [FindDriverScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/FindDriverScreen.tsx) | Chưa có ảnh đúng trạng thái | Thử tìm/timeout/hủy; hiển thị thời gian và kết quả bằng chữ, không chỉ animation. |
| `ride/map-picker` | [MapPickerScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/MapPickerScreen.tsx) | Chưa có ảnh đúng trạng thái | UX-07; pin/địa chỉ xác nhận phải khớp, định vị lỗi có nhập thủ công. |
| `ride/pickup` | [PickupScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/PickupScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/pickup.png) | UX-01/09; chip cuối bị khuất một phần do cuộn ngang: cân nhắc wrap hoặc dấu hiệu cuộn. |
| `ride/place-detail` | [PlaceDetailScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/PlaceDetailScreen.tsx) | Chưa có ảnh đúng trạng thái | Tên/địa chỉ đầy đủ, phân biệt lưu/báo lỗi/chọn; UX-07. |
| `ride/route-selection` | [BookingStartScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/BookingStartScreen.tsx) | Chưa có ảnh đúng trạng thái | Route chuyển tiếp; UX-02; không tính spinner là màn chọn tuyến độc lập. |
| `ride/tracking` | [DriverTrackingScreen](F:/datxe_rn/apps/customer/src/features/tracking/screens/DriverTrackingScreen.tsx) | Chưa có ảnh đúng trạng thái | CTA theo pha đã có; thử profile/review, vị trí cũ, hủy và mất mạng. |
| `ride/vehicle` | [VehicleSelectionScreen](F:/datxe_rn/apps/customer/src/features/booking/screens/VehicleSelectionScreen.tsx) | Chưa có ảnh đúng trạng thái | Ưu tiên biển số/loại xe; kiểm thử chưa có xe, chọn xe, quay lại checkout. |
| `settings/[section]` | [SettingsScreen](F:/datxe_rn/apps/customer/src/features/settings/screens/SettingsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/settings-appearance.png) | 5 nhánh: appearance, notifications, permissions, places, about; xem ghi chú dưới bảng. |
| `settings/index` | [SettingsScreen](F:/datxe_rn/apps/customer/src/features/settings/screens/SettingsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/settings.png) | Giữ phân nhóm; thử đổi theme/ngôn ngữ và back. |
| `support` | [CustomerSupportScreen](F:/datxe_rn/apps/customer/src/features/support/screens/CustomerSupportScreen.tsx) | Chưa có ảnh đúng trạng thái | Màn có nhánh an toàn; không dùng ảnh tickets thay thế. Kiểm thử chuyến liên quan và gửi hỗ trợ. |
| `terms-of-service` | [LegalDocumentsScreen](F:/datxe_rn/apps/customer/src/features/support/screens/LegalDocumentsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/terms-of-service.png) | Đề xuất mục lục và khoảng dòng; giữ ngày cập nhật. |
| `tickets/[id]` | [TicketChatScreen](F:/datxe_rn/apps/customer/src/features/tickets/screens/TicketChatScreen.tsx) | Chưa có ảnh đúng trạng thái | UX-06/10; shared TicketChat; thử có ảnh, gửi lỗi, trạng thái đóng. |
| `tickets/index` | [TicketListScreen](F:/datxe_rn/apps/customer/src/features/tickets/screens/TicketListScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/tickets.png) | Empty nên có nút chữ Tạo yêu cầu cạnh lời hướng dẫn, không chỉ dấu cộng. |
| `tickets/new` | [CreateTicketScreen](F:/datxe_rn/apps/customer/src/features/tickets/screens/CreateTicketScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/tickets-new.png) | Chủ đề, mã chuyến tùy chọn đã có; thử validation, keyboard và giữ draft khi lỗi. |
| `vehicle-inspection` | [VehicleInspectionScreen](F:/datxe_rn/apps/customer/src/features/vehicles/screens/VehicleInspectionScreen.tsx) | Chưa có ảnh đúng trạng thái | Giữ pha Đón/Trả, lỗi ảnh đúng slot; thử yêu cầu điều chỉnh và xác nhận. |
| `vehicles` | [CustomerVehiclesScreen](F:/datxe_rn/apps/customer/src/features/vehicles/screens/CustomerVehiclesScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/vehicles.png) | UX-10 biển số; nút xóa đã 48; giữ xác nhận và feedback thao tác. |
| `vouchers` | [CustomerVouchersScreen](F:/datxe_rn/apps/customer/src/features/vouchers/screens/CustomerVouchersScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/vouchers.png) | Empty có đường quay lại; thử thẻ ưu đãi hết hạn/đủ điều kiện. |
| `wallet/index` | [WalletScreen](F:/datxe_rn/apps/customer/src/features/wallet/screens/WalletScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/wallet.png) | UX-13; số dư chưa tải dùng dấu — đã có, không thay bằng 0. |
| `wallet/top-up` | [WalletTopUpScreen](F:/datxe_rn/apps/customer/src/features/wallet/screens/WalletTopUpScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/customer/actual/wallet-top-up.png) | UX-14; giữ nhãn giả lập rõ, thử giới hạn tiền và xác nhận. |

### Driver — 33 file route (bao gồm index.web)

| Route | Mã triển khai | Ảnh đối chiếu | Nhận xét / kiểm thử tiếp |
|---|---|---|---|
| `(auth)/approval-status` | [ApprovalStatusScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/ApprovalStatusScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/approval-status.png) | Đã có checklist; thử chờ duyệt/từ chối, CTA sửa đúng tài liệu. |
| `(auth)/license-upload` | [LicenseUploadScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/LicenseUploadScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/license-upload.png) | UX-14; progress và inline lỗi đã có; thử ảnh lỗi và giấy phép không hạn. |
| `(auth)/login-help` | [DriverLoginHelpScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/DriverLoginHelpScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/login-help.png) | Giữ trợ giúp dễ tìm; cải thiện khoảng cách từng vấn đề, chữ dài. |
| `(auth)/login` | [LoginScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/LoginScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/login.png) | Giữ đăng nhập điện thoại chính; keyboard và lỗi xã hội cần thử. |
| `(auth)/otp-verify` | [OtpVerifyScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/OtpVerifyScreen.tsx) | Chưa có ảnh đúng trạng thái | Shared OTP đã có autofill; thử hết hạn/gửi lại/quay về đổi số. |
| `(auth)/register` | [RegisterScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/RegisterScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/register.png) | Bước 1/4 đã có; thử lỗi tên, mất mạng, nút tiếp tục. |
| `(auth)/verify-id` | [VerifyIdScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/VerifyIdScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/verify-id.png) | UX-14; preview ảnh rõ, lỗi và tiến độ theo slot; không thu nhỏ số giấy tờ. |
| `(tabs)/history` | [HistoryScreen](F:/datxe_rn/apps/driver/src/features/history/screens/HistoryScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/history.png) | UX-13; địa chỉ đã 2 dòng và mở chi tiết, không áp lỗi OfferDecision cho màn này. |
| `(tabs)/home` | [HomeScreen](F:/datxe_rn/apps/driver/src/features/offers/screens/HomeScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/home.png) | Trạng thái nhận cuốc và blocker phải nổi hơn thống kê; thử review mở rộng, GPS lỗi và cuốc mới. |
| `(tabs)/notifications` | [NotificationsScreen](F:/datxe_rn/apps/driver/src/features/notifications/screens/NotificationsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/notifications.png) | Đã nhóm theo ngày; thử đánh dấu đọc, thông báo mất target; UX-11. |
| `(tabs)/profile` | [ProfileScreen](F:/datxe_rn/apps/driver/src/features/profile/screens/ProfileScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/profile.png) | UX-05/08; review có retry, cần dữ liệu hợp lệ để kiểm tra nhiều nhận xét. |
| `chat` | [DriverChatScreen](F:/datxe_rn/apps/driver/src/features/chat/screens/DriverChatScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/trip-chat.png) | Ảnh chỉ trạng thái rỗng; thử hội thoại thật bằng tài khoản test, keyboard và gửi lỗi. |
| `index` | [SessionGateScreen](F:/datxe_rn/apps/driver/src/features/auth/screens/SessionGateScreen.tsx) | Chưa có ảnh đúng trạng thái | Session gate; cold start/offline/hết phiên cần chạy lại. |
| `index.web` | [SessionGateScreen.web](F:/datxe_rn/apps/driver/src/features/auth/screens/SessionGateScreen.web.tsx) | Chưa có ảnh đúng trạng thái | Biến thể web session gate; chưa kiểm thử trình duyệt. |
| `profile/edit` | [EditDriverProfileScreen](F:/datxe_rn/apps/driver/src/features/profile/screens/EditDriverProfileScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/profile-edit.png) | UX-14; nhóm ngân hàng/liên hệ đã có; thử lỗi ngân hàng và chữ lớn. |
| `profile/top-up` | [DriverTopUpScreen](F:/datxe_rn/apps/driver/src/features/profile/screens/DriverTopUpScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/top-up.png) | UX-14; giữ phân biệt tiền giả lập với tiền thật. |
| `profile/verification` | [VerificationScreen](F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/verification-sandbox-required.png) | UX-05; ảnh xác nhận chồng thanh trạng thái. |
| `profile/wallet` | [DriverWalletScreen](F:/datxe_rn/apps/driver/src/features/profile/screens/DriverWalletScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/wallet.png) | UX-13; giữ mô tả ví tín dụng/tiền mặt, thử số tiền lớn. |
| `profile/withdraw` | [DriverWithdrawalScreen](F:/datxe_rn/apps/driver/src/features/profile/screens/DriverWithdrawalScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/withdraw.png) | UX-14; thử đang giữ tiền, thiếu ngân hàng, yêu cầu chờ duyệt/thất bại. |
| `ride/accept` | [AcceptScreen](F:/datxe_rn/apps/driver/src/features/offers/screens/AcceptScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/ride-accept-no-offer.png) | UX-04; ảnh chỉ no-offer; cần fixture cuốc hợp lệ, hết hạn, lỗi nhận. |
| `ride/complete` | [CompleteScreen](F:/datxe_rn/apps/driver/src/features/ride/screens/CompleteScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/trip-detail.png) | Đã tách cước/chiết khấu/thu nhập; thử chưa thu tiền và lịch sử biên bản. |
| `ride/directions` | [RideDirectionsScreen](F:/datxe_rn/apps/driver/src/features/ride/screens/RideDirectionsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/ride-directions.png) | UX-12; ảnh trạng thái thiếu dữ liệu, không phải tuyến hợp lệ. |
| `ride/handover` | [VehicleInspectionScreen](F:/datxe_rn/apps/driver/src/features/ride/screens/VehicleInspectionScreen.tsx) | Chưa có ảnh đúng trạng thái | Alias cùng VehicleInspectionScreen; kiểm thử params/pha như route vehicle-inspection. |
| `ride/in-progress` | [InProgressScreen](F:/datxe_rn/apps/driver/src/features/ride/screens/InProgressScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/ride-in-progress-no-active-ride.png) | Đã có CTA theo pha; ảnh chỉ empty; thử đón, chờ khách xác nhận, trả và hủy. |
| `ride/vehicle-inspection` | [VehicleInspectionScreen](F:/datxe_rn/apps/driver/src/features/ride/screens/VehicleInspectionScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/ride-inspection-unavailable.png) | Ảnh thiếu chuyến; thử ảnh thiếu, đang upload, lỗi và phiên bản điều chỉnh. |
| `safety` | [DriverSafetyScreen](F:/datxe_rn/apps/driver/src/features/support/screens/DriverSafetyScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/safety.png) | CTA gọi khẩn cấp tách biệt đã có; kiểm thử label lớn và nút mở dialer bằng mock. |
| `settings/index` | [DriverSettingsScreen](F:/datxe_rn/apps/driver/src/features/settings/screens/DriverSettingsScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/settings.png) | Nhóm kết nối/theme rõ; thử theme sáng và chữ lớn. |
| `settings/privacy` | [DriverPrivacyScreen](F:/datxe_rn/apps/driver/src/features/settings/screens/DriverPrivacyScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/privacy.png) | Đề xuất khoảng dòng và mục lục nếu nội dung tăng. |
| `settings/reception` | [DriverReceptionScreen](F:/datxe_rn/apps/driver/src/features/settings/screens/DriverReceptionScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/reception.png) | Giữ trạng thái kết nối/GPS riêng; mỗi blocker cần nút xử lý đúng nguyên nhân. |
| `support` | [DriverSupportScreen](F:/datxe_rn/apps/driver/src/features/support/screens/DriverSupportScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/support.png) | Khẩn cấp đã tách; giảm độ dài danh sách chủ đề khi keyboard mở, giữ chuyến liên quan. |
| `tickets/[id]` | [TicketChatScreen](F:/datxe_rn/apps/driver/src/features/tickets/screens/TicketChatScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/ticket-detail.png) | UX-06/10; ảnh xác nhận khối ảnh trống, cần test lỗi tải. |
| `tickets/index` | [TicketListScreen](F:/datxe_rn/apps/driver/src/features/tickets/screens/TicketListScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/tickets.png) | Nút thêm nên có nhãn chữ; thử list dài, lọc, empty/error. |
| `tickets/new` | [CreateTicketScreen](F:/datxe_rn/apps/driver/src/features/tickets/screens/CreateTicketScreen.tsx) | [Ảnh](F:/datxe_rn/screenshot/driver/actual/tickets-new.png) | Thử keyboard, submit lỗi, giữ nội dung và xác nhận thành công. |

### Layout và trạng thái không có route riêng

- Customer: root, auth stack, tab stack; Driver: root, tab stack. Các route `_layout.tsx` chỉ export wrapper, không tính thành màn riêng. Root location prompt giữ yêu cầu xin quyền lúc khởi động của người dùng; thêm lời giải thích và lối nhập thủ công nếu từ chối, không tự đổi thời điểm xin quyền trong audit.
- Customer settings: appearance cần thử chữ lớn + light/dark + tiếng Anh; notifications cần thử quyền hệ thống; permissions cần thử từ chối vĩnh viễn; places cần tên + địa chỉ và chọn trực tiếp (UX-01); about giữ điều khoản/phiên bản/liên hệ dễ tìm. Ảnh hiện có lần lượt settings-appearance, settings-notifications, settings-permissions, saved-places, settings-about.
- Modal không có route: lịch hẹn, voucher, phương thức thanh toán, lưu/báo lỗi địa điểm, hồ sơ/đánh giá tài xế, chọn ngày, xác nhận xóa xe/hủy chuyến/rút tiền, chọn nguồn ảnh, xem ảnh. Cần snapshot riêng khi mở, chữ lớn, keyboard và lỗi; không tính ảnh trang nền là đã kiểm tra modal.
- Đánh giá tài xế: giữ summary ngắn ở Home; khi mở xem nhiều nhận xét, thử phân bố 0/1/nhiều lượt, nhận xét dài, không có comment, lỗi tải và retry. Component hiện đã wrap phần summary/header; chưa có bằng chứng để khẳng định nó tràn.
- Safety của Customer là nhánh trong Support; phải kiểm tra nhánh này riêng dù không có route safety.

Báo cáo này thay thế các nhận định không khớp mã hiện tại trong lần 1; các mục cần thử vẫn chưa được nghiệm thu trên thiết bị.
