# eKYC UI/UX — Tối ưu hai đầu Driver App & GoAdmin

> Ngày: 20/11/2026 · Phạm vi: `F:\datxe_rn` (`apps/driver`) và `F:\goAdmin`
> Chuẩn áp dụng: `PRODUCT.md` + `apps/driver/PRODUCT.md` + `F:\goAdmin\PRODUCT.md`, `DESIGN.md` (PtitGo MD3) + `F:\goAdmin\DESIGN.md` (Operational Clarity Ledger), WCAG 2.2 AA, `AGENTS.md` hai repo.
> Skills đã nạp: `ui-ux-pro-max`, `impeccable` (`context` cho cả hai target + `craft-floor` + `audit.native`), `expo-native-ui`, `frontend-design`, `vercel-react-native-skills`.
> Chế độ thiết kế: **Operate** (bảng kiểm duyệt) và **native one-handed** (tài xế ngoài trời).

Mục tiêu: rút ngắn khoảng cách giữa "thấy đúng thông tin" và "ra quyết định đúng" ở hai đầu của cùng một workflow eKYC, không đổi hợp đồng API, không nới lỏng Identity Lock / revision guard / 5 slot ảnh bắt buộc.

---

## 1. GoAdmin — màn `Duyệt hồ sơ tài xế`

Trước đợt này, toàn bộ nội dung duyệt (tóm tắt → cảnh báo → bảng đối chiếu → ảnh → phạm vi GPLX → đối chiếu khuôn mặt → lịch sử → form quyết định) nằm trong **một luồng dọc duy nhất** của Drawer. Ở `1280×720` hoặc zoom `200%`, form quyết định nằm ngoài 3–5 màn cuộn.

### 1.1 Thay đổi cấu trúc

| # | Trước | Sau | Nguyên tắc |
|---|---|---|---|
| 1 | Form quyết định ở cuối luồng cuộn | **Rail quyết định sticky bên phải** (`position: sticky; top: 0`), luôn thấy khi đọc bằng chứng; tự cuộn trong rail (`max-height: calc(100dvh - 96px)`) để không mất nút khi zoom | `primary-action`, `focus-not-obscured`, một CTA chính |
| 2 | Không có tổng hợp sẵn sàng | **Checklist 5 mục** trên rail: cảnh báo chặn kích hoạt · trường lệch đề xuất · số ảnh đã mở · xác nhận đối chiếu · phạm vi GPLX. Mỗi mục bấm để nhảy tới đúng khối | `progressive-disclosure`, `error-summary`, giảm tải nhận thức |
| 3 | Lỗi validate là một dòng `Alert` cuối form | **Error summary có cấu trúc**: mỗi lỗi một dòng + nút "Đi tới" (scroll + focus), tự focus lỗi đầu tiên | `error-summary`, `focus-management` (WCAG 2.2) |
| 4 | Checkbox "Tôi đã xem bản nộp hiện tại" (chung chung) | "Tôi đã đối chiếu ảnh giấy tờ và thông tin của **Bản {revision}**" | Trung thực theo revision, tránh xác nhận mơ hồ |
| 5 | Cảnh báo chặn kích hoạt chỉ là câu chữ trong `Alert` | `Tag` đỏ "chặn kích hoạt" ở tiêu đề mục + `Tag` "Cần xử lý trước khi duyệt" trên từng cảnh báo | `color-not-only` (có nhãn chữ), `state-clarity` |
| 6 | Tiêu đề tài xế `h5`, mục con `h4` (nhảy cấp) | `h3` → `h4` | `heading-hierarchy` |
| 7 | Drawer chỉ có tiêu đề tĩnh | Tiêu đề kèm **tên tài xế + bản nộp** (`Chi tiết xác minh tài xế · Nguyễn Văn An · Bản 4`) | Giữ ngữ cảnh khi đã cuộn sâu |
| 8 | Trạng thái không có hành động: panel trống | Thông điệp giải thích theo trạng thái (chờ tài xế bổ sung / đã từ chối / cần chuyển bản mới) | 5 trạng thái UI, `empty-nav-state` |
| 9 | Drawer `960px` | `1120px` để bảng đối chiếu + rail cùng nằm trong khung nhìn | Mật độ thông tin cho desktop |
| 10 | Ảnh eKYC không có phản hồi tiến trình | Nút "Mở ảnh" có `loading`, giữ nguyên blob URL + thu hồi khi unmount | `loading-buttons`, `image-optimization` |

