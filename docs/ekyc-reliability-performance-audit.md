# eKYC Reliability & Performance Hardening — Audit & Delivery Report

Date: 2026-11-19  
Scope: `F:\datxe_rn` (`apps/driver`), `F:\datxebackend`, `F:\ekyc-service`  
Status: Implemented & verified locally across unit, integration, concurrency, typecheck, lint, and bundle export gates. No git commits, merges, pushes, or cloud deploys were performed.

---

## 1. Root Cause Analysis (Verified vs Hypothesized)

### Verified Root Causes
1. **Unoptimized multi-MB photos uploaded over mobile + Cloudflare Tunnel (`https://api.ptitgo.me`):**
   - `GuidedCaptureScreen.tsx` captured photos at `quality: 0.9` with full sensor dimensions (benchmarked locally on real Android captures: `4080×3060` at `2.37–3.55 MB`).
   - Direct timing probe of `PUT /ekyc/driver-verification/v1/applications/{id}/captures/cccd_front` through `https://api.ptitgo.me` took `5.98s` even for a `~30 KB` image before Spring Security `401`. Unresized `2.4–3.55 MB` images compound upload latency significantly on cellular connections.
2. **Backend held PostgreSQL `FOR UPDATE` row lock during Modal HTTP inference:**
   - `DriverVerificationWorkflowService.extractSlot()` (and `faceQuality()`) was annotated `@Transactional`, acquiring `SELECT ... FOR UPDATE` inside `requireAccessibleApp(..., forUpdate = true)` BEFORE calling `ekycClient.extract(...)`.
   - `EkycConfig` previously set `readTimeoutMs = 45_000` with `maxRetries = 1` (worst-case ~`90s` backend execution), while the Driver phone client (`VerificationScreen.tsx`) timed out early at `39_000 ms`. When the phone timed out and the user tapped **"Quét mã QR trực tiếp"**, backend `extractSlot()` was still holding the PostgreSQL row lock on `driver_verification_applications`, blocking `POST /qr-scan` (`forUpdate = true`) beyond Hikari's `lock_timeout = '3s'` or Modal completion.
3. **Driver Live QR scanner blocked on photo re-uploads & metadata fetches:**
   - `VerificationScreen.submitQrLivePayload()` previously called `loadOrCreate()` and looped `for (slotKey of pairSlots) upload(slotKey, base, ...)` BEFORE calling `POST /qr-scan` (`timeoutMs: 25_000`), even though `DriverVerificationWorkflowService.submitQrLiveScan()` parses QR payloads locally in Kotlin without calling Modal and `attachmentId` is optional.
   - When `runSlotExtraction` timed out on `cccd_front`, `cccd_back` remained un-uploaded; tapping live QR scan forced uploading that un-uploaded multi-MB `cccd_back` photo first, causing the `Kết nối quá thời gian` failure observed inside `QrScannerScreen`.
4. **Timeout budget mismatch & missing server proposal recovery:**
   - `apps/driver` client timed out at `39_000 ms` on `/extract/{slot}` while backend allowed `45_000 ms` x `2` attempts + retry sleep.
   - Backend `GET /applications/{id}` already returned `document.proposals` from `buildWorkingDocument()`, yet `Application` in `apps/driver/src/features/verification/api.ts` did not type `proposals` and `reload()` did not hydrate them into `observations`.
5. **Modal cold start + inference latency baseline (measured live on `https://quyennv1912ptit--ekyc-extraction-staging-cccd-api.ap-south.modal.run`, `sha-540d4249d2cc`):**
   - Cold-start `/health` (from `min_containers=0`, `scaledown_window=120`): `13.23s`.
   - Warm `/ready` (`404`): `0.15s`; warm `POST /ekyc/documents/cccd_front/extract`: `8.53s`; warm `cccd_back/extract`: `7.53s`.
   - With `13.23s` cold start + `~8.5s` inference + tunnel/upload latency (~`22–30s+`), occasional spikes easily exceeded `39s` without client-side timeout margin or server proposal hydration.

### Cannot Distinguish Without Authenticated Production Session (Not Claimed)
- Unauthenticated `GET/POST https://api.ptitgo.me/ekyc/driver-verification/v1/*` returns `HTTP 401` (`0.38s–0.56s`) at Spring Security before controller routing, so production's exact deployed git SHA between `origin/main` and `integration/backend-release` could not be verified without an authenticated driver JWT or actuator git info.

---

## 2. Image Optimization Benchmark (`F:\ekyc-service\tests\data` Real Android Fixtures)

