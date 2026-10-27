# DatXe — Customer & Driver

Npm workspaces, Expo SDK 58, React Native 0.88, Expo Router. Mã được chuyển từ `D:\app_dat_xe_reactnative`; project nguồn được giữ nguyên.

## Chạy ứng dụng

```powershell
cd D:\datxe_rn
npm ci
npm run customer
# Terminal khác:
npm run driver
```

Customer chạy cổng **8081**, driver chạy cổng **8082**. Hai app dùng Firebase native, Google/Facebook sign-in và customer có Mapbox, vì vậy cần **development build** đã cài trên thiết bị, không dùng Expo Go.

```powershell
npm run android -w customer
npm run android -w driver
# Trên macOS:
npm run ios -w customer
npm run ios -w driver
# Xem giao diện web:
npm run web -w customer
npm run web -w driver
```

Web giữ giới hạn của nguồn: OTP, Google và Facebook yêu cầu app native. Không dùng mock để vượt đăng nhập thật.

## Cấu hình máy mới

- Sao chép `apps/<app>/.env.example` thành `.env` và điền API URL, OAuth client, Facebook và Mapbox tương ứng. Android emulator dùng `10.0.2.2`; điện thoại thật cần IP LAN/URL truy cập được.
- Đặt `google-services.json` trong từng app cho Android; iOS cần `GoogleService-Info.plist` tương ứng bundle ID. Các file này và `.env` được ignore ở cả root lẫn app.
- Cấu hình local hiện có được giữ trong project mới. `EXPO_PUBLIC_*` được đóng gói trong client, không dùng để lưu server secret.
- `src/config/env.ts` là nơi đọc biến môi trường cho runtime. Production yêu cầu API URL; development có URL mặc định. OAuth/Mapbox chỉ cần cấu hình khi dùng tính năng tương ứng.
- Sentry chỉ bật khi có `EXPO_PUBLIC_SENTRY_DSN`. Lỗi route được ghi qua `lib/logger.ts`; chưa cấu hình upload source map hoặc gửi release lên Sentry.

## Cấu trúc

```text
apps/customer/src/
  app/          # chỉ re-export route/layout
  features/     # auth, booking, tracking, vehicles, vouchers, chat,
                # support, profile, history, notifications
  components/   # header, tab bar, empty state, map native/web
  config/       # env
  lib/          # query client, session store, auth wiring, upload
apps/driver/src/
  app/          # giữ các URL cũ; thêm alias ride/handover
  features/     # auth, offers, ride, history, notifications, profile
  components/
  config/
  lib/
packages/
  shared/src/   # HTTP client, Firebase auth, backend DTO, STOMP,
                # format utils, constants; không chứa UI
  ui/src/       # Button/Input/Card, theme, auth UI, UI types và mock cũ
  config/       # TypeScript và ESLint dùng chung
```

Trong mỗi feature: `api.ts` gọi HTTP, `hooks/` xử lý dữ liệu/state, `screens/` dựng giao diện, `components/` chứa các phần giao diện/helper/style của feature. Alias `@/` trỏ vào `src`, `@/assets/` trỏ vào assets của từng app. Các feature không import chéo nhau. ESLint `import/no-restricted-paths` và script kiến trúc kiểm tra chiều import.

Customer dùng Query cho account, chuyến đang hoạt động, tìm tài xế, ước tính giá, lịch sử phân trang, thông báo, phương tiện, voucher, biên bản và tracking. Chat giữ thuật toán gộp tin theo ID của nguồn, Query quản lý lịch poll để tránh thay đổi giao thức phân trang. State nhập liệu/quyền vị trí nằm trong hook; Zustand giữ user và chuyến đang theo dõi trong bộ nhớ. Đăng xuất xóa cache và store.

Customer chuyển nhóm `(main)` thành `(tabs)` cho Home/History/Notifications/Profile. Các màn hình chuyến nằm ở `ride/route-selection`, `ride/confirm`, `ride/find-driver`, `ride/tracking`, `ride/completed`, `ride/[id]`. Các lệnh điều hướng nội bộ đã được cập nhật. URL cũ của customer không được giữ làm alias.

## Phần được giữ nguyên từ nguồn

Nhiều màn hình driver (offers, ride, history, notifications, profile) đang dùng dữ liệu mẫu hoặc state local trong nguồn; migration giữ hành vi đó. Chưa có API driver, feature earnings riêng hoặc luồng thu nhập thật trong nguồn để chuyển.

DTO/`RideStatus`/`Role` dùng lại hợp đồng HTTP có sẵn. Workspace không có backend Kotlin, nên chưa đối chiếu enum Kotlin hoặc tự thêm `PayloadType`/`WsEnvelope`. STOMP factory đã hỗ trợ Firebase token, heartbeat, reconnect và khôi phục subscription; chưa kết nối vào server vì nguồn chưa cung cấp destination/message contract. Tracking tiếp tục poll HTTP; chưa có tọa độ tài xế realtime để viết `useDriverLocation` thật.

## Kiểm tra

```powershell
npm run check
# Hoặc từng bước:
npm run check:architecture
npm run typecheck
npm run lint
npm test
```

Kiểm thử HTTP bao gồm bearer token/role/idempotency, refresh token và retry đúng một lần, xử lý phiên hết hạn, null response, response sai cấu trúc, mất mạng và thiếu user.

```powershell
cd apps/customer
npx expo install --check
npx expo export --platform web --output-dir ../../.expo-export/customer
npx expo export --platform android --output-dir ../../.expo-export/customer-android
# Tương tự trong apps/driver, đổi tên thư mục output.
```

Export Android kiểm tra bundling/Hermes, không thay thế build APK hoặc kiểm thử OTP/booking/backend trên thiết bị. Trên môi trường Windows sandbox, Hermes có thể cần chạy ngoài sandbox để ghi bytecode vào thư mục tạm. Sentry SDK hiện có cảnh báo tham chiếu file nội bộ Expo Router khi bundle; Metro dùng fallback và vẫn xuất bundle được.

## Git và bản sao dự phòng

Root Git lưu toàn bộ source của hai app; hai Git repository lồng trước đây được chuyển vào `.migration-backup/nested-git/`, giữ lịch sử để phục hồi. Scaffold/file cũ và script di chuyển một lần nằm trong `.migration-backup/`, được ignore. `package-lock.json` là lockfile của project mới; dùng npm từ root.
