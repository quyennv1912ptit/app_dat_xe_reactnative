# Chọn điểm đón / điểm đến

## Luồng app

1. Mở `ride/pickup` hoặc `ride/destination`.
   - Chưa nhập: hiện **Địa điểm gần đây** (`/customer/places/recent`) và, ở màn điểm
     đến, **Điểm đến phổ biến** (`/customer/places/popular`) kèm khoảng cách.
   - Nhập từ 2 ký tự: debounce 350 ms rồi gọi `/location/places/search`.
2. Mỗi dòng kết quả có nút `...` mở `ride/place-detail`. Trang chi tiết cho lưu
   địa điểm (Nhà/Cơ quan/Yêu thích trên thiết bị), sao chép địa chỉ, báo lỗi địa
   chỉ và chọn địa điểm.
3. Bấm vào một dòng kết quả mở `ride/map-picker`, ghim sẵn địa điểm đã chọn.
   Bản đồ reverse-geocode vị trí ghim và gọi `/location/places/nearby` để liệt kê
   các điểm trong bán kính 100 m; bấm một điểm sẽ dời ghim tới đúng toạ độ đó.
4. Map picker có ô ghi chú cho bác tài (chỉ điểm đón) và nút **Xác nhận** màu
   vàng. Chip **Thêm nhà / Thêm công ty / Thêm địa chỉ** mở bản đồ để lưu vị trí
   vào Cài đặt trên thiết bị rồi quay lại màn chọn.

## API backend

Tất cả trả về bọc `ApiResponse`; các endpoint `/api/customer/**` yêu cầu role
`CUSTOMER`, `/api/location/places/**` cho `CUSTOMER` và `DRIVER`.

### `GET /api/location/places/nearby`

Query: `lat`, `lng`, `radius` (mặc định 100, 10..2000), `limit` (1..20).

Goong Nearby Search V2 (`POST /v2/place/nearbysearch`) không lọc cứng theo bán
kính, nên backend đo lại khoảng cách bằng Haversine, sắp xếp gần → xa rồi mới
cắt theo `radius`. Khi khu vực không có điểm nào trong bán kính, trả về các điểm
gần nhất với `withinRadius: false` để app hiển thị trung thực.

```json
{
  "provider": "goong",
  "radiusMeters": 100,
  "withinRadius": true,
  "places": [
    {
      "id": "goong-place-id",
      "name": "44 Ngõ 2 Cầu Bươu",
      "address": "44 Ngõ 2 Cầu Bươu, Đại Thanh, Hà Nội",
      "provider": "goong",
      "coordinate": { "lat": 20.96, "lng": 105.8 },
      "distanceMeters": 42
    }
  ]
}
```

### `GET /api/customer/places/recent`

Query: `kind` = `pickup|dropoff`, `limit`, `proximityLat`, `proximityLng` (tuỳ
chọn). Trả về tối đa 30 chuyến gần nhất, khử trùng địa chỉ, kèm toạ độ và
khoảng cách nếu có vị trí tham chiếu.

### `GET /api/customer/places/popular`

Query: `limit`, `proximityLat`, `proximityLng`. Gom các điểm đến của chuyến
`COMPLETED` trong 180 ngày theo địa chỉ/toạ độ, sắp theo số lần dùng; lọc trong
bán kính 50 km khi có vị trí tham chiếu.

### `POST /api/customer/places/report`

Body:

```json
{
  "placeId": "goong-place-id",
  "name": "Tên địa điểm",
  "address": "Địa chỉ đầy đủ",
  "lat": 21.03,
  "lng": 105.84,
  "reason": "Tên địa chỉ sai: quán đã đổi tên"
}
```

Tạo ticket hỗ trợ `OTHER` qua module support hiện có; trả `{ ticketId, code }`.