Executed locally on `DocumentExtractor` (CPU `YOLO card_pose_v3_best.pt + EasyOcrEngine`, warmup `4453 ms`):

| Fixture | Preset | Output Resolution | JPEG Size | Inference Time | OCR Parsed Fields |
|---|---|---|---:|---:|---|
| `cccd_front` (`4080×3060`) | Original `q=90` | `4080×3060` | `2372 KB` | `22,627 ms` | `4` (`dob`, `gender`, `address`, `expiry`) |
| `cccd_front` (`4080×3060`) | `max=2000, q=85` | `2000×1500` | `622 KB` | `17,597 ms` | `4` (`dob`, `gender`, `address`, `expiry`) |
| `cccd_front` (`4080×3060`) | **`max=1800, q=82` (Selected)** | **`1800×1350`** | **`463 KB`** | **`17,653 ms`** | **`4` (`dob`, `gender`, `address`, `expiry`)** |
| `cccd_front` (`4080×3060`) | `max=1600, q=82` | `1600×1200` | `373 KB` | `17,589 ms` | `4` (`dob`, `gender`, `address`, `expiry`) |
| `cccd_back` (`4080×3060`) | Original `q=90` | `4080×3060` | `3554 KB` | `17,227 ms` | — |
| `cccd_back` (`4080×3060`) | **`max=1800, q=82` (Selected)** | **`1800×1350`** | **`468 KB`** | **`16,691 ms`** | — |
| `gplx_front` (`3060×4080`) | Original `q=90` | `3060×4080` | `3259 KB` | `29,472 ms` | `1` (`vehicle_class`) |
| `gplx_front` (`3060×4080`) | `max=2000, q=85` | `1500×2000` | `631 KB` | `28,524 ms` | `1` (`vehicle_class`) |
| `gplx_front` (`3060×4080`) | **`max=1800, q=82` (Selected)** | **`1350×1800`** | **`474 KB`** | **`27,939 ms`** | **`1` (`vehicle_class`)** |
| `gplx_front` (`3060×4080`) | `max=1600, q=82` | `1200×1600` | `386 KB` | `28,120 ms` | **`0` (`[]` — dropped `vehicle_class`)** |

**Decision:** Normalize document captures to `maxLongSide = 1800px` (`SELFIE_MAX_LONG_SIDE = 1600px`) and `JPEG quality = 0.82` using `expo-image-manipulator`, shrinking uploads by **~80–87%** while preserving `min_side >= 1012px >= settings.min_image_side_px (1000)` and avoiding the `1600px` GPLX accuracy drop. Low-resolution photos (`<= maxLongSide`) are never upscaled.

---

## 3. Changes Implemented

