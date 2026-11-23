# Audit UI/UX Customer và Driver — 22/11/2026

## Cập nhật sau sửa theo yêu cầu

Đã xử lý F1–F7 trên nhánh `integration/mobile-release` (code, tests và báo cáo được ghi nhận cùng đợt sửa):

- F1: RideRouteBar hiển thị nguyên địa chỉ; phần địa chỉ cuộn trong vùng giới hạn tối đa 120dp hoặc 25% chiều cao cửa sổ để không chiếm vùng CTA. RouteSummary không loại bỏ các thành phần địa chỉ.
- F2: PlaceRow không giới hạn dòng tên, địa chỉ và thông tin phụ.
- F3: Ô OTP dùng minHeight và padding, chữ cardTitle có chữ số tabular; không khóa chiều cao glyph, vẫn giữ nhập/paste/autofill 6 số và input truy cập được.
- F4: Cả hai hook đăng ký có ref khóa đồng bộ trước request, giải phóng trong finally; Driver áp dụng cùng khóa cho gửi/xác nhận OTP liên kết. Customer khóa tên/email/ngày sinh/giới tính khi đang gửi. Lỗi không xóa draft.
- F5: ScrollView auth dùng handled và on-drag ở các màn trước đó giữ bàn phím; áp dụng cả modal chọn quốc gia.
- F6: RideStopCard giải thích thiếu tọa độ cạnh nút chỉ đường bị khóa, đề nghị đối chiếu địa chỉ với khách.
- F7: Hai vị trí cuộn tới trường yêu cầu điều chỉnh dùng lựa chọn reduced motion.

Kiểm chứng sau sửa: **npm run check PASS** (architecture, typecheck, lint; **309/309 tests**, 0 fail/skip), git diff --check PASS. Thêm tests thực thi hook với request pending/failure/retry và render cây JSX để bảo vệ địa chỉ đầy đủ/cảnh báo thiếu tọa độ; cập nhật test OTP theo chiều cao linh hoạt và test chỉ đường để tìm nút trong nhóm nội dung mới.

Chưa chạy lại UI native Light/Dark/font 1.3/2.0, TalkBack/VoiceOver hoặc E2E server trong lượt sửa; adb không có thiết bị kết nối khi kiểm tra. Kết quả JSX mocks không thay thế kiểm chứng bố cục native. Không thêm dependency/env, không thay đổi API/backend, không gửi OTP hay gọi dịch vụ trả phí. Phần audit bên dưới giữ làm bằng chứng trạng thái trước sửa, không phải danh sách lỗi còn mở.

Baseline: `9129879`, nhánh `integration/mobile-release`. Skills: Impeccable native audit, ui-ux-pro-max, React Native skills, Expo native UI; PRODUCT.md và DESIGN.md của PtitGo là ưu tiên cao nhất. Đây là audit mã nguồn, không thay đổi UI/nghiệp vụ.

## Kết luận nền tảng và điểm sức khỏe

Ứng dụng có cấu trúc native, safe area, keyboard avoidance và semantic tokens dùng chung. Chưa đủ bằng chứng để xác nhận đạt toàn bộ HIG/Material/WCAG trên thiết bị. Điểm dưới đây chỉ đánh giá mức bảo vệ thấy trong source; không phải điểm nghiệm thu runtime hoặc benchmark hiệu năng.

| Chiều đánh giá | Điểm source /4 | Bằng chứng / giới hạn |
| --- | --- | --- |
| Accessibility | 2 | Có label/role, còn cắt địa chỉ, OTP cố định chiều cao, cuộn không xét Reduce Motion |
| Performance | 3 | Query/cache và chia component; chưa đo FPS, memory hoặc camera trên thiết bị |
| Appearance/Theming | 3 | Token chung và tests theme; chưa quan sát toàn bộ màn Light/Dark |
| Platform conformance | 3 | Native stack, ScreenWrapper, keyboard padding; chưa kiểm tra gesture/TalkBack trực tiếp |
| Adaptivity | 2 | Có flex/wrap/scroll; OTP và nội dung địa chỉ còn ràng buộc, chưa thử tablet/landscape |
| Tổng tạm tính | **13/20** | Cần sửa và kiểm chứng runtime |

Phát hiện 7 nhóm vấn đề: 0 P0 được xác nhận, 1 P1, 6 P2. Không có kết luận rằng mọi luồng đã chạy thành công chỉ vì tests đạt.

## Phạm vi rà soát và các bảo vệ đang có

