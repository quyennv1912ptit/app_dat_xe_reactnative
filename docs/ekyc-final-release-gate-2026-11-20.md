# Final eKYC UI/UX Release Gate — Driver App & GoAdmin

> Ngày: 20/11/2026 · Người thực hiện: release audit (agent)
> Phạm vi: `F:\datxe_rn` (`apps/driver` — luồng eKYC) và `F:\goAdmin` (màn `Duyệt hồ sơ tài xế`)
> Chuẩn đọc trước khi audit: `AGENTS.md`, `PRODUCT.md`, `apps/driver/PRODUCT.md`, `F:\goAdmin\PRODUCT.md`, `DESIGN.md`, `F:\goAdmin\DESIGN.md`, `docs/ekyc-ui-ux-optimization-round3.md`
> Skills đã nạp và áp dụng: **Impeccable** (`context`, `craft-floor`, `audit.native`, `doctor`), **UI/UX Pro Max** (§1 Accessibility, §2 Touch, §5 Layout, §8 Forms, §9 Navigation), **expo-native-ui**.
> Môi trường: Windows, không có `adb`/Android emulator, không có Playwright/trình duyệt tự động → **không chụp được screenshot**.

---

## 0. Kết luận release gate

| Nhóm | Số mục |
|---|---|
| Checklist 12 hạng mục — **PASS (source-level)** | **11** |
| Checklist 12 hạng mục — **FAIL** | **0** |
| Checklist 12 hạng mục — **NOT VERIFIED** | **1** (mục #10 screenshot) |
| Hạng mục con cần kiểm chứng runtime (§7) | **6** (nằm trong các mục #1, #3, #8, #10 — **không** mục nào được tính là PASS) |

**Verdict:** đủ điều kiện **merge** ở mức mã nguồn (11/12 hạng mục PASS source-level). **Chưa đủ điều kiện phát hành** vì còn 1 hạng mục NOT VERIFIED (#10) và 6 hạng mục con runtime chưa chạy được trong môi trường này (§7).

> Ghi chú cách đếm: cột "Kết quả" của checklist chỉ có ba giá trị PASS / FAIL / NOT VERIFIED. Các dòng ghi "PASS (source-level)" nghĩa là phần mã nguồn đã kiểm chứng, còn phần runtime tương ứng được liệt kê riêng ở §7 và **không** cộng vào số PASS.

---

## 1. Checklist 12 hạng mục

| # | Hạng mục | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Kiểm tra toàn bộ luồng eKYC end-to-end | **PASS (source-level)** | State machine 5 stage `PREPARE → CAPTURE → OCR → CONFIRM_FIELDS → SUMMARY` + 6 trạng thái hồ sơ; 253 test mobile đạt, gồm luồng QR/OCR/revision/Idempotency. Chạy trên thiết bị: **NOT VERIFIED** |
| 2 | Loading / error / empty / success / rejected / pending / NEEDS_MORE_INFO | **PASS (source-level)** | `busy` banner + `ActivityIndicator`; `message` + footer error + "Thử lại"; `PendingReviewView` (chờ duyệt, chưa có ảnh), `Empty` (GoAdmin: hồ sơ chưa nộp), `VerifiedBaselineView` (đã duyệt), `EditingStatusBanner` (REJECTED / NEEDS_MORE_INFO / DRAFT) |
| 3 | Responsive, Light/Dark, a11y, font scaling, keyboard, safe area, footer CTA | **PASS (source-level)** | Token-only (`tests/theme.test.cjs` 0 raw hex), `DriverPage` = `KeyboardAvoidingView behavior="padding"` + `keyboardShouldPersistTaps="handled"` + footer trong vùng an toàn; `KeyValueRow` tự stack ở `fontScale ≥ 1.35`; không `numberOfLines`/`allowFontScaling={false}`. *Visual + screen reader: xem §7 #2–#3* |
| 4 | Loại bỏ UI/nút trùng lặp | **PASS** | (a) bỏ "Sửa thông tin" trùng trong màn tổng hợp; (b) bỏ nút "Chọn loại xe nhận lái hộ" trùng trong `VerifiedBaselineView` (đã chuyển thành footer CTA); (c) GoAdmin bỏ cột "Thao tác" trùng hành động với nút mã hồ sơ; (d) nút X của máy quét QR đổi từ "đóng + bỏ qua" thành "đóng" để không trùng hành động "Bỏ qua" |
| 5 | Mỗi màn một primary CTA | **PASS** | Xem ma trận §3 |
| 6 | Nhập ngày dd/mm/yyyy + retry khi lỗi mạng | **PASS** | `CustomDatePickerModal` của `@datxe/ui` thay 4 ô nhập ngày; lưu ISO nội bộ, hiển thị `dd/mm/yyyy`; nút "Thử lại" trong footer cho `NETWORK`/`TIMEOUT`/`SERVER` |
| 7 | Gửi lặp, mất mạng, đóng app, quay lại bước, khôi phục phiên | **PASS (source-level)** | `operation.current` chặn thao tác song song; `pendingRef` + `Idempotency-Key` giữ nguyên giữa 2 lần gửi (test line 96–99); `AppState` background → abort + `generation++`, active → `reload`; `scrollResetKey` reset cuộn khi đổi bước; draft GoAdmin giữ qua `verificationReviewDraft` |
| 8 | GoAdmin nhiều kích thước, zoom 200%, keyboard, sticky rail | **PASS (source-level)** | Rail sticky ≥1181px; ≤1180px (tương đương zoom ~200% trên 1280px) rail thành 1 cột + **thanh "Tới quyết định" sticky đáy**; focus-visible toàn cục; bảng đối chiếu cuộn ngang trong khung 680px. *Render thật: xem §7 #4* |
| 9 | Không đổi design system / API / Identity Lock / revision / Idempotency | **PASS** | Diff chỉ nằm trong `features/verification/**`, `tests/**`, `docs/**` (mobile) và `pages/*verification*`, `layout.css`, `test/verification-review.test.tsx` (GoAdmin). **Không** sửa `packages/ui`, `packages/shared`, route `src/app/**`, DTO, endpoint |
| 10 | Screenshot before/after | **NOT VERIFIED** | Không có `adb`, không có emulator, không có Playwright/Puppeteer trong hai repo → không thể render/capture |
| 11 | Lint, typecheck, test, build, Impeccable audit | **PASS** | Xem §5 |
| 12 | Git diff, secret, PII, thay đổi ngoài phạm vi | **PASS** | Xem §6 |

---

## 2. Thay đổi chính trong đợt release gate

### 2.1 Nhập ngày bằng date selection có sẵn (item 6)

- 4 trường `cccd_dob`, `gplx_dob`, `cccd_expiry_date`, `expiry_date` không còn là `TextInput`; thay bằng ô bấm mở **`CustomDatePickerModal`** (wheel ngày/tháng/năm, có sẵn trong `@datxe/ui`, dùng ở Customer `RegisterScreen`/`EditProfileScreen`).
- Hiển thị `dd/mm/yyyy`, lưu ISO `yyyy-mm-dd` đúng hợp đồng API (`confirmedDetails` không đổi).
- `Hạn CCCD`, `Hạn GPLX` không còn hậu tố `(YYYY-MM-DD)` trong nhãn; `Ngày sinh` giới hạn `maximumDate = hôm nay`.
- `GPLX không thời hạn` → ô ngày hiển thị "Không thời hạn" và bị khoá.
- Helper mới `isoToLocalDate()` / `localDateToIso()` (test riêng), tránh lệch múi giờ bằng mốc 12:00 local.
- Trường hợp dữ liệu OCR cũ không parse được: hiện "Ngày đã lưu chưa hợp lệ. Chạm vào ô ngày để chọn lại." (bỏ chip "Dùng định dạng …" thừa).

### 2.2 Retry khi lỗi mạng (item 6)

- `run()` phân loại lỗi: chỉ `NETWORK`, `TIMEOUT`, `SERVER` mới bật retry (lưu trong `retryRef`, không tạo state phụ).
- Footer hiển thị `AlertBanner` lỗi + **"Thử lại"** gọi lại đúng thao tác vừa thất bại (không phải chỉ refresh màn).
- Lỗi nghiệp vụ (`REVISION_CONFLICT`, `FIELD_MISSING`, `WARNING_ACK_REQUIRED`…) không hiện nút retry vì phải xử lý dữ liệu trước.
- **Pre-commit review phát hiện và sửa:** ở trạng thái `pending` footer return sớm nên lý do lỗi mạng bị ẩn; nay banner lỗi hiển thị ngay trên nút "Thử nộp lại" (một hành động retry duy nhất) — có test hồi quy riêng.

### 2.3 Footer CTA cho trạng thái chỉ đọc (item 3)

- Trạng thái đã xác minh trước đây không có footer, CTA "Chọn loại xe nhận lái hộ" nằm cuối vùng cuộn.
- Nay CTA này nằm trong **footer vùng ngón cái** (`DriverPage footer`), nút trong `VerifiedBaselineView` được bỏ để không trùng.

### 2.4 Lỗi lint phát hiện trong audit và cách xử lý

- `run()` gọi `setState` đồng bộ khi mount → `react-hooks/set-state-in-effect` (React Compiler) báo lỗi.
- Giữ nguyên hành vi, chuyển retry sang `retryRef` (chỉ đọc trong render sau khi `showMessage` đã gây re-render) thay vì state riêng; `npm run check` đạt lại toàn bộ.


---

## 3. Ma trận primary CTA theo màn (item 5)

| Màn / trạng thái | Primary duy nhất | Ghi chú |
|---|---|---|
| PREPARE (mới / DRAFT) | "Bắt đầu chụp ảnh" (footer) | Banner NEEDS_MORE_INFO dùng `secondary` |
| CAPTURE | "Mở camera hướng dẫn" / "Tiếp tục" / "Hoàn tất chụp ảnh" (footer) | Nút QR trong nội dung = `secondary` |
| OCR | "Tiếp tục kiểm tra thông tin" (footer) | "Đọc thông tin tự động" = `secondary` |
| CONFIRM_FIELDS | "Xem tổng hợp" (footer, khoá khi còn lỗi) | "Quét QR" = `secondary`, "Xem ảnh" = `ghost` |
| SUMMARY | "Nộp hồ sơ" / "Nộp bổ sung" (footer) | "Sửa thông tin" chỉ còn ở footer |
| Pending submit | "Thử nộp lại" (footer) | |
| SUBMITTED / UNDER_REVIEW | "Quay về trang chủ" (`secondary`) | Không có primary — đúng (không có hành động bắt buộc) |
| APPROVED (baseline) | "Chọn loại xe nhận lái hộ" (footer) | "Cập nhật giấy tờ" = `secondary` |
| REJECTED (không baseline) | "Tạo yêu cầu hồ sơ mới" (banner) | Footer không render (`canEdit=false`) |
| NEEDS_MORE_INFO | "Bắt đầu chụp ảnh" (footer) | Flash: banner chỉ mô tả phạm vi cần bổ sung + nút `secondary` |

GoAdmin: mỗi trạng thái chỉ có **một** nút submit "Lưu quyết định" (trong rail), các nút khác là `default`/`link`.

---

## 4. Impeccable audit (native, code-level)

`impeccable context --target apps/driver/src/features/verification/VerificationScreen.tsx` — đã chạy, PRODUCT/DESIGN nạp đúng.
`impeccable detect` trên 3 file UI thay đổi (`VerificationFieldsStep`, `VerificationFooter`, `VerificationReview`) — **0 finding**; binary chỉ chạy regex-match cho `.tsx`, các rule cần DOM (tiny-text, low-contrast) không chạy được nếu không có dev server → coi là undercount, không phải "clean bill".
`impeccable audit` — verb này **không có** trong binary hiện tại (chỉ `detect`); audit native thực hiện theo `reference/audit.native.md` (code-level), kết quả ở bảng dưới.
`impeccable doctor` — **PASS**, 2 advisory có sẵn từ trước, **không sửa** theo quy tắc skill:
- `design-sidecar-stale`: `DESIGN.md` mới hơn `.impeccable/design.json`.
- `workspace-context-inherited`: 3 workspace kế thừa PRODUCT.md gốc.

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 4 | Mọi control có label/role/state; switch 1 điểm focus; target ≥48dp; `useReducedMotion` cho modal & press |
| 2 | Performance | 3 | `FlatList` cho wheel ngày; ảnh `expo-image` + cache; component tách theo bước; chưa đo FPS trên máy thật |
| 3 | Appearance & Theming | 4 | 0 raw hex/shadow/border trang trí (test tự động); Light/Dark qua token |
| 4 | Platform Conformance | 4 | Back Android đóng modal đúng nghĩa; safe area; control native (Switch, Modal, ScrollView) |
| 5 | Adaptivity | 3 | Bố cục wrap theo `fontScale`; camera/QR chỉ khoá dọc ở GuidedCapture, QrScanner chưa khai báo `supportedOrientations` |
| **Total** | | **18/20** | **Excellent (static)** — chưa kiểm chứng runtime |

Findings còn lại (P2/P3, không chặn):
- **[P3] QrScanner landscape**: thêm `supportedOrientations={['portrait']}` nếu muốn cố định dọc (hiện dựa vào layout + insets).
- **[P3] Screen reader**: chưa đọc thử TalkBack/VoiceOver.

---

## 5. Test / build ledger

| Repo | Lệnh | Kết quả |
|---|---|---|
| `F:\datxe_rn` | `npm run check` (architecture + typecheck + lint + test) | **PASS** — 0 lỗi, **254/254** test |
| `F:\goAdmin` | `pnpm run lint` | **PASS** — 0 error, 0 warning |
| `F:\goAdmin` | `pnpm run typecheck` | **PASS** |
| `F:\goAdmin` | `pnpm run test` | **PASS** — 12 file, **100/100** test |
| `F:\goAdmin` | `pnpm run build` | **PASS** — `tsc --noEmit` + `vite build` (chỉ còn cảnh báo chunk >1100kB có từ trước) |
| `F:\datxe_rn` | `impeccable doctor` | **PASS** (2 advisory có sẵn) |
| `F:\datxe_rn\apps\driver` | `npx expo export --platform android` | **PASS** — Hermes bundle `index-7725aed3…hbc` (9.2MB), exit 0. Artifact ở `.expo-export/release-gate` (đã gitignore) |

Test mới bổ sung:
- `tests/verification-ux-presentation.test.cjs` → `isoToLocalDate`/`localDateToIso` round-trip, không còn `YYYY-MM-DD` trong `VerificationFieldsStep`, có `CustomDatePickerModal`.
- `tests/verification-ux-presentation.test.cjs` → trạng thái `pending` giữ banner lỗi và chỉ có **một** nút retry.

---

## 6. Git diff, secret, PII, phạm vi (item 12)

- Diff kết hợp hai repo: **176.313 ký tự**, quét regex:
  | Mẫu | Số khớp |
  |---|---|
  | Private key / PEM | 0 |
  | `sk-…`, `ghp_…`, `AIza…`, `xox…` | 0 |
  | Bearer token literal | 0 |
  | Chuỗi 12 chữ số (CCCD) | 0 |
  | Email | 0 |
  | Số điện thoại VN | 0 |
  | `console.log` / `debugger` / `FIXME` | 0 |
  | Conflict marker | 0 |
- Không có file ngoài phạm vi eKYC (không đụng `packages/ui`, `packages/shared`, `apps/*/src/app`, `api.ts`, DTO, migration).
- Quy mô diff: `F:\datxe_rn` **17 file / +845 −200**; `F:\goAdmin` **7 file / +784 −195**.
- Working tree vốn đã có thay đổi chưa commit từ các đợt trước (`CapabilitiesScreen.tsx`, `VerificationShared.tsx`, phần lớn `verificationLabels.ts`, `Drivers.tsx`, `FaceComparisonPanel.tsx`, `LicensePolicyPreview.tsx`, `verificationReviewModel.ts`) — đợt này **kế thừa, không ghi đè**.
- Không commit, không push, không deploy.

### Danh sách file thay đổi

**F:\datxe_rn**

| File | Loại |
|---|---|
| `apps/driver/src/features/verification/components/VerificationFieldsStep.tsx` | date picker + bỏ chip định dạng |
| `apps/driver/src/features/verification/verificationLabels.ts` | `isoToLocalDate`, `localDateToIso` |
| `apps/driver/src/features/verification/workflow.ts` | nhãn ngày bỏ `(YYYY-MM-DD)`, `OCR → Đọc từ ảnh` |
| `apps/driver/src/features/verification/VerificationScreen.tsx` | retry action, footer read-only, wiring |
| `apps/driver/src/features/verification/components/VerificationFooter.tsx` | error + "Thử lại", issue count |
| `apps/driver/src/features/verification/components/VerificationStatusView.tsx` | bỏ CTA trùng, banner secondary |
| `apps/driver/src/features/verification/components/VerificationSummaryStep.tsx` | bỏ nút "Sửa thông tin" trùng, switch a11y |
| `apps/driver/src/features/verification/components/VerificationStepHeader.tsx` | 48dp + nhãn slot |
| `apps/driver/src/features/verification/components/VerificationCaptureStep.tsx` | switch a11y, QR secondary |
| `apps/driver/src/features/verification/components/VerificationPrepareStep.tsx` | switch a11y |
| `apps/driver/src/features/verification/components/VerificationExtractionStep.tsx` | QR secondary |
| `apps/driver/src/features/verification/QrScannerScreen.tsx` | `onClose`, reduced motion, CTA ngoài scroll, copy |
| `apps/driver/src/features/verification/GuidedCaptureScreen.tsx` | reduced motion |
| `apps/driver/src/features/verification/CapabilitiesScreen.tsx` | (đợt trước, giữ nguyên) |
| `apps/driver/src/features/verification/components/VerificationShared.tsx` | (đợt trước, giữ nguyên) |
| `tests/driver-verification.test.cjs` | nhãn origin mới |
| `tests/verification-ux-presentation.test.cjs` | test date picker + nhãn switch |
| `docs/ekyc-ui-ux-optimization-round3.md` | mới (báo cáo đợt 3) |
| `docs/ekyc-final-release-gate-2026-11-20.md` | mới (báo cáo này) |

**F:\goAdmin**

| File | Loại |
|---|---|
| `src/pages/VerificationReview.tsx` | rail sticky, checklist, error summary, jump bar, bỏ cột trùng |
| `src/layout.css` | layout rail, jump bar, responsive ≤1180, focus ring |
| `src/test/verification-review.test.tsx` | copy xác nhận theo revision |
| `src/pages/Drivers.tsx`, `FaceComparisonPanel.tsx`, `LicensePolicyPreview.tsx`, `verificationReviewModel.ts` | (đợt trước, giữ nguyên) |

---

## 7. NOT VERIFIED — 6 hạng mục con (không tính PASS)

| # | Hạng mục con | Thuộc checklist | Vì sao chưa kiểm chứng |
|---|---|---|---|
| 1 | E2E thiết bị thật: đăng nhập tài xế → chụp → đọc → nộp | #1 | Không có `adb`/emulator trong môi trường |
| 2 | Light/Dark + `font_scale 1.3`/`2.0` + landscape | #3 | Không render được trên thiết bị |
| 3 | TalkBack/VoiceOver | #3 | Không có thiết bị/trình đọc màn hình |
| 4 | GoAdmin render thật ở zoom 200% và nhiều kích thước | #8 | Không có trình duyệt tự động |
| 5 | Screenshot before/after | #10 | Không có `adb`/Playwright → **đây là mục NOT VERIFIED duy nhất trong checklist** |
| 6 | OCR/QR/face trên dịch vụ eKYC đã triển khai | #1 | Không gọi dịch vụ trả phí/không có phiên đăng nhập thật |

Khuyến nghị trước khi phát hành: chạy 1 lượt thiết bị thật (Android 13+) cho 3 trạng thái `NEEDS_MORE_INFO` → `SUBMITTED` → `APPROVED`, kèm 1 lần tắt mạng giữa lúc nộp để xác nhận "Thử lại" + `Idempotency-Key`.

---

## 8. Pre-commit review (20/11/2026)

### 8.1 Trạng thái Git

| Repo | Branch | HEAD | Upstream | Ahead/Behind | Staged |
|---|---|---|---|---|---|
| `F:\datxe_rn` | `integration/mobile-release` | `d9ea0e5` feat(driver): redesign eKYC flow UX and sync photos before summary | `origin/integration/mobile-release` | **ahead 1 / behind 0** | trống |
| `F:\goAdmin` | `integration/admin-release` | `42e2bae` fix(admin): surface verification validation and activation errors | `origin/integration/admin-release` | ahead 0 / behind 0 | trống |

- `F:\datxe_rn`: 17 file tracked bị sửa + 2 tài liệu mới (untracked). Có **1 commit chưa push** (`d9ea0e5`) từ đợt trước.
- `F:\goAdmin`: 7 file tracked bị sửa, chưa commit.
- Không có file nào được stage; **không commit, không push, không deploy** trong lượt này.

### 8.2 Phân loại thay đổi chưa commit theo nghiệp vụ

| Nhóm nghiệp vụ | File | Tính chất |
|---|---|---|
| **Chọn ngày dd/mm/yyyy** | `VerificationFieldsStep.tsx`, `verificationLabels.ts`, `workflow.ts`, `tests/verification-ux-presentation.test.cjs` | Mới — thay 4 ô nhập ngày bằng `CustomDatePickerModal`, lưu ISO |
| **Retry lỗi mạng** | `VerificationScreen.tsx`, `VerificationFooter.tsx`, test | Mới — `NETWORK/TIMEOUT/SERVER` + banner lỗi ở trạng thái pending |
| **CTA & trùng lặp** | `VerificationScreen.tsx`, `VerificationFooter.tsx`, `VerificationStatusView.tsx`, `VerificationSummaryStep.tsx`, `QrScannerScreen.tsx`, GoAdmin `VerificationReview.tsx` | Tinh chỉnh — 1 primary/màn, footer read-only, bỏ 4 thành phần trùng |
| **A11y & touch target** | `VerificationStepHeader.tsx`, `VerificationCaptureStep.tsx`, `VerificationPrepareStep.tsx`, `VerificationFieldsStep.tsx`, `VerificationSummaryStep.tsx` | Tinh chỉnh — 48dp, 1 điểm focus/công tắc, nhãn đầy đủ |
| **QR scanner & camera** | `QrScannerScreen.tsx`, `GuidedCaptureScreen.tsx`, `VerificationExtractionStep.tsx` | Sửa hành vi — Back chỉ đóng, CTA ngoài vùng cuộn, reduced motion |
| **Copy/thuật ngữ** | `workflow.ts`, `QrScannerScreen.tsx`, `VerificationStatusView.tsx` | Mới — bỏ "OCR", nhãn nút rõ hành động |
| **GoAdmin duyệt hồ sơ** | `VerificationReview.tsx`, `layout.css`, `test/verification-review.test.tsx` | Mới — rail sticky, checklist, error summary, jump bar, responsive |
| **Kế thừa (đợt trước, chưa commit)** | `CapabilitiesScreen.tsx`, `VerificationShared.tsx`, phần đầu `verificationLabels.ts`; GoAdmin `Drivers.tsx`, `FaceComparisonPanel.tsx`, `LicensePolicyPreview.tsx`, `verificationReviewModel.ts` | Giữ nguyên, không sửa thêm |
| **Tài liệu** | `docs/ekyc-ui-ux-optimization-round3.md`, `docs/ekyc-final-release-gate-2026-11-20.md` | Mới |

### 8.3 Kiểm tra kế thừa từ các đợt eKYC trước

| Hạng mục kế thừa | Trạng thái | Bằng chứng |
|---|---|---|
| `captureInvalidationScope` (chỉ vô hiệu hoá giấy tờ vừa thay ảnh) | Giữ | 3 file còn tham chiếu + test "retaking another document or selfie preserves completed QR" |
| `visibleObservationWarnings` / `driverWarningMessage` / `groupVerificationWarnings` | Giữ | 5 file + 3 test presentation |
| `DriverPhoto sensitive` + `cachePolicy` | Giữ | `VerificationShared.tsx` không bị sửa trong lượt này |
| `CapabilitiesScreen` dedupe banner/Divider | Giữ | Test "CapabilitiesScreen deduplicates global blocker banners" PASS |
| GoAdmin draft/`formatFieldText`/`verificationApplicationPath`/`faceComparisonAvailable` | Giữ | grep 3–7 hit mỗi ký hiệu; 100/100 test GoAdmin PASS |
| Subtitle QR "Đưa mã QR trên giấy tờ vào giữa khung" (commit `d9ea0e5`) | Giữ | `git show d9ea0e5` vs nội dung hiện tại |

Không có file nào bị revert về trạng thái trước `d9ea0e5`; diff hiện tại chỉ thêm/sửa trong phạm vi eKYC.

### 8.4 Kiểm tra đặc biệt

| # | Hạng mục | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Retry không gây nộp trùng hồ sơ | **PASS** | `operation.current` chặn thao tác song song; `pendingRef` chỉ bị xoá khi thành công hoặc lỗi nghiệp vụ (`REVISION_CONFLICT`, `INVALID_TRANSITION`, `FIELD_MISSING`, `EXTRACTION_REQUIRED`, `WARNING_ACK_REQUIRED`); footer `pending` chỉ còn **một** nút retry (test mới `pending submit …`) |
| 2 | `Idempotency-Key` giữ đúng khi retry | **PASS** | `Pending = {id, revision, key}` tạo bằng `operationKey()` **một lần**, retry dùng lại `request.key` ở header `Idempotency-Key`; test transport xác nhận 2 lần gửi cùng key (line 96–99) |
| 3 | Chuyển đổi ngày không lệch múi giờ | **PASS** | `isoToLocalDate()` dựng `Date(y, m-1, d, 12:00)` local (tránh DST), `localDateToIso()` đọc `getFullYear/getMonth/getDate`; chạy lại `tests/verification-ux-presentation.test.cjs` dưới `TZ=America/New_York` và `TZ=Pacific/Kiritimati` — 10/10 pass cả hai |
| 4 | Revision guard còn hiệu lực | **PASS** | `prepareSummary()`/`submit()` so `expected` với `base.revision`, ném `REVISION_CONFLICT`; diff không sửa dòng guard nào (chỉ xoá `onEditFields` trùng) |
| 5 | Identity Lock còn hiệu lực | **PASS** | `manual()` return sớm khi `isIdentityLockedField(...)`; ô ngày của trường bị khoá có `fieldEditable=false` → picker disabled; test identity-lock PASS |
| 6 | Không có đường dẫn bypass xác minh | **PASS** | Không thêm route trong `src/app/**`, không sửa `api.ts`/DTO, không thêm cờ bỏ qua; các cổng `consent`, `confirm`, `warningReview`, `slotAllowed`, `identityHold` nguyên vẹn |

### 8.5 Secret, PII, file tạm và ảnh kiểm thử

| Mẫu | Kết quả |
|---|---|
| Private key / PEM / `sk-` / `ghp_` / `AIza` / `xox` / JWT / Bearer literal | **0** |
| Chuỗi 12 chữ số (CCCD), email, số điện thoại VN | **0** |
| `console.log` / `debugger` / `FIXME` trong mã thay đổi | **0** (3 hit trước đó là chính chữ mô tả trong tài liệu) |
| Conflict marker | **0** |

- `apps/customer/team-dev-customer.jks`, `apps/driver/team-dev-driver.jks`, `debug.keystore` → **đã gitignore**, không bị stage.
- `F:\goAdmin\.env.production` được track nhưng chỉ chứa `VITE_API_BASE_URL` (biến public của Vite), không có khoá bí mật; `.env.local` đã ignore.
- `screenshots_ekyc/`, `.expo-export/`, `.native-build/`, `.expo/` → ignored.
- ⚠️ `screenshot/` (1 mục) **chưa** bị ignore và đang untracked → **không được `git add -A`**; nếu muốn triệt để, thêm `screenshot/` vào `.gitignore` ở commit riêng.
- Các thư mục `.agent*/`, `.codex/`, `.cursor/`, `.trae/`, `skills-lock.json` là untracked có sẵn từ trước, **ngoài phạm vi** commit eKYC.

### 8.6 Chạy lại kiểm chứng

| Lệnh | Kết quả |
|---|---|
| `F:\datxe_rn`: `npm run check` | **PASS** — architecture, typecheck, lint, **254/254** test |
| `F:\datxe_rn`: `git diff --check` | **PASS** (exit 0) |
| `F:\goAdmin`: `pnpm run lint` / `typecheck` | **PASS** |
| `F:\goAdmin`: `pnpm run test` | **PASS** — 12 file, **100/100** |
| `F:\goAdmin`: `pnpm run build` | **PASS** |
| `F:\goAdmin`: `git diff --check` | **PASS** (exit 0) |

### 8.7 Đã sửa trong pre-commit review

1. **Không thống nhất số NOT VERIFIED**: §0 giờ ghi rõ 11 PASS / 0 FAIL / 1 NOT VERIFIED (checklist) và **6 hạng mục con runtime** (§7) — khớp với bảng checklist và danh sách §7.
2. **Regression footer `pending`**: trước đó khi nộp thất bại do mạng, footer return sớm nên lý do lỗi bị ẩn; nay banner lỗi hiện ngay trên "Thử nộp lại", chỉ một nút retry. Thêm test hồi quy (`pending submit keeps the failure reason visible …`).
3. Đồng bộ tài liệu: `retryAction` → `retryRef`, số test 253 → **254**.

### 8.8 Danh sách file stage & commit message

**`F:\datxe_rn`** — `git add` đúng các đường dẫn sau (không dùng `-A`):

```
apps/driver/src/features/verification/CapabilitiesScreen.tsx
apps/driver/src/features/verification/GuidedCaptureScreen.tsx
apps/driver/src/features/verification/QrScannerScreen.tsx
apps/driver/src/features/verification/VerificationScreen.tsx
apps/driver/src/features/verification/components/VerificationCaptureStep.tsx
apps/driver/src/features/verification/components/VerificationExtractionStep.tsx
apps/driver/src/features/verification/components/VerificationFieldsStep.tsx
apps/driver/src/features/verification/components/VerificationFooter.tsx
apps/driver/src/features/verification/components/VerificationPrepareStep.tsx
apps/driver/src/features/verification/components/VerificationShared.tsx
apps/driver/src/features/verification/components/VerificationStatusView.tsx
apps/driver/src/features/verification/components/VerificationStepHeader.tsx
apps/driver/src/features/verification/components/VerificationSummaryStep.tsx
apps/driver/src/features/verification/verificationLabels.ts
apps/driver/src/features/verification/workflow.ts
tests/driver-verification.test.cjs
tests/verification-ux-presentation.test.cjs
docs/ekyc-ui-ux-optimization-round3.md
docs/ekyc-final-release-gate-2026-11-20.md
```

Commit message:

```
feat(driver): pick eKYC dates with shared picker and add network retry

- Chọn ngày sinh/hạn giấy tờ bằng CustomDatePickerModal của @datxe/ui,
  lưu ISO yyyy-mm-dd, hiển thị dd/mm/yyyy, không lệch múi giờ.
- Thêm "Thử lại" cho NETWORK/TIMEOUT/SERVER, giữ nguyên Idempotency-Key
  giữa các lần gửi và hiện lý do lỗi ở trạng thái pending.
- Bỏ CTA trùng, mỗi màn một primary CTA, footer cho trạng thái đã xác minh.
- Switch còn một điểm focus, touch target 48dp, reduced motion cho modal.
- QR scanner: Back chỉ đóng, CTA ngoài vùng cuộn, bỏ thuật ngữ "OCR".
- Test: date helpers, pending retry banner (254/254).
```

**`F:\goAdmin`** — `git add`:

```
src/layout.css
src/pages/Drivers.tsx
src/pages/FaceComparisonPanel.tsx
src/pages/LicensePolicyPreview.tsx
src/pages/VerificationReview.tsx
src/pages/verificationReviewModel.ts
src/test/verification-review.test.tsx
```

Commit message:

```
feat(admin): keep the eKYC decision rail visible with a readiness checklist

- Rail quyết định sticky + checklist 5 mục, error summary có "Đi tới".
- Thanh "Tới quyết định" sticky đáy cho màn hẹp và zoom 200%.
- Xác nhận đối chiếu theo revision, tag cảnh báo chặn kích hoạt.
- Bỏ cột "Thao tác" trùng hành động với nút mã hồ sơ.
- Drawer 1120px, heading h3→h4, tiêu đề kèm tài xế và bản nộp.
```

### 8.9 Trạng thái commit

**Chưa commit.** Lượt review này không có uỷ quyền commit rõ ràng (yêu cầu là "pre-commit review": chuẩn bị danh sách stage + commit message). Không push, không merge, không deploy.

- `F:\datxe_rn`: HEAD `d9ea0e5` trên `integration/mobile-release`, **ahead 1** so với upstream — commit mới sẽ là commit thứ 2 chưa push.
- `F:\goAdmin`: HEAD `42e2bae` trên `integration/admin-release`, ngang upstream — commit mới sẽ là commit đầu tiên chưa push.