Chi tiết kỹ thuật: rail dùng grid `minmax(0,1fr) 312px`, tự gập về 1 cột dưới `1180px`; focus ring `:focus-visible` cho mọi target nhảy tới; nút "Đi tới" dùng `htmlType="button"` để không submit form.

### 1.2 Giữ nguyên

- Toàn bộ payload quyết định (`revision`, `status`, `reason`, `captures`, `fields`, `capabilityReview`).
- Chặn phê duyệt khi có cảnh báo `blocksActivation`; chỉ cho `REJECTED` / `NEEDS_MORE_INFO`.
- Drawer không đóng khi mutation đang chạy, không gửi lặp.
- Ảnh private chỉ tải khi người duyệt chủ động mở.

---

## 2. Driver App — luồng `Xác minh tài xế`

### 2.1 Lỗi ưu tiên cao

| # | Mức | Trước | Sau |
|---|---|---|---|
| 1 | **P0** | "Xem tổng hợp" vẫn bấm được khi còn trường sai; lỗi chỉ hiện ở banner **đầu trang** nên tài xế đang ở footer không thấy, tưởng nút không ăn | Footer nhận `fieldIssueCount`: khoá CTA + hint "Còn N mục bắt buộc chưa điền hoặc sai định dạng"; **mọi lỗi thao tác hiện ngay trong footer** (`AlertBanner` cạnh CTA), banner đầu trang chỉ còn thông tin/thành công |
| 2 | P1 | Một màn có 2–3 nút primary (QR trong nội dung + CTA footer) | Nút QR trong nội dung chuyển `variant="secondary"`; **duy nhất footer là primary** |
| 3 | P1 | `NEEDS_MORE_INFO`: banner có primary "Đi tới ảnh cần bổ sung" trùng footer | Banner dùng `secondary`, footer giữ primary |
| 4 | P1 | Pill bước chụp cao `44dp`, pill ngoài phạm vi vẫn ghi "Chưa chụp" | `48dp`; nhãn "Không cần bổ sung lần này" cho slot không thuộc phạm vi |
| 5 | P1 | Lộ thuật ngữ nội bộ: badge nguồn "OCR", nút "Bỏ qua · Dùng OCR / nhập tay", "đối chiếu bằng OCR" | "Đọc từ ảnh", "Bỏ qua · Tự nhập thông tin", "tự nhập thông tin bằng tay" |

### 2.2 Accessibility & hành vi

| # | Trước | Sau |
|---|---|---|
| 6 | Mỗi công tắc bị bọc trong `MotionPressable role="switch"` **và** chứa `Switch` → TalkBack/VoiceOver có 2 điểm focus cho cùng một thiết lập | Wrapper `accessible={false}`; **chỉ `Switch` là control**, nhãn mô tả đầy đủ đặt trên `Switch` (đồng ý gửi ảnh, ảnh nhỏ, GPLX không thời hạn, đồng ý đối chiếu khuôn mặt, xác nhận gửi) |
| 7 | Nút Back hệ thống của Android = "Bỏ qua quét QR" (âm thầm ghi `qrSkipped` và nhảy bước) | Back chỉ **đóng máy quét**; "Bỏ qua" là hành động chủ động trong panel |
| 8 | CTA "Tiếp tục đối chiếu thông tin"/"Quét lại" nằm trong `ScrollView` của panel `maxHeight 46%` → fontScale 2.0 phải cuộn nội bộ mới thấy | Cụm CTA **cố định dưới panel**, chỉ phần chọn mặt/gợi ý/thu phóng cuộn |
| 9 | Modal camera luôn `animationType="slide"` | `none` khi `useReducedMotion()` bật (Guided Capture + QR Scanner) |

