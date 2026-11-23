# Merge main vào integration/mobile-release — 22/11/2026

## Kết quả Git và các lỗi đã sửa

- Nhánh đích: `integration/mobile-release`, commit code đã kiểm chứng: `c1b333ce6fd2f3d8c4d0b98889a9d44d4785a868`.
- Hoàn tất merge đang dang dở trên local `main` thành `d66815c`, bao gồm `origin/main` tại `655bb10`, rồi merge vào nhánh release. Giữ lại các commit riêng của release, không rebase/force-push.
- Giải quyết xung đột `CustomerReviews.tsx` và `RideCustomerCard.tsx`: đánh giá khách hàng lấy theo chuyến qua `/driver/rides/{rideId}/customer-reviews`, query key có `rideId`; không dùng nhầm đánh giá của tài xế đăng nhập.
- Sửa khóa thao tác đăng nhập bằng số điện thoại của cả hai app: chống bấm liên tiếp, cho phép thử lại sau khi quay về từ OTP hoặc điều hướng thất bại. Thêm regression test chạy hook với router/hook mocks, không gửi SMS.
- Avatar khách hàng trong thẻ chuyến Driver dùng `expo-image`, `cachePolicy="memory"`, có fallback khi tải lỗi.
- Cập nhật regression test để bảo vệ đúng endpoint và ngăn tái sử dụng nhầm đánh giá giữa các chuyến.
- Không thêm dependency, migration, biến môi trường bắt buộc hoặc thay đổi backend trong tác vụ này. Không push hoặc chạy workflow phát hành.

## Kiểm chứng mã nguồn và dependencies

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run check` tại gốc | PASS: architecture, TypeScript, lint; **303 tests pass**, 0 fail, 0 skipped |
| Checkout sạch đúng commit `c1b333c`, `npm ci --offline`, rồi `npm run check` | PASS: cài 980 packages, postinstall patch thành công, đủ 303 tests pass |
| `git diff --check`, kiểm tra conflict | PASS |
| Soát nội dung staged tìm mẫu private key/token phổ biến | Không phát hiện; không thay thế kiểm toán bảo mật toàn bộ dependency |
| Expo production export Customer: Android / iOS / web | Cả 3 PASS |
| Expo production export Driver: Android / iOS / web | Cả 3 PASS |

Build artifacts/export không đưa vào Git. Các thư mục skills, cấu hình agent và screenshot có sẵn ở máy giữ ngoài commit.

## Kiểm chứng Android native

Ở từng thư mục `apps/customer/android` và `apps/driver/android`:

```powershell
$env:NODE_ENV = 'production'
$env:SENTRY_DISABLE_AUTO_UPLOAD = 'true'
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

| App | Kết quả | Artifact | SHA-256 |
| --- | --- | --- | --- |
| Customer | BUILD SUCCESSFUL; `apksigner verify --verbose` PASS, v2 signature | `apps/customer/android/app/build/outputs/apk/release/app-release.apk` | `E54CB42CCDF48B0BC32E4C90063CFB4BB17FB301812DAB9330F04C383476D57A` |
| Driver | BUILD SUCCESSFUL; `apksigner verify --verbose` PASS, v2 signature | `apps/driver/android/app/build/outputs/apk/release/app-release.apk` | `8374036F68F4B3F69FA8BF4FC5364C2BBBB6A60CC97AAAA651D14FF77DBBE3C9` |

Cả hai APK chứa JS bundle, build giới hạn ABI `arm64-v8a`. Đây là artifact ký theo cấu hình local; chưa xác nhận dùng khóa phát hành của CI. Workflow hiện tại build theo danh sách ABI mặc định, chưa chạy workflow đó trong tác vụ này.

R8 phát cảnh báo stack map của dependency `play-services-auth:21.5.0`; Gradle có cảnh báo API deprecated. Cả hai build hoàn tất, không sửa dependency hoặc tắt kiểm tra để che cảnh báo.

## Kiểm chứng runtime và giới hạn