| Luồng | Customer | Driver | Nhận định source |
| --- | --- | --- | --- |
| Khôi phục phiên, login/social, OTP | SessionGate, Login, OtpVerify, AddPhoneNumber | SessionGate, Login, OtpVerify, LoginHelp | Lỗi mạng không tự logout; OTP có retry/timeout; login có khóa điều hướng và reset khi quay lại |
| Tạo tài khoản | Register + useRegister | Register + useRegister | Kiểm tra tên/điện thoại; Customer thêm ngày sinh/email; cần khóa thao tác bất đồng bộ chắc hơn |
| Xác minh danh tính | Firebase/OTP và liên kết số điện thoại; không có luồng CCCD/GPLX tương đương Driver | Verification, GuidedCapture, QrScanner, Capabilities; màn auth legacy VerifyId/LicenseUpload cần giữ tương thích tuyến | QR đã đọc có nhánh LIVE_SCANNED/SKIP_DECODED; lưu ý không chặn được gom, ảnh chuẩn bị tính cả capture server và local; phê duyệt khác trạng thái đồng bộ capability |
| Đặt chuyến | BookingStart, Home, Pickup/Destination, PlaceSelection/Detail, MapPicker, VehicleSelection, BookingConfirmation, FindDriver | Home/Accept offer | Báo giá từ backend, kiểm tra active ride, wallet, quote mới và snapshot khi tìm lại; cần hiển thị địa chỉ đầy đủ |
| Đón và trong chuyến | DriverTracking, RideDetail | Directions, InProgress, RideStop/Route/Customer cards | Mô hình presentation theo trạng thái; guard kiểm tra trạng thái trước progress; cần giải thích nút chỉ đường bị khóa |
| Bàn giao nhận/trả | VehicleInspection, correction photos, gallery/history | VehicleInspection, checklist, revision | Customer không xóa active ride trước khi hủy thành công; revision/correction được xét trong presentation; chưa chạy tương tác hai session |
| Hoàn thành/đánh giá | TripCompleted | Complete, RideCustomerRating | Có trạng thái đã đánh giá, bỏ qua; đánh giá khách hàng theo rideId; chưa kiểm thử thu tiền/push thực tế |

Danh mục là phạm vi source được khảo sát, không phải danh sách màn đã mở trên thiết bị. Logic backend/phân quyền server không được kiểm toán lại toàn bộ trong lượt UI này.

## Findings theo mức ưu tiên

### F1 — P1: Địa chỉ bị rút gọn trong luồng đặt chuyến

- Vị trí: `apps/customer/src/features/booking/components/RideRouteBar.tsx:44`, `RouteSummary.tsx:7`, `bookingUtils.ts:147`.
- RideRouteBar dùng `placeTitle()` lấy phần trước dấu phẩy rồi giới hạn 2 dòng; RouteSummary dùng `shortAddress()` lấy một thành phần đường. AccessibilityLabel chứa địa chỉ đầy đủ nhưng người dùng nhìn màn hình chưa chắc thấy đủ quận/phường để phân biệt địa điểm cùng tên.
- Tác động: dễ xác nhận sai điểm đón/trả, đặc biệt địa chỉ ngõ/ngách Việt Nam. Không khẳng định payload backend sai: đây là mất ngữ cảnh hiển thị.
- Khuyến nghị: giữ tên ngắn ở dòng đầu và địa chỉ đầy đủ có thể mở rộng ở màn chọn/xác nhận; cho nội dung tự tăng chiều cao. `$impeccable adapt`.

### F2 — P2: Danh sách địa điểm cắt nội dung quan trọng

- Vị trí: `apps/customer/src/features/booking/components/PlaceRow.tsx:61`.
- Title 1 dòng, address 2 dòng. Chi tiết địa điểm có đường mở riêng nên vẫn có cách xem đầy đủ, nhưng phải thêm thao tác và khó so sánh kết quả dài ở font lớn.
- Khuyến nghị: dòng địa chỉ linh hoạt hoặc nút mở rộng có nhãn rõ; thử địa chỉ dài và font 1.3/2.0. `$impeccable adapt`.

### F3 — P2: Ô số OTP chưa thích ứng chiều cao chữ

- Vị trí: `packages/ui/src/auth/OtpCodeInput.tsx:98` (ảnh hưởng cả hai app và xác minh số khi đăng ký).
- `codeBox` cao cố định 56, width 48 và được co tới 32; chữ vẫn dùng typography phóng theo hệ thống. Có nguy cơ chật/cắt glyph khi chữ lớn, chưa tái hiện ở lượt này.
- Khuyến nghị: dùng minHeight và khoảng đệm theo nội dung, kiểm tra 6 ô ở màn hẹp/font 2.0; giữ paste/autofill và một input truy cập được. `$impeccable adapt`.

### F4 — P2: Handler đăng ký chưa có khóa đồng bộ và Customer còn sửa form lúc gửi

