# Vòng đời chuyến đi và Ma trận UI/UX cho khách hàng (`apps/customer`)

Tài liệu chuẩn hóa vòng đời chuyến đi phía **Khách hàng (`PtitGo`)** theo nguồn sự thật từ Spring Boot backend (`RideStatus`, `RideStateMachine`, `RideHandoverService`, `HandoverCorrectionService`, `PaymentService`, `RideRatingService`, `RideQueryService`) và lớp presentation state-driven tại `apps/customer/src/lib/customerRidePresentation.ts`.

---

## 1. Luồng đặt chuyến & khôi phục (`Home -> FindDriver`)

1. **Home (`HomeScreen` + `useHome`):**
   - Định vị GPS dùng timeout **8 giây** + đọc trước `getLastKnownPositionAsync` (`<= 60s`), không khóa nút chọn **Điểm đón** khi GPS đang tải.
   - `recentDestinations` lưu kèm tọa độ hợp lệ (`dropoffLat`/`dropoffLng`) để vào thẳng `/ride/vehicle` (hoặc `/ride/pickup`) chỉ trong **1 chạm**.
2. **Đặt ngay vs Hẹn giờ (`VehicleSelectionScreen` & `BookingConfirmationScreen`):**
   - Ý định `scheduleRequested` được giữ xuyên suốt từ Home -> Vehicle -> Confirm.
   - Nếu khách bật Hẹn giờ mà chưa chọn khung giờ đón (`scheduledAt === null`), nút đặt ngay bị khóa và hiển thị nhắc chọn giờ đón hoặc chuyển sang Đặt ngay.
3. **Tính giá minh bạch (`FareDetails`):**
   - Backend làm tròn `payableFare` về bội số `1.000 đ` (`CEILING` theo `MoneyRounding.kt`).
   - Khi `payableFare !== estimatedFare - discountAmount`, `FareDetails` hiển thị rõ dòng `Làm tròn bội 1.000 đ` để bảng chi tiết khớp hoàn toàn với `Tổng thanh toán`.
4. **Reset stack sau khi tạo chuyến (`rideNavigation.ts`):**
   - Dùng `resetToRideScreen` (`dismissAll()` + `push(...)`) để nút Back hệ thống hoặc header Back không bao giờ đưa khách quay lại `VehicleSelection` hay `BookingConfirmation` cũ.

---

## 2. Ma trận trạng thái & UI/UX chi tiết cho khách hàng

