# eKYC v2 Final Pre-Commit Patch & Release Gate Report — Timeout, CCCD Back Validation & Glossy QR Hardening

- **Date:** 2026-11-19
- **Repositories Audited:** `F:\ekyc-service` (`main`), `F:\datxebackend` (`integration/backend-release`), `F:\datxe_rn` (`apps/driver`, `integration/mobile-release`)
- **Read-Only Reference:** `F:\goAdmin` (`integration/admin-release` — untouched, `git status --short` clean)
- **Git/Deploy Action:** **NONE** (no `git commit`, `push`, `merge`, or production deploy performed)

> **FINAL GATE VERDICT: CODE-READY / CONDITIONAL HOLD — NOT `READY FOR PRODUCTION`**
>
> After the final pre-commit patch restoring mandatory `POST /extract/cccd_back` (`DOCUMENT_SLOT_MISMATCH` intact, backend-owned `?ocr_mode=classify_only`, `400 EXTRACTION_REQUIRED` guard, cross-slot QR consistency, and bounded multi-QR scope), all automated suites passed against isolated PostgreSQL `17.11`, Python `pytest`/`ruff`, Node tests, synthetic QR benchmark (`33/35` = `94.3%`, `0/5` false accept), and Android JS bundling (`3224 modules`, `9.2MB`).
>
> **Release Hold Reason:** Native hardware camera zoom (`CameraView zoom`), Light/Dark visual screenshots, and system `font_scale 1.3` on physical Android/iOS hardware, plus GitHub `secrets.ENV_FILE` inspection, post-patch signed APK build, and live Modal/Cloudflare end-to-end telemetry (`EkycModalSmokeTest` / `DATXE_EKYC_SMOKE`), remain **`NOT VERIFIED`** in this local environment.

---

## 1. Final Pre-Commit Patch Summary & Business Correctness