- Vị trí: `apps/customer/src/features/auth/hooks/useRegister.ts:26`, `apps/driver/src/features/auth/hooks/useRegister.ts:64`, các trường trong Customer `screens/RegisterScreen.tsx`.
- Hai submit handler dùng setLoading nhưng không có ref guard ngay đầu; Button chặn sau render nên vẫn có cửa sổ tái nhập trước render. Customer chưa khóa tên/email/ngày sinh/giới tính khi gửi; payload đã chụp ở đầu submit có thể khác nội dung người dùng sửa trong lúc chờ.
- Đây là rủi ro source, chưa chứng minh tạo tài khoản trùng trên server. Khuyến nghị thêm guard đồng bộ, giữ nguyên draft khi thất bại và khóa các trường trong lúc gửi. `$impeccable harden`.

### F5 — P2: Hành vi bàn phím ở auth chưa đồng nhất

- Vị trí: LoginScreen của hai app, Customer Register/AddPhoneNumber và `packages/ui/src/auth/OtpVerificationScreen.tsx`.
- Nhiều ScrollView dùng `keyboardShouldPersistTaps="always"`, một số có `keyboardDismissMode="none"`; chạm khoảng trống giữ nguyên bàn phím, trái quy ước `handled` trong AGENTS.md.
- Tác động: cần thao tác phụ để thu bàn phím và đọc nội dung, đặc biệt màn nhỏ. Không kết luận CTA bị che vì các màn đã có KeyboardAvoidingView padding.
- Khuyến nghị thống nhất `handled`, kiểm tra chạm CTA lần đầu và Android Back khi IME đang mở. `$impeccable harden`.

### F6 — P2: Nút chỉ đường bị khóa không có giải thích tại chỗ

- Vị trí: `apps/driver/src/features/ride/components/RideStopCard.tsx:37`.
- Thiếu lat/lng làm disabled nút chỉ đường, nhưng card không giải thích nguyên nhân. Tài xế vẫn thấy địa chỉ chữ nên khó biết cần chờ cập nhật hay liên hệ khách.
- Khuyến nghị thêm thông báo ngắn cạnh nút và hành động cập nhật/liên hệ hợp ngữ cảnh, không giả tọa độ. `$impeccable clarify`.

### F7 — P2: Tự cuộn biên bản chưa tôn trọng Reduce Motion

- Vị trí: `apps/customer/src/features/vehicles/screens/VehicleInspectionScreen.tsx:39` và `:148`.
- Khi mở hoặc focus lý do điều chỉnh, gọi `scrollToEnd({ animated: true })` không xét lựa chọn giảm chuyển động.
- Khuyến nghị dùng reduced-motion state để tắt animation nhưng vẫn đưa trường nhập vào tầm nhìn; kiểm thử focus và bàn phím sau khi thêm ảnh. `$impeccable harden`.

## Vấn đề hệ thống và điểm cần giữ

Các khoảng trống tập trung ở khả năng đọc thông tin dài, nhất quán auth và trạng thái disabled, không phải thiếu một bộ màu mới. Giữ nguyên @datxe/ui và thương hiệu hai app; không thêm design system/dependency. Không biến mọi lưu ý eKYC thành blocker hoặc bỏ kiểm tra nghiệp vụ để giảm cảnh báo.

Các bảo vệ đáng giữ: semantic typography/theme, Button tối thiểu 48dp và disabled khi loading, QR không yêu cầu lại khi đã đọc, cảnh báo eKYC phân loại mức chặn, hủy chuyến chỉ sửa cache sau thành công, query key đánh giá có rideId, xác nhận giá/active ride trước tạo chuyến, presentation bàn giao xét revision.

## Kiểm chứng và phần còn thiếu

- `npm run check` tại gốc PASS: architecture, TypeScript, lint và **303/303 tests**, 0 fail/skip. Log ghi trong `%TEMP%/ptitgo-ui-flow-audit-check.log`.
- `adb devices -l`: không có thiết bị kết nối trong lượt audit. Không tái sử dụng ảnh đăng nhập của lượt merge để suy ra các màn khác đạt.
- Chưa nghiệm thu Light/Dark/font 1.3/2.0 cho toàn bộ màn, TalkBack/VoiceOver, iOS, camera/QR thực tế, offline/reconnect ở từng bước, hai session tranh chấp nhận cuốc, push nền và thanh toán. Không gọi dịch vụ trả phí hoặc gửi OTP thật.
- Điểm hiệu năng và tương phản chỉ dựa cấu trúc/token/tests; chưa có trace FPS, memory hoặc phép đo trên từng tổ hợp màu thực tế.

## Thứ tự xử lý đề xuất

1. `$impeccable adapt`: F1–F3, địa chỉ và OTP ở màn hẹp/chữ lớn.
2. `$impeccable harden`: F4, F5, F7; mock async/re-entry/failure, giữ draft, kiểm tra bàn phím và reduced motion.
3. `$impeccable clarify`: F6, giải thích đúng nguyên nhân disabled.
4. `$impeccable polish`: kiểm chứng toàn hành trình trên Android/iOS sau sửa, gồm lỗi và phục hồi; audit lại trước kết luận đạt.
