# Khóa Android dùng chung cho team dev

## Thiết lập sau khi clone

Nhận bộ key mới từ người quản lý team rồi chép đúng tên:

```text
apps/customer/team-dev-customer.jks
apps/driver/team-dev-driver.jks
```

Sau khi có `.env` và `google-services.json` của app như hướng dẫn README:

```powershell
npm ci
npm run android -w customer
# Hoặc:
npm run android -w driver
```

Không cần sửa Gradle hoặc chạy prebuild thủ công. Script `preandroid` kiểm tra file key và tự prebuild lần đầu để gắn cấu hình ký, kể cả khi đã có thư mục Android cũ. Những lần chạy sau giữ lại Android đã generate. Nếu thiếu key, script dừng và chỉ rõ file cần chép; không tự quay về debug keystore khác.

Đây là key phát triển của team: store password và key password đều là **`android`**, được cấu hình sẵn. Alias customer là `team-dev-customer`, alias driver là `team-dev-driver`. Không cần tạo file cấu hình mật khẩu. `signing.properties.example` chỉ dành cho trường hợp muốn override; file thật `signing.properties` được ignore.

Chỉ biến thể **debug** dùng `signingConfigs.teamDev`. Plugin không thay cấu hình ký release. EAS build/Play Store cần quy trình credentials riêng; file JKS local đang bị Git ignore nên không tự được gửi lên EAS.

Giữ một bản sao bộ key mới để phân phối cho người mới trong team. Không tạo lại key trên từng máy. File `.jks`, `.keystore` và `signing.properties` không được đưa vào Git.

## Fingerprint đăng ký Firebase

Hai key mới khác nhau. Đăng ký đúng bộ SHA vào từng app Android trong Firebase Project settings → Your apps → Add fingerprint.

### Customer — `com.datxe.customer`

SHA-1:

```text
39:40:76:89:7A:BA:CF:57:B7:D4:18:CF:5D:22:11:BE:F1:C1:F4:80
```

SHA-256:

```text
0E:3E:FE:AB:ED:FE:0B:FB:95:5A:1E:A4:9F:4A:93:5C:21:39:53:D0:CC:52:35:6C:F1:2A:CC:57:CC:24:31:F3
```

### Driver — `com.datxe.driver`

SHA-1:

```text
0D:0E:CF:47:24:D1:2E:74:AB:73:BB:A9:18:49:77:67:07:46:43:C5
```

SHA-256:

```text
16:32:78:5B:77:C9:2B:4B:13:E5:22:7D:FE:5E:96:78:6C:4A:44:F8:8D:14:D8:15:6A:AC:DB:C7:7F:F6:69:CE
```

Các mã này thay cho bộ fingerprint của debug keystore mặc định đã dùng trước đó. Có thể giữ fingerprint cũ trong Firebase nếu còn cần chạy các bản dev cũ.

Sau khi thêm SHA hoặc bật Google sign-in, tải lại `google-services.json` cho từng app và chạy prebuild trong app tương ứng để cập nhật file native:

```powershell
npm exec -w customer -- expo prebuild --platform android --no-install
npm exec -w driver -- expo prebuild --platform android --no-install
```

Nếu thiết bị đã cài bản dev ký bằng key cũ, Android có thể báo `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Gỡ bản dev cũ một lần rồi cài bản mới; việc gỡ sẽ xóa dữ liệu local của bản dev đó.

## Kiểm tra key đang được Gradle sử dụng

```powershell
cd apps/customer/android
.\gradlew.bat :app:signingReport
# Tương tự trong apps/driver/android
```

Variant `debug` phải hiển thị file `team-dev-<app>.jks`, alias tương ứng và fingerprint ở trên. Task `validateTeamDevSigning` kiểm tra cả mật khẩu keystore lẫn khả năng mở private key, không chỉ đọc chứng chỉ công khai.