### 1.1 Restoring Mandatory `cccd_back` Extraction & Preserving `DOCUMENT_SLOT_MISMATCH`
- **Problem Addressed:** Skipping `POST /extract/cccd_back` on the mobile client after a valid front QR prevented server-side `DOCUMENT_SLOT_MISMATCH` validation on `cccd_back` and weakened backend enforcement.
- **Driver App (`F:\datxe_rn` — [VerificationScreen.tsx](file:///F:/datxe_rn/apps/driver/src/features/verification/VerificationScreen.tsx), [reliabilityHelpers.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/reliabilityHelpers.ts), [transport.ts](file:///F:/datxe_rn/apps/driver/src/features/verification/transport.ts)):**
  - Removed `shouldSkipCccdBackExtraction`: the driver app **always** uploads `cccd_back` and **always** calls `POST /api/driver/verification/v1/applications/{id}/extract/cccd_back` (no client bypass).
  - Added user-facing `EXTRACTION_REQUIRED` handling in `transport.ts` and reset pending auto-submit state on `EXTRACTION_REQUIRED` in `VerificationScreen.tsx`.
- **Backend Authoritative Policy (`F:\datxebackend` — [EkycClient.kt](file:///F:/datxebackend/src/main/kotlin/com/nhom15/datxebackend/ekyc/EkycClient.kt), [DriverVerificationWorkflowService.kt](file:///F:/datxebackend/src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWorkflowService.kt), [DriverVerificationWarnings.kt](file:///F:/datxebackend/src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWarnings.kt)):**
  - Compatible API contract (no new HTTP endpoint): `EkycClient.extract(..., ocrMode: EkycOcrMode)` sends `?ocr_mode=classify_only` on the existing `/ekyc/documents/{slot}/extract` endpoint for `CLASSIFY_ONLY`, and isolates cache entries via `${slot.wireName}:${ocrMode.wireName}:$sha256`.
  - **Server-Owned `canUseClassifyOnlyCccdBack()` Gate:** Backend Stage A in `extractSlot()` permits `EkycOcrMode.CLASSIFY_ONLY` on `cccd_back` **only** when ALL hold:
    - `"cccd_back"` is **not** targeted in `requestedChanges.captures` (e.g., Admin `NEEDS_MORE_INFO` re-capture of `cccd_back` always forces `FULL`).
    - `cccd_front` active capture already has `ocrStatus == "OCR_READ"`, zero `DOCUMENT_SLOT_MISMATCH` warnings, zero top-level `conflictFields`, and zero `candidates[].conflict == true`.
    - `cccd_front` `qr.status == "DECODED_VALID"`, `qr.crossValidationStatus == "MATCHED"`, zero `qr.conflictFields`, and non-empty `id_number`, `full_name`, `dob`, `issue_date`.
    - `row.lockedCccdId == null || qrId == row.lockedCccdId`.
  - **Mandatory Extraction Enforcement (`submit()`):** New active captures (`firstSubmittedRevision == null`) in `REQUIRED_EXTRACTION_SLOTS` (`cccd_front`, `cccd_back`, `gplx_front`, `gplx_back`) must carry a persisted `proposalJson` before `submit()`; skipping extraction fails closed with `400 EXTRACTION_REQUIRED` (manual fallback submit remains allowed only when Stage B audited a genuine transient Modal outage `EKYC_TIMEOUT` / `EKYC_BUSY` / `EKYC_UNAVAILABLE` as `EXTRACT_FAILED` for that `captureId`).
  - **Cross-Slot & Slot-Mismatch Warnings (`DriverVerificationWarnings.kt`):** Added `CRITICAL` `DOCUMENT_SLOT_MISMATCH` (source `"OCR"`) and cross-slot QR-vs-QR consistency checks across `qrObservations` per document (`CCCD`/`GPLX`) emitting `CRITICAL` `QR_OCR_CONFLICT` (or `WARNING` `QR_OCR_NAME_DIACRITIC_MISMATCH`).
- **Python Pipeline Internal Optimization (`F:\ekyc-service` — [documents.py](file:///F:/ekyc-service/src/ekyc/api/routes/documents.py), [cccd_worker.py](file:///F:/ekyc-service/src/ekyc/services/cccd_worker.py), [document_extraction.py](file:///F:/ekyc-service/src/ekyc/services/document_extraction.py), [verification_warnings.py](file:///F:/ekyc-service/src/ekyc/services/verification_warnings.py)):**
  - `/ekyc/documents/{slot}/extract` accepts `ocr_mode: Annotated[Literal["full", "classify_only"], Query()] = "full"`.
  - `DocumentExtractor._ocr(..., classify_only=...)` **never skips `DocClassifier` validation**:
    - On `cccd_back` with `classify_only=True`: resizes warped/fallback card to `min(self.settings.ocr_max_side_px, 960)` px (`~2.2–2.9s` vs `~5.5–6.0s` per view at `1600px` measured on local CPU benchmark prior to patch) and stops immediately on view #1 with `ocr_status = "SKIPPED"` if `DocType.CCCD` + `Side.BACK` matches.
    - Wrong doc/side (e.g., `GPLX_FRONT` or re-uploaded `CCCD_FRONT` with valid QR) across all views sets `ocr_status = "OCR_NO_FIELDS"` + `"DOCUMENT_SLOT_MISMATCH"` (surfaced as `CRITICAL` warning in `verification_warnings.py` and backend `DriverVerificationWarnings.kt`).
    - Blank/unreadable frame yields `OCR_NO_TEXT`; ambiguous readable frame yields `SKIPPED` + `ORIENTATION_UNCERTAIN`.
    - `cccd_back` with `ocr_mode="full"` early-stops on view #1 when `CCCD/BACK` parses all `FIELD_MAP["cccd_back"]` fields (`issue_date`).

### 1.2 Multi-QR Distinct-Identity Conflict & Scope Accuracy ([qr.py](file:///F:/ekyc-service/src/ekyc/pipeline/qr.py))
- `_decode_frame()` runs `detectAndDecodeMulti(frame)`, zoom-crops any undecoded localized boxes when `>= 2` boxes are found, collects `DECODED_VALID` candidates across multi/single detectors, and merges via `_merge_valid_qr_candidates()`. Discrepancies on `id_number`, `full_name`, `dob`, `vehicle_class`, `gender`, or `issue_date` return terminal `status="CONFLICT"`, `legacy_status="QR_DECODE_FAILED"`, `fields={}`, and warning `"MULTIPLE_DISTINCT_QR_IDENTITIES"` (setting `boundToCapture=false` and `CRITICAL` `QR_OCR_CONFLICT` in backend).
- **Accurate Claim Scope (`_merge_valid_qr_candidates` docstring):** Multi-QR conflict detection applies to QR regions localized and decoded by OpenCV within the active frame/view and shared `QrDecodeBudget` — it is **not** guaranteed to detect every QR in arbitrary multi-QR layouts if OpenCV fails to localize a region or the decoding budget is exhausted.

---

## 2. Timeout Chain & PostgreSQL Lock Hardening

| Layer | Config / Budget | Value | Guard / Enforcement |
|---|---|---|---|
| Modal (`ekyc-service`) | `CCCD_TIMEOUT_S` / `startup_timeout` / `timeout` | `34s` / `120s` / `120s` | `min_containers=0`, `max_containers=1`, `scaledown_window=300s` (`60..900s` via `MODAL_SCALEDOWN_WINDOW`) |
| Modal QR Decoder (`qr.py`) | `QrDecodeBudget` (`MAX_QR_DECODE_ATTEMPTS` / `MAX_QR_TIME_BUDGET_S`) | `48` attempts / `2.0s` | Single shared `QrDecodeBudget` created in `DocumentExtractor.extract()` across initial raw pass, GPLX YOLO warp pass, raw 4-quadrant fallback, and OCR phase-2 QR pass; never resets between passes; curved decode disabled when `remaining_s() < 0.35`. |
| Backend (`EkycConfig.kt` / `EkycClient.kt`) | `connect` / `read` / `totalDeadline` / `attemptTimeout` | `5s` / `65s` / `75s` / `70s` | `effectiveTotalDeadlineMs = totalDeadlineMs.coerceIn(10_000L, 90_000L)`, `effectiveReadTimeoutMs = minOf(readTimeoutMs.coerceIn(5_000L, 90_000L), effectiveTotalDeadlineMs)`, `attemptTimeoutMs = minOf(effectiveTotalDeadlineMs, effectiveReadTimeoutMs + effectiveConnectTimeoutMs)`. `executeWithRetry()` skips retry if `elapsedMs + backoffMs + attemptTimeoutMs > totalDeadlineMs`. |
| Backend DB Lock | 3-stage `extractSlot` + `connection-init-sql` | `lock_timeout = 3s` | Stage A validates, resolves `EkycOcrMode`, and releases TX; Stage B executes Modal HTTP call outside TX (`0` row locks held); Stage C re-checks `captureId`/revision atomically (`409 REVISION_CONFLICT` on concurrent change) and records `EXTRACT_FAILED` on transient Modal outage. |
| Driver (`reliabilityHelpers.ts`) | `UPLOAD` / `EXTRACT` / `QR_SCAN` timeouts | `45s` / `80s` / `15s` | Bounded below Cloudflare's `100s` proxy `524` timeout. |

- **Non-Preemptive OpenCV Behavior:** Individual `cv2.QRCodeDetector` C++ calls are synchronous; `QrDecodeBudget` halts subsequent attempts immediately once exhausted.

---

## 3. Regression Matrix & Full Post-Patch Verification Results

### 3.1 `cccd_back` & Identity Regression Coverage (Verified in `test_qr_pipeline.py` & `VerificationConcurrencyPostgresTest.kt`)
1. Valid `cccd_front` QR (`MATCHED`) + valid `cccd_back` image -> backend selects `?ocr_mode=classify_only`, `ekyc-service` runs 1 view at `min(ocr_max_side_px, 960)` returning `SKIPPED`, dossier reaches `SUBMITTED` without `DOCUMENT_SLOT_MISMATCH` or `OCR_INCOMPLETE`.
2. Valid `cccd_front` QR + wrong document type (`GPLX_FRONT`) in `cccd_back` -> `CRITICAL` `DOCUMENT_SLOT_MISMATCH`.
3. Valid `cccd_front` QR + `cccd_front` image uploaded into `cccd_back` -> `CRITICAL` `DOCUMENT_SLOT_MISMATCH`.
4. Valid `cccd_front` QR + `cccd_back` QR belonging to another identity -> `CRITICAL` `QR_OCR_CONFLICT`.
5. Concurrent `cccd_back` capture replacement mid-extraction -> replacement succeeds immediately; stale extraction fails with `409 REVISION_CONFLICT`.
6. Incomplete dossier (missing required capture `cccd_back`) -> `DOCUMENT_REQUIRED` warning + `submit()` fails `400 FIELD_MISSING`.
7. Client skips `POST /extract/cccd_back` on new capture -> `submit()` fails `400 EXTRACTION_REQUIRED` (whereas genuine Modal `503` outage records `EXTRACT_FAILED` and permits manual fallback `submit()`).
8. Admin `NEEDS_MORE_INFO` targeting `cccd_back` -> backend rejects `classify_only`, sends `ocr_mode=full`, and requires re-extraction before resubmitting.

### 3.2 Post-Final-Edit Suite Counts

| Scope | Check / Command | Observed Result |
|---|---|---|
| `F:\ekyc-service` | `uv run ruff check .` | **PASS** (`All checks passed!`) |
| `F:\ekyc-service` | `uv run pytest -q --tb=short` | **PASS** (`485 passed in 39.92s`, `0` failed, `0` skipped) |
| `F:\ekyc-service` | `node --test frontend/driver-capture/*.test.mjs` | **PASS** (`17 passed`, `0` failed, `0` skipped in `138.49ms`) |
| `F:\ekyc-service` | Phase 7 Synthetic QR Benchmark (`40` fixtures: `35` pos + `5` neg incl. `multi_qr_conflict`) | **PASS** — Baseline: `30/35 (85.7%)`, `false_accept=1/5`, `p50=151.9ms`, `p95=1874.2ms`, `max=1889.9ms` -> **Hardened:** **`33/35 (94.3%)`**, **`false_accept=0/5`**, `p50=170.1ms`, `p95=2019.8ms`, `max=2056.4ms` |
| `F:\datxebackend` | Full Postgres `.\gradlew.bat check build --rerun-tasks --no-daemon --console=plain` (isolated `datxe_patch_test`, dropped afterwards) | **PASS** (`BUILD SUCCESSFUL in 3m 38s`: `64` JUnit suites, `248` total, **`245` passed**, `0` failed, `0` errors, **`3` skipped** live-API tests below) |
| `F:\datxe_rn` | `npm.cmd run check` (`check:architecture`, `typecheck`, `expo lint`, `npm test`) | **PASS** (`247 passed`, `0` failed, `0` skipped in `5292.33ms`) |
| `F:\datxe_rn` (`apps/driver`) | `npx.cmd expo export --platform android` (to scratch dir) | **PASS** (`Android Bundled 54071ms`, `3224 modules`, `9.2MB` `.hbc`) |
| `F:\goAdmin` (read-only) | Git hygiene check | **CLEAN** (`0` edits, `git status --short` empty, `git diff --check` clean) |

- **All `14` PostgreSQL/integration suites passed (`0` failed, `0` skipped):** `DatxebackendApplicationTests` (`1/1`), `AdminDashboardPostgresTests` (`1/1`), `AdminFiltersPostgresTests` (`6/6`), `DriverVerificationIdentityLockTest` (`4/4`: 3 unit/MVC + 1 PG E2E), `VerificationConcurrencyPostgresTest` (`6/6` incl. 8-scenario matrix), `VerificationProjectionPostgresTest` (`1/1`), `IntegrationReleaseRegressionPostgresTests` (`1/1`), `DispatchPersistenceTests` (`7/7`), `VoucherSettlementPostgresTests` (`4/4`), `WalletPostgresTests` (`13/13`), `RideHistoryFilterPostgresTests` (`2/2`), `ScheduledRideBookingPostgresTests` (`1/1`), `SupportPersistenceTests` (`9/9`), `VoucherReleasePostgresTests` (`2/2`).
- **Exact `3` Skipped Backend Tests (gated live external APIs):**
  1. `EkycModalSmokeTest.calls the private Modal deployment with a synthetic image()`
  2. `PlaceSearchTests.live Goong returns nearby places and reverse geocoding()`
  3. `VehicleRoutingTests.live Goong returns geometry and duration for both vehicle types()`
- **Unverified / Not Re-run After Final Patch:**
  - `impeccable` CLI was not on `PATH` during this final patch check (no UI theme/layout tokens were altered in this patch).
  - Android `:app:assembleRelease` APK build was not re-run after removing `shouldSkipCccdBackExtraction` in JS (the JS/Hermes Android bundle compiled cleanly via `expo export`).
  - GitHub `secrets.ENV_FILE` values, physical hardware camera zoom, Light/Dark + `font_scale 1.3` UI checks, and live Modal telemetry remain `NOT VERIFIED`.

---

## 4. Git Hygiene & Commit Plan (Ready for Review, Not Committed)

- `git diff --check` passed cleanly across all 4 repos (`F:\ekyc-service`, `F:\datxebackend`, `F:\datxe_rn`, `F:\goAdmin`).
- Regex secrets/PII diff scan found `0` non-test hits in `F:\ekyc-service` (`0`), `F:\datxe_rn` (`0`), and only test fixture strings in `F:\datxebackend` (`3` in `EkycClientTest.kt`).
- Temporary `datxe_patch_test` DB and `sync_test` role were dropped and verified absent (`0 rows`).

### 4.1 Grouped Conventional Commits & Rollout Order
1. **`F:\ekyc-service` (`main`, deploy first so `?ocr_mode=classify_only` & `DOCUMENT_SLOT_MISMATCH` are live):**
   - Files: `.github/workflows/deploy-modal.yml`, `scripts/modal_ekyc.py`, `src/ekyc/api/routes/documents.py`, `src/ekyc/pipeline/qr.py`, `src/ekyc/services/cccd_worker.py`, `src/ekyc/services/document_extraction.py`, `src/ekyc/services/verification_warnings.py`, `tests/unit/test_modal_deploy.py`, `tests/unit/test_qr_pipeline.py`.
   - Deploy `Deploy eKYC to Modal` and verify `/ekyc/metrics` + `/extract`.
2. **`F:\datxebackend` (`integration/backend-release` -> PR to `main`, deploy second after `secrets.ENV_FILE` audit):**
   - Files: `.env.example`, `src/main/resources/application.properties`, `src/main/kotlin/com/nhom15/datxebackend/ekyc/EkycConfig.kt`, `src/main/kotlin/com/nhom15/datxebackend/ekyc/EkycClient.kt`, `src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWarnings.kt`, `src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWorkflowService.kt`, `src/test/kotlin/com/nhom15/datxebackend/ekyc/EkycClientTest.kt`, `src/test/kotlin/com/nhom15/datxebackend/driver/verification/VerificationConcurrencyPostgresTest.kt`.
   - Verify GitHub `secrets.ENV_FILE` does not override `DATXE_EKYC_READ_TIMEOUT_MS=65000` / `DATXE_EKYC_TOTAL_DEADLINE_MS=75000` with stale `45000` values.
3. **`F:\datxe_rn` (`integration/mobile-release` -> sync/PR `origin/main`, build & release third):**
   - Stage ONLY: `apps/driver/src/features/verification/QrScannerScreen.tsx`, `apps/driver/src/features/verification/VerificationScreen.tsx`, `apps/driver/src/features/verification/reliabilityHelpers.ts`, `apps/driver/src/features/verification/transport.ts`, `apps/driver/src/features/verification/workflow.ts`, `tests/driver-verification.test.cjs`, `docs/ekyc-v2-timeout-cccd-qr-hardening-report.md`.
   - Keep untracked local tooling unstaged: `.agent/`, `.agents/`, `.codex/`, `.cursor/`, `.github/agents/`, `.github/hooks/`, `.github/skills/`, `.trae/`, `screenshot/`, `skills-lock.json`.
   - Execute hardware gate on real Android + iOS devices (glossy PET GPLX + CCCD zoom, Light/Dark + `font_scale 1.3`, live `DOCUMENT_SLOT_MISMATCH` & conflict checks) before wide rollout.