| Trạng thái API + Điều kiện | Màn hình | Tiêu đề & Banner | ETA & Bản đồ | Primary CTA | Secondary actions | Hành động bị ẩn / khóa |
| --- | --- | --- | --- | --- | --- | --- |
| **PENDING** *(INSTANT)* | `FindDriverScreen` | `Đang tiếp nhận yêu cầu` | Chấm điểm đón + radar tìm kiếm | — | `Hủy yêu cầu` | Sửa lộ trình / Xác nhận bàn giao |
| **PENDING** *(SCHEDULED)* | `FindDriverScreen` | `Đã đặt lịch, đang chờ đến giờ tìm tài xế` | Điểm đón + giờ hẹn đón | — | `Hủy yêu cầu` | Radar tìm kiếm |
| **SEARCHING** | `FindDriverScreen` | `Đang tìm tài xế` · *"Hệ thống đang kết nối với tài xế gần điểm đón nhất…"* | Radar + chấm điểm đón | — | `Hủy yêu cầu` | Thông số nội bộ (`Vòng X · Bán kính Y km`) |
| **NO_DRIVER_FOUND / EXPIRED / FAILED_SYSTEM** | `FindDriverScreen` | `Chưa tìm được tài xế` / `Yêu cầu đã hết hạn` / `Không thể tìm tài xế lúc này` | Điểm đón/trả giữ nguyên | `Thử tìm lại` *(kiểm tra chuyến active, giờ hẹn, số dư ví, gọi quote mới — không dùng `routeQuoteId` cũ; lock chống double-tap)* | `Chỉnh sửa chuyến` *(vào `/ride/confirm` với draft đã khôi phục)*, `Về trang chủ` | Dùng lại báo giá hết hạn hoặc đặt trùng cuốc |
| **CANCELLED** | `FindDriverScreen` / `RideDetailScreen` | `Chuyến đi đã hủy` | Tóm tắt lộ trình | `Đặt lại chuyến này` | `Về trang chủ` | Hủy lại, đánh giá, xác nhận bàn giao |
| **DRIVER_ASSIGNED** | `DriverTrackingScreen` | `Tài xế đã nhận chuyến` | Marker đúng loại xe (`CAR`/`MOTORCYCLE`) + ETA tới điểm đón | — | `Chi tiết chuyến`, `Chia sẻ chuyến`, `Nhắn tin`/`Gọi tài xế`, `Làm mới trạng thái`, `Hủy chuyến` | CTA xác nhận bàn giao / xem tổng kết |
| **DRIVER_ARRIVING** | `DriverTrackingScreen` | `Tài xế đang đến điểm đón` | Marker xe + ETA live tới điểm đón (`useApproachRoute`) | — | Như trên | CTA bàn giao |
| **DRIVER_ARRIVED** | `DriverTrackingScreen` | `Tài xế đã đến điểm đón` · *"Tài xế đang kiểm tra xe và lập biên bản nhận xe"* | Vị trí tại điểm đón | — | Như trên + `An toàn` | Không cho mở xác nhận khi `report` chưa gửi |
| **VEHICLE_HANDOVER** *(chưa xác nhận, chưa `correctionReason`)* | `DriverTrackingScreen` / `VehicleInspectionScreen` | `Cần xác nhận biên bản nhận xe (Phiên bản X)` | Theo dõi vị trí xe | `Xem và xác nhận nhận xe` *(mở `/vehicle-inspection` với nút `Xác nhận tình trạng xe` & `Yêu cầu điều chỉnh`)* | `Hủy chuyến`, `Nhắn tin`/`Gọi tài xế` | Không cho xác nhận phiên bản cũ nếu tài xế vừa đẩy `revision` mới (`stale_revision` bắt buộc bấm `Xem phiên bản X`) |
| **VEHICLE_HANDOVER** *(`correctionReason != null && !confirmedByCustomer`)* | `DriverTrackingScreen` / `VehicleInspectionScreen` | `Chờ tài xế sửa biên bản nhận xe (Phiên bản X)` + lý do đã gửi | Theo dõi xe | — *(Ẩn hoàn toàn CTA Xác nhận)* | `Xem biên bản đã phản hồi` (read-only), `Nhắn tin`, `Hủy chuyến` | Xác nhận hoặc gửi sửa lần nữa trên revision đang chờ xử lý |
| **VEHICLE_HANDOVER** *(`confirmedByCustomer === true`)* | `DriverTrackingScreen` / `VehicleInspectionScreen` | `Đã xác nhận biên bản nhận xe (Phiên bản X)` · *"Chờ tài xế bắt đầu chuyến đi"* | Theo dõi xe | — | `Xem biên bản đã xác nhận` (read-only), `Nhắn tin`, `Hủy chuyến` | Gửi xác nhận hoặc yêu cầu điều chỉnh lại |
| **IN_PROGRESS** | `DriverTrackingScreen` | `Chuyến đi đang diễn ra` | Tuyến + ETA trực tiếp tới **điểm trả** (`resolveLiveEtaTarget`) khi có GPS tài xế; không tự bịa ETA nếu mất tín hiệu | — | `Chi tiết chuyến`, `Chia sẻ chuyến`, `Nhắn tin`, `An toàn` | **`Hủy chuyến`** (bị khóa ở backend), CTA bàn giao |
| **ARRIVED_DESTINATION** | `DriverTrackingScreen` | `Đã đến điểm trả` · *"Tài xế đang lập biên bản hoàn trả xe"* | Vị trí điểm trả | — | `Chi tiết chuyến`, `Nhắn tin`, `An toàn` | Không mở xác nhận trả xe khi chưa có `DROPOFF` report |
| **VEHICLE_RETURNED** *(pending / correction / confirmed)* | `DriverTrackingScreen` / `VehicleInspectionScreen` | Đồng bộ hoàn toàn 3 trạng thái như `VEHICLE_HANDOVER` nhưng cho pha `DROPOFF` | Vị trí điểm trả | `Xem và xác nhận trả xe` *(CHỈ khi `pending_confirmation`)* | `Xem biên bản đã phản hồi`/`đã xác nhận` | **`Hủy chuyến`**, CTA của pha nhận xe cũ, xác nhận `revision` cũ |
| **COMPLETED** | `TripCompletedScreen` / `RideDetailScreen` | `Chuyến đi hoàn thành` · `customerHasRatedDriver` | Bảng tóm tắt giá & thanh toán thực tế | `Gửi đánh giá` *(CHỈ khi `!alreadyRated`)* hoặc `Về trang chủ` *(khi đã đánh giá)* | `Bỏ qua và về trang chủ`, `Chi tiết chuyến` | Form đánh giá nếu server trả `customerHasRatedDriver === true` hoặc gặp `RATING_ALREADY_EXISTS` |

---

## 3. Khôi phục phiên (`SessionGate`) & Mất đồng bộ (`!synchronized`)

1. **`useSessionGate` (`sessionGateHelpers.ts`):** Lỗi mạng (`NETWORK_ERROR`, `auth/network-request-failed`) và gián đoạn máy chủ (`HTTP_500..504`, `INVALID_SERVER_RESPONSE`) giữ nguyên phiên Firebase, hiển thị thông báo rõ ràng + nút `Thử lại`. Chỉ gợi ý `Đăng nhập lại` khi token hết hạn (`HTTP_401`, `UNAUTHORIZED`, `auth/user-token-expired`) hoặc sai vai trò.
2. **Mất đồng bộ khi đang kiểm tra biên bản:** Nếu `query.isError` xảy ra trong khi biên bản đang mở, `customerHandoverInspectionPresentation` khóa `canConfirm` và `canRequestCorrection`, giữ dữ liệu đang hiển thị và cung cấp nút `Làm mới biên bản`.