### 2.3 Vệ sinh giao diện

| # | Trước | Sau |
|---|---|---|
| 10 | "Sửa thông tin" xuất hiện 2 lần trong cùng khung nhìn (trong thẻ bảng + footer) | Bỏ nút trong thẻ, giữ footer (vùng ngón cái) |

### 2.4 Giữ nguyên

`DriverPage` + footer dính đáy, `KeyboardAvoidingView behavior="padding"`, `scrollResetKey`, 5 slot ảnh bắt buộc, Identity Lock, `Idempotency-Key`, revision/generation guard, ảnh nhạy cảm `DriverPhoto sensitive` + `cachePolicy="memory"`, `tabular-nums` cho bộ đếm ảnh.

---

## 3. Kiểm chứng

| Phạm vi | Lệnh | Kết quả |
|---|---|---|
| `F:\datxe_rn` | `npm run check` | **PASS** — architecture, typecheck, lint, **252/252** test |
| `F:\goAdmin` | `pnpm run lint` | **PASS** — 0 error, 0 warning |
| `F:\goAdmin` | `pnpm run typecheck` | **PASS** |
| `F:\goAdmin` | `pnpm run test` | **PASS** — 12 file, **100/100** test |
| `F:\goAdmin` | `pnpm run build` | **PASS** — `tsc --noEmit` + `vite build` |

### Chưa kiểm chứng (NOT VERIFIED)

- Ảnh chụp Light/Dark và `font_scale 1.3/2.0` trên thiết bị Android thật hoặc emulator cho đợt này (máy host không có `adb`/emulator trong phiên làm việc).
- TalkBack / VoiceOver: đã sửa cấu trúc focus (mục 2.2 #6) nhưng chưa đọc thử bằng trình đọc màn hình.
- iOS: môi trường Windows, không có Simulator.
- Đăng nhập tài xế thật, chụp giấy tờ thật, OCR/QR/đối chiếu khuôn mặt trên dịch vụ đã triển khai.

---

## 4. Đề xuất còn lại (chưa làm trong đợt này)

1. **Nhập ngày theo dd/mm/yyyy**: 4 trường ngày vẫn nhập `YYYY-MM-DD`, trong khi màn tổng hợp hiển thị `dd/mm/yyyy`. Đề xuất dùng `CustomDatePickerModal` của `@datxe/ui` (hoặc auto-convert qua `parseVnDateToIso` khi rời ô) và bỏ hậu tố `(YYYY-MM-DD)` khỏi nhãn.
2. **Footer cho trạng thái chỉ đọc**: khi `!canEdit` (đã xác minh), `footer` là `undefined` nên CTA "Chọn loại xe nhận lái hộ" nằm cuối vùng cuộn.
3. **Ảnh chân dung**: nhãn "Đã xác minh / Đã được admin kiểm tra" hợp lý khi hồ sơ APPROVED (admin duyệt cả bản nộp gồm selfie), nhưng contract chưa có trường kết quả `face-comparison` để hiển thị chính xác hơn; chỉ đổi khi backend bổ sung trường đó.
4. **Lỗi mạng có nút "Thử lại" ngay trong banner** thay vì chỉ icon refresh trên header.

---

## 5. Ghi chú kỹ thuật

- Working tree của cả hai repo đã có thay đổi eKYC chưa commit từ đợt trước (`Drivers.tsx`, `FaceComparisonPanel.tsx`, `LicensePolicyPreview.tsx`, `verificationReviewModel.ts`, `CapabilitiesScreen.tsx`, `VerificationShared.tsx`, `verificationLabels.ts`). Đợt này **kế thừa** các thay đổi đó và không ghi đè.
- Không thêm dependency, không thêm migration, không đổi route, không đổi DTO.