### `F:\datxebackend` (`integration/backend-release` @ `240dca5`)
- **[DriverVerificationWorkflowService.kt](file:///F:/datxebackend/src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWorkflowService.kt):**
  - Removed `@Transactional` from `extractSlot()` and `faceQuality()`, introducing explicit `TransactionTemplate` (`inTransaction`) via optional `PlatformTransactionManager? = null`.
  - Refactored `extractSlot()` into 3 stages:
    1. **Stage A (short TX):** Acquires `FOR UPDATE`, checks auth/revision/slot/capture; returns cached `proposal_json` immediately if unchanged, or returns immutable `ExtractStageA.Pending` snapshot and commits immediately — releasing the DB row lock and JDBC connection.
    2. **Stage B (no TX / no DB lock):** Reads encrypted image bytes and calls `ekycClient.extract(...)`.
    3. **Stage C (short TX):** Re-acquires `FOR UPDATE`, validates `revision == expectedRevision`, `EDITABLE_STATES`, and active capture `id`/`sha256` match (throwing `409 REVISION_CONFLICT` fail-closed on stale OCR), then persists `proposal_json`, increments revision, updates QR CCCD HMAC, and writes audit log.
  - Updated `faceQuality()` so `ekycClient.evaluateFace(...)` runs outside DB transactions.
- **[EkycClient.kt](file:///F:/datxebackend/src/main/kotlin/com/nhom15/datxebackend/ekyc/EkycClient.kt), [EkycConfig.kt](file:///F:/datxebackend/src/main/kotlin/com/nhom15/datxebackend/ekyc/EkycConfig.kt), [application.properties](file:///F:/datxebackend/src/main/resources/application.properties):**
  - Set default `app.ekyc.read-timeout-ms = 50000` and added `app.ekyc.total-deadline-ms = 60000`.
  - `EkycClient.executeWithRetry()` checks elapsed deadline before sleeping/retrying transient `502`/`503`/`EKYC_BUSY` errors; timeouts (`504`/socket timeout), `4xx`, and `429` are never retried.
- **[EkycClientTest.kt](file:///F:/datxebackend/src/test/kotlin/com/nhom15/datxebackend/ekyc/EkycClientTest.kt) & [VerificationConcurrencyPostgresTest.kt](file:///F:/datxebackend/src/test/kotlin/com/nhom15/datxebackend/driver/verification/VerificationConcurrencyPostgresTest.kt):**
  - Added retry-deadline unit test and 4 PostgreSQL concurrency tests (isolated Flyway schema `ekyc_rel_*` dropped in `@AfterEach`) covering: simulated 60s Modal delay proving zero `RowExclusiveLock` via `pg_locks` and unblocked `/qr-scan`; concurrent `extractSlot` race; capture replacement discarding stale OCR; and idempotent server `proposal_json` reuse.

### `F:\datxe_rn` (`apps/driver`, `integration/mobile-release` @ `dee092d` working tree)
- **[apps/driver/package.json](file:///F:/datxe_rn/apps/driver/package.json):** Added `expo-image-manipulator` (`~58.0.16`).
- **[imageOptimization.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/imageOptimization.ts):** Pure proportional downscaling (`1800px` document / `1600px` selfie, JPEG `0.82`), no upscaling, aspect-ratio & orientation preservation, temp cache cleanup (`removeCacheFile`), small JPEG pass-through (`<= 650 KB`), and zero-crash fallback if native module is missing on an older dev-client build.
- **[GuidedCaptureScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/GuidedCaptureScreen.tsx) & [VerificationScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx):** Normalized both camera and gallery captures; ran EXIF lighting check before metadata stripping.
- **[api.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/api.ts) & [reliabilityHelpers.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/reliabilityHelpers.ts):**
  - Typed `Application.document.proposals`.
  - Synchronized per-operation timeouts: `METADATA_TIMEOUT_MS = 15_000`, `UPLOAD_TIMEOUT_MS = 45_000`, `EXTRACT_TIMEOUT_MS = 65_000`, `QR_SCAN_TIMEOUT_MS = 15_000`, `FACE_QUALITY_TIMEOUT_MS = 45_000`, `SUBMIT_TIMEOUT_MS = 25_000`.
  - Decoupled `submitQrLivePayload()` from OCR & forced photo uploads via `resolveQrAttachmentBinding()`; added single `reload()` + retry on `409 REVISION_CONFLICT` gated by `generation.current`.
  - Added server proposal hydration in `reload()` & `runSlotExtraction()` (`hydratableObservationsFromApplication()`), plus post-timeout sync recovery preserving photos and manual/identity-locked fields.
- **[QrScannerScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/QrScannerScreen.tsx) & [VerificationExtractionStep.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/components/VerificationExtractionStep.tsx):** Unified task-specific Vietnamese status copy (`Đang tải ảnh…`, `Đang đọc thông tin giấy tờ. Quá trình này có thể mất một lúc.`, `Đang kiểm tra thông tin QR…`, `Đã hoàn thành.`) while keeping the redesigned UI untouched.
- **[tests/driver-verification.test.cjs](file:///F:/datxe_rn/tests/driver-verification.test.cjs):** Added automated tests for image normalization, timeout alignment, QR decoupling, proposal hydration, and copy contracts.

### `F:\ekyc-service` (`main` @ `540d424`)
- **[scripts/modal_ekyc.py](file:///F:/ekyc-service/scripts/modal_ekyc.py):** Made `scaledown_window` configurable via `MODAL_SCALEDOWN_WINDOW` env var (default preserved at `120` so `min_containers=0`, weights, thresholds, and existing deployment unit assertions stay intact; deploy can raise e.g. `MODAL_SCALEDOWN_WINDOW=300` without code changes).

---

## 4. Before / After Architecture & Timeout Budget

```
BEFORE:
[Phone OCR 39s] ─► [Spring Boot @Transactional FOR UPDATE] ─► [Modal (up to 45s × 2 = 90s)]
                         │ (blocks Hikari /qr-scan lock_timeout=3s!)
[Phone Live QR 25s] ──► [upload(un-uploaded back photo 3.5MB)] ─► [/qr-scan blocked -> TIMEOUT]

AFTER:
[Phone Optimized Capture ~465KB, UPLOAD 45s]
[Phone OCR 65s] ─► Stage A (short TX, release lock) ─► Stage B (Modal ≤50s/attempt, ≤60s deadline) ─► Stage C (short TX, 409 fail-closed if stale)
[Phone Live QR 15s] ─► POST /qr-scan immediately (optional attachmentId, 0 blocking uploads, 0 DB lock wait)
```

---

## 5. Verification Results (Latest Post-Edit Runs)

| Repository | Command | Result |
|---|---|---|
| `F:\ekyc-service` | `uv run ruff check .; uv run pytest -q --tb=short` | `All checks passed!`; `483 passed in 36.55s` (`git diff --check` clean) |
| `F:\datxebackend` | `.\gradlew.bat test --rerun-tasks` (default unit suite, `TEST_DB_URL` unset) | `BUILD SUCCESSFUL`: `64` suites, `245` tests total, `56` env-gated Postgres tests skipped, `0` failures, `0` errors (`git diff --check` clean) |
| `F:\datxebackend` | `TEST_DB_URL=jdbc:postgresql://localhost:5432/datxe .\gradlew.bat test --tests "*VerificationConcurrencyPostgresTest*" --rerun-tasks` | `BUILD SUCCESSFUL`: `4` tests run, `4` passed, `0` skipped, `0` failures (`time=12.868s`) |
| `F:\datxe_rn` | `npm run check` (`check:architecture`, `typecheck`, `lint`, `test`) | All gates exited `0`; `246` tests passed, `0` failed, `0` skipped (`git diff --check` clean) |
| `F:\datxe_rn\apps\driver` | `npx expo export --platform android --output-dir .../scratch/driver-android-export` | Bundled `3224` modules cleanly (`index-3427b88f70097b58f5522b8dfb1ab292.hbc`, `9.2MB`) |

**Note on full Postgres run:** Running `.\gradlew.bat check build` with `TEST_DB_URL` pointed directly at `datxe` triggered existing pre-existing `@SpringBootTest` `BootstrapDataInitializer.kt:50` admin bootstrap env requirements (`DatxebackendApplicationTests > contextLoads()` and `ScheduledRideBookingPostgresTests` failed on `BOOTSTRAP_ADMIN_FIREBASE_UID` missing); `VerificationConcurrencyPostgresTest` itself passed `4/4`.

### Not Verified / Blocked in This Environment
- **Physical Android / iOS device capture, `expo-image-manipulator` native runtime resize, Light/Dark & `font_scale 1.3` visual check:** `NOT VERIFIED` here (no ADB/emulator hardware session connected; requires rebuilding dev-client via `npx expo run:android` because native module `expo-image-manipulator` was added to `apps/driver`).
- **End-to-end authenticated production test over Cloudflare Tunnel (`https://api.ptitgo.me`) -> Spring Boot -> Modal:** `NOT VERIFIED` (no Firebase driver test token or deploy performed).

---

## 6. Recommended Commit Order, Deploy Order & Rollback

1. **Commit plan (manual review first, in order):**
   - `F:\ekyc-service`: Commit `scripts/modal_ekyc.py`.
   - `F:\datxebackend`: Commit `application.properties`, `EkycConfig.kt`, `EkycClient.kt`, `DriverVerificationWorkflowService.kt`, `EkycClientTest.kt`, `VerificationConcurrencyPostgresTest.kt`.
   - `F:\datxe_rn`: Stage carefully (separate `apps/driver` + `tests/` + `docs/` from untracked editor skill dirs `.agent/`, `.agents/`, `.codex/`, `.cursor/`, `.github/`, `.trae/`, `screenshot/`, `skills-lock.json` unless intended).
2. **Deploy order (backwards-compatible):**
   1. Deploy `F:\ekyc-service` (`modal deploy scripts/modal_ekyc.py`, optionally `MODAL_SCALEDOWN_WINDOW=300`).
   2. Deploy `F:\datxebackend` (eliminates PostgreSQL row lock during Modal inference + widens read timeout to `50s`).
   3. Rebuild & distribute `apps/driver` native build (`npx expo run:android` / EAS) so `expo-image-manipulator` native binary is bundled; older JS/native builds gracefully degrade without crashing.
3. **Rollback:**
   - Each repository change is API-contract compatible; any layer (`ekyc-service`, `datxebackend`, `apps/driver`) can be rolled back independently to its prior tag (`540d424` / `240dca5` / `dee092d`) with zero DB schema rollback needed (no Flyway migrations added).