- Driver development client mở được màn đăng nhập với code hiện tại trên emulator Pixel 4a / Android 13. Đã quan sát Light với font scale 1.0, Light/Dark với font scale 1.3; nội dung chính/nút đăng nhập hiển thị được. Placeholder số điện thoại có ellipsis ở cỡ chữ lớn, không phải giá trị đã nhập.
- Khi thay đổi cấu hình theme/font lúc development client đang chạy, Expo Router từng báo linking có nhiều instance. Không tìm thấy `NavigationContainer` tự tạo trong app; sau force-stop/mở lại, màn đăng nhập hiển thị và không phát sinh thêm thông báo này trong lần quan sát. Chưa xác nhận hành vi này trên APK Release; không coi toàn bộ runtime là đã được nghiệm thu.
- Lần khởi động emulator đầu tiên gặp ANR của Android system khi build nặng chạy cùng lúc. Khởi động lại emulator sau đó mở app được.
- Chưa kiểm thử giao dịch E2E sau đăng nhập, QR/eKYC, nhận/hủy/hoàn thành chuyến, bản đồ thực tế, push nền và trên thiết bị thật trong tác vụ merge này. Không gọi SMS/đăng nhập xã hội thật, dịch vụ bản đồ trả phí hoặc thanh toán thật.
- Native iOS/Xcode và ký Apple chưa kiểm chứng trên Windows. Export iOS thành công chỉ xác nhận bundle, không xác nhận native build/signing.
- Chưa đọc/xác minh giá trị GitHub Actions secrets và chưa chạy workflow trên GitHub. Không có cơ sở cam kết một bản deploy production đã thành công.

## Push và phát hành

Sau khi xem thay đổi, tại `F:\datxe_rn`:

```powershell
git switch integration/mobile-release
git push origin integration/mobile-release
```

Không cần force-push. Thời điểm fetch cuối trước khi ghi báo cáo, nhánh chứa cả local `main` và `origin/main`, không bị behind nhánh remote release.

Để build phát hành bằng workflow sẵn có:

1. GitHub → Actions → **Build APK và IPA unsigned** → Run workflow.
2. Chọn branch **integration/mobile-release**, chọn `customer` hoặc `driver` và version mới dạng `vX.Y.Z`. Chạy riêng mỗi app.
3. Workflow chạy `npm ci --include=dev`, `npm run check`, khôi phục secrets, Expo prebuild, Android Release và native iOS; chỉ tạo GitHub Release sau khi các bước build thành công.

Secrets hiện có cần đủ cho app đã chọn (prefix `CUSTOMER` hoặc `DRIVER`): `_ENV`, `_IOS_GOOGLE_SERVICES`, `_ANDROID_GOOGLE_SERVICES`, `_KEYSTORE`, `_KEYSTORE_PASSWORD`, `_KEY_ALIAS`, `_KEY_PASSWORD`. File env, cấu hình Firebase và keystore dùng định dạng base64 mà `scripts/restore-ci-secrets.py` yêu cầu; giữ đúng khóa đã dùng nếu cập nhật app đã cài/phát hành. Không cần thêm env mới vì merge này.

`_ENV` phải chứa cấu hình môi trường phát hành hiện có, đặc biệt API HTTPS và các client IDs tương ứng. `EXPO_PUBLIC_*` là dữ liệu công khai trong bundle, không chứa secret server. IPA workflow tạo ra là **unsigned**, cần ký Apple phù hợp trước khi cài/phân phối.

## Bằng chứng local

- Log trong `%TEMP%`: `ptitgo-mobile-release-check.log`, `ptitgo-release-fresh-install.log`, `ptitgo-release-fresh-check.log`, `ptitgo-release-customer-apk.log`, `ptitgo-release-driver-apk.log`, `ptitgo-customer-apk-signature.log`, `ptitgo-driver-apk-signature.log`.
- Export: `.expo-export/customer-{android,ios,web}` và `.expo-export/driver-{android,ios,web}`.
- Ảnh quan sát runtime: `%TEMP%/ptitgo-mobile-release-qa` (không chứa hồ sơ cá nhân).
- Worktree CI tạm đã bỏ đăng ký khỏi Git; thao tác xóa hết thư mục còn dư `F:\.wt_ptitgo_release_ci_20261122` bị cơ chế duyệt tự động chặn theo policy, nên có thể còn file tạm tại đường dẫn này. Không ảnh hưởng nhánh release hoặc artifact.
