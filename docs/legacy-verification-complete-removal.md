# Hoàn tất loại bỏ xác minh tài xế thủ công

Ngày kiểm tra 20/11/2026. Phạm vi gồm các repo backend, GoAdmin, mobile và eKYC. V42 và kiểm kê ảnh chỉ được thực hành trên PostgreSQL 17 cô lập với dữ liệu tổng hợp.

## 1. Kiến trúc trước và sau

Trước V42, driver có thể tải giấy tờ qua Cloudinary, quản trị viên duyệt từng giấy tờ, kỹ năng và tài khoản qua API riêng. V38 tạo projection từ tài xế APPROVED cũ. V39 tạo application và snapshot có legacyBackfill từ những projection đủ điều kiện. Các dữ liệu đó có thể xuất hiện như hồ sơ đã xác minh dù chưa có bản nộp eKYC thật.

Driver và GoAdmin nay cùng dùng eKYC Verification Workflow v2 qua Spring Boot. Hồ sơ, bản nộp, nhật ký quyết định, projection và quyền nhận chuyến xuất phát từ workflow eKYC. Spring Boot gọi dịch vụ inference cho OCR, phân loại ảnh giấy tờ và đối chiếu mặt. Tích hợp feed eKYC xác thực, vốn tùy chọn, tiếp tục được kiểm chứng nếu cấu hình. Nó không ghi đè quyết định bản địa. /v1 trong URL là phiên bản API đã phát hành.

## 2. Kiểm kê phụ thuộc

| Nhóm | Dấu vết đã đối chiếu | Xử lý |
|---|---|---|
| LEGACY_ONLY | DriverOnboardingController, AdminDriverController, DriverDocumentRepository, DTO/trạng thái duyệt, cấu hình loại giấy tờ, upload signature, notification riêng, truy vấn xóa tài khoản | Bỏ API, dữ liệu, cấu hình và logic. Sửa xóa tài khoản để tiếp tục xử lý avatar qua outbox. |
| LEGACY_ONLY | GoAdmin Documents, drawer, form và query key cũ. Mobile ApprovalStatusScreen, hook/API và validation riêng, nhãn giấy tờ và đích push cũ | Gỡ luồng. URL web cũ chuyển đến hàng chờ eKYC. |
| LEGACY_ONLY | driver_documents, drivers.license_image_url, bản nộp được V39 đánh dấu legacyBackfill, thông báo DRIVER_DOCUMENT_REVIEWED | V42 xóa đúng phạm vi. |
| SHARED | drivers và customers, avatar, thông tin GPLX, hồ sơ ngân hàng, driver_vehicle_skills, capability preferences, chuyến đi, ví và giao dịch | Giữ dữ liệu. Các quyết định nhận chuyến đọc projection được xác minh. GoAdmin giữ khả năng đọc kỹ năng. |
| EKYC_V2 | Applications, captures, submissions, submit idempotency, audit, projection, identity lock/hold, QR trực tiếp, OCR, face, mã hóa ảnh, chính sách GPLX và capability | Giữ hợp đồng và lưu trữ. Chỉ phân loại nguồn projection và tách bản nộp tổng hợp. |
| EKYC_V2 | eKYC FastAPI, native inference, service auth, health/readiness, workflow tích hợp riêng và Modal/model artifacts | Audit route, consumer và CI. Repo giữ nguyên vì không có consumer của luồng giấy tờ thủ công Spring Boot. |
| UNKNOWN | Projection từ feed trước khi ghi nhận nguồn, projection bất nhất với revision đã duyệt, ảnh ngoài phạm vi nhận diện hoặc upload chưa đăng ký | Feed phải xác nhận lại dữ liệu nếu đã được cấu hình. Hồ sơ bản địa và dữ liệu eKYC nguồn tiếp tục được lưu. Ảnh chưa xác định nằm ngoài manifest xóa tự động. |

## 3. API đã gỡ và thay đổi hợp đồng

| Method và route | Điểm vào hiện hành |
|---|---|
| GET, POST /api/driver/documents | Luồng application, capture và submit eKYC |
| GET, PUT /api/driver/skills | Capability preferences cho lựa chọn nhóm xe |
| PUT /api/driver/profile | PUT /api/driver/profile/identity cho thông tin liên hệ và ngân hàng. GPLX được cập nhật qua eKYC. |
| GET /api/admin/driver-documents | GET /ekyc/driver-verification/v1/admin/review-queue |
| PUT /api/admin/driver-documents/{id}/review | POST .../admin/applications/{applicationId}/decision |
| PUT /api/admin/driver-skills/{id}/verify | Chính sách GPLX và quyết định capability trong bản duyệt |
| PUT /api/admin/drivers/{id}/verification-status | Quyết định eKYC ở revision hiện hành |
| GET /api/uploads/signature với purpose=DRIVER_DOCUMENT | Capture eKYC được lưu riêng qua backend |

GET /api/driver/verification trả verification_status và verification_workflow. GET /api/driver/profile bỏ license_image_url và license_review_status. GET /api/admin/drivers/{id} bỏ documents và trả verification gồm applicationId và status, hoặc null. Hàng chờ eKYC có totalElements, hasMore và dữ liệu tài xế. Bộ lọc PENDING_REVIEW gồm SUBMITTED và UNDER_REVIEW. Join theo application ID và submission_revision nên mỗi hồ sơ chỉ được tính một lần, kể cả khi có nhiều revision.

GoAdmin giữ một mục **Duyệt hồ sơ tài xế** tại /driver-documents/verification. URL /driver-documents chuyển đến route hiện hành. Dashboard và chi tiết tài xế mở đúng applicationId. Driver dùng /profile/verification từ Trang chủ, Hồ sơ và push kết quả eKYC.

## 4. Schema và kế hoạch V42

V41 là migration trước V42. Flyway tiếp tục dùng toàn bộ V1–V41. V42 bổ sung hai cờ nguồn cho projection, kiểm tra bản nộp và audit liên quan, bỏ baseline tổng hợp V39 và cập nhật trạng thái hiệu lực. Các bản nộp, capture, khóa danh tính và audit có nguồn gốc eKYC tiếp tục được lưu.

- Bảng xóa là driver_documents. PostgreSQL dọn sequence định danh, khóa chính, hai foreign key đến drivers/admins, check constraints về trạng thái/loại tài nguyên, idx_driver_documents_driver_status và uq_driver_documents_current_type thuộc bảng đó.
- Cột xóa ngoài bảng là drivers.license_image_url. Schema versioned không có view hoặc foreign key đến bảng/cột này. Hai lệnh DROP đều dùng RESTRICT. Schema khác môi trường sẽ báo lỗi nếu tồn tại phụ thuộc chưa kiểm kê.
- Giữ drivers.verification_status cho projection trạng thái hồ sơ và SUSPENDED. Giữ license_number, license_class, license_expiry_date, license_verified, years_of_experience, avatar và dữ liệu nghiệp vụ. Bảng kỹ năng trong schema là driver_vehicle_skills.
- Xóa notification DRIVER_DOCUMENT_REVIEWED. Các thông báo cùng loại DRIVER_VERIFICATION_UPDATED có thể là lịch sử eKYC hoặc quyết định cũ và được giữ theo hợp đồng chung.
- Với feed tùy chọn, V42 tua checkpoint về đầu nếu stream từng được áp dụng. Row cũ thiếu nguồn không cấp quyền. Replay xác thực có thể lập lại projection feed. Projection bản địa đã xác minh được ưu tiên bất kể revision từ feed.

## 5. Chuyển trạng thái tài xế

| Dữ liệu trước migration | Kết quả |
|---|---|
| eKYC đã duyệt và projection khớp bản nộp/decision | Giữ APPROVED, quyền hợp lệ, revision và lựa chọn capability. |
| Chỉ có duyệt thủ công hoặc baseline tổng hợp V39 | Gỡ baseline tổng hợp, về PENDING hoặc bản nháp chưa duyệt. Nếu đang online và chưa có chuyến, chuyển OFFLINE. |
| Có cả baseline cũ và bản nộp eKYC đang xét duyệt | Gỡ quyền theo baseline cũ. Giữ applicationId, bản nộp, captures, trạng thái xét duyệt và audit thật. |
| Chưa có eKYC | PENDING. Driver có thể bắt đầu từ màn xác minh. |
| Đang chạy chuyến | Giữ ride, driver assignment, BUSY và loại xe đang dùng. Các bước hoàn tất chuyến tiếp tục. Nếu không còn đủ quyền thì không quay lại tập khả dụng khi thả chuyến. |
| Đã được gán nhưng chưa bắt đầu | Giữ chuyến và tài xế. Bước bắt đầu vẫn yêu cầu eKYC. Xử lý hoặc chờ các chuyến này kết thúc trước khi chuyển đổi môi trường. |

Projection đã bị ghi lệch bởi endpoint cũ không có đủ bằng chứng để phục hồi grant từ thông tin GPLX thô. Giữ hồ sơ eKYC và audit, khóa quyền từ projection không xác minh được, rồi đối chiếu trong preflight nếu có trường hợp như vậy.

## 6. Số lượng và dry-run Cloudinary

Số lượng triển khai chờ kiểm kê được chủ dữ liệu phê duyệt. Không dùng số liệu test làm ước lượng. Script thống kê tài xế chỉ legacy, tài xế eKYC, nhóm giao nhau, số record/ảnh, tài xế online/BUSY và tài xế có chuyến. Hồi quy V41→V42 dùng dữ liệu tổng hợp gồm chuyến đã được gán, chuyến đang chạy và chuyến đã hoàn tất. Diễn tập inventory dùng bốn record tổng hợp, gồm một avatar đã có tham chiếu và ba ứng viên ban đầu.

Chạy scripts/legacy_verification_assets.py từ backend. Chuẩn bị psql, các biến PGHOST, PGPORT, PGDATABASE, PGUSER, xác thực libpq và quyền đọc các bảng ứng dụng cùng pg_control_system(). Thiết lập PTITGO_CLEANUP_ENV và PTITGO_CLEANUP_CLOUD khớp tham số. Tạo manifest trước V42, sau khi đã dừng phiên bản còn ghi giấy tờ thủ công. Lưu báo cáo nội bộ vì public ID có mã tài xế.

~~~text
python scripts/legacy_verification_assets.py --environment <env> --database <db> --cloud <cloud> --output <manifest.json>
~~~

Dry-run DB mặc định không liên hệ Cloudinary. Terminal chỉ in tổng số. Chi tiết asset và ID tài xế nằm trong file riêng khi dùng --output, với quyền 0600 trên Unix. Thêm --resolve-cloud và cấp PTITGO_CLEANUP_CLOUD_KEY cùng PTITGO_CLEANUP_CLOUD_SECRET để đối chiếu asset ID bất biến bằng GET. Giới hạn một batch là 1–100 asset, mặc định 25. Dùng nextAfterPublicId để tiếp tục. Giữ ảnh nếu còn tham chiếu trong avatar, xe, các bảng/JSON nghiệp vụ hoặc outbox. Ảnh capture eKYC dùng kho mã hóa riêng. Asset thô, delivery type khác, domain khác và upload chưa từng được đăng ký phải kiểm kê riêng.

Sau khi người dùng duyệt đúng manifest và checksum, script hỗ trợ --execute --manifest <file> --approved-sha256 <sha256>. Môi trường, cloud, database/cluster, giới hạn và pha hậu V42 đều được đối chiếu. Script kiểm tra lại tham chiếu, đối chiếu lại asset ID và fingerprint URL giao nhận, xóa từng ảnh theo asset ID và báo cáo kết quả. Một asset đã mất được báo already_missing khi chạy lại. Giữ cửa sổ bảo trì trong lúc xử lý để tránh phát sinh tham chiếu mới giữa lần kiểm tra và lệnh xóa.

Tham khảo [Cloudinary Admin API](https://cloudinary.com/documentation/admin_api) và [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference).

## 7. Hồi quy và bảo mật

Kết quả cổng kiểm tra được cập nhật ở cuối tài liệu. Bộ test PostgreSQL dùng schema/cluster dùng một lần. Test fixture Cloudinary dùng ảnh và ID giả. Các flow camera, QR/OCR, submit/resume, lỗi kỹ thuật, identity lock/hold và face được kiểm tra qua test tự động. Việc xác nhận camera và giao diện Android với phiên Firebase test cần thiết bị và cấu hình xác thực cô lập.

- Phân quyền driver/admin vẫn ở Spring Security và kiểm tra phía workflow. Quyết định khớp application, revision và quyền reviewer. Không còn API ghi approval trực tiếp.
- Approval thiếu projection có nguồn gốc hợp lệ không cho bật online, nhận/gán chuyến hoặc bắt đầu chuyến. Redis chỉ trả tài xế về tập khả dụng khi trạng thái backend cho phép.
- GoAdmin tải ảnh riêng tư bằng token và snapshot revision. Blob URL chỉ tồn tại trong màn xem và được thu hồi khi bỏ mount.
- Preflight DB và thao tác Cloudinary tách theo quyền, giữ audit, backup và danh sách duyệt ngoài Git.

## 8. Commit plan, triển khai và khôi phục

1. Khi được phép phát hành, push nhánh `integration/backend-release`, `integration/admin-release`, rồi `integration/mobile-release` lên origin của từng repo. Tích hợp qua quy trình duyệt của từng repo và ghi lại SHA đích thực tế. Workflow deploy backend dùng SHA đã qua CI trên `main`. Repo eKYC không có thay đổi trong đợt này.
2. Tạm ngừng tạo chuyến tức thời và chuyến đặt lịch, nhận offer, phân công thủ công và các tác vụ tự động điều phối. Giữ các thao tác kết thúc chuyến đang chạy trong lúc xử lý tồn đọng.
3. Chạy kiểm kê read-only trên V41. Xử lý chuyến tồn đọng theo quy trình vận hành đã duyệt, rồi chạy lại kiểm kê. Chỉ sang bước tiếp theo khi gate báo `PASS` và vận hành đã đối chiếu hàng đợi cùng các chuyến đang chạy.
4. Dừng ghi giấy tờ legacy và tạo đủ các batch Cloudinary inventory trước V42. Ghi nhận manifest và checksum từng batch.
5. Sao lưu PostgreSQL, kho capture eKYC và asset Cloudinary thuộc manifest. Xác minh phục hồi PostgreSQL và khả năng khôi phục ảnh bằng snapshot cùng khóa đúng phiên bản. Nếu dùng feed độc lập, giữ backup SQLite/stream đủ sự kiện replay.
6. Deploy Backend V42 và xác nhận health cùng phiên bản Flyway. Deploy GoAdmin từ SHA đã duyệt. Phát hành Driver mới từ build đã duyệt qua kênh phân phối production.
7. Chạy smoke test tích hợp trên Backend, GoAdmin và Driver đã phát hành. Sau khi các ca đạt, mở lại tạo và phân công chuyến, theo dõi phiên bản Driver cũ và duyệt checksum manifest cho cleanup.
8. Cleanup Cloudinary theo từng batch đã duyệt sau khi smoke đạt. Giữ khả năng khôi phục ảnh và dùng cửa sổ bảo trì hoặc khóa writer tạo tham chiếu trong lúc cleanup.

Nếu phải lùi sau V42, giữ database V42 và phục hồi backup V41 sang database riêng. Dùng phiên bản backend tương thích với V41, đối soát giao dịch phát sinh sau backup trước khi chuyển lưu lượng và phục hồi kho ảnh nếu cần theo mục 9.7.

## 9. Lệnh phát hành và rollback

Các khối dưới đây dành cho người vận hành sau khi duyệt release SHA, cửa sổ bảo trì và đích. Chạy mỗi khối trong Bash, với các biến đích lấy từ cấu hình đã duyệt. Nạp thông tin đăng nhập từ secret manager hoặc libpq service file được giới hạn quyền. Giữ manifest, archive, khóa và smoke-test token ngoài checkout.

### 9.1. Kiểm kê chuyến trước cutover trên V41

Xác nhận vận hành đã chặn `POST /api/customer/rides`, `POST /api/admin/rides/{id}/assign` và `POST /api/driver/offers/{rideId}/accept`, đồng thời tạm dừng nguồn phân công tự động, gồm scheduler chuyến đặt lịch, dispatch recovery và vòng xử lý offer. Đối chiếu cách khóa với cấu hình môi trường thực tế. Các thao tác hoàn tất chuyến hiện hữu có thể tiếp tục trong giai đoạn xử lý tồn đọng. Người vận hành xử lý phân công qua quy trình đã duyệt và giữ nguyên các chuyến đã bắt đầu.

Khối sau đọc từ PostgreSQL primary đã duyệt. Nó kiểm tra database, cluster và Flyway V41 trong cùng transaction `REPEATABLE READ READ ONLY`. Vai trò phải thấy toàn bộ hàng liên quan. Báo cáo riêng chứa ID nội bộ, loại chuyến, trạng thái và giờ đặt lịch UTC. Terminal chỉ hiển thị tổng số, kết quả và đường dẫn báo cáo.

`BLOCKED` trả exit 2 nếu còn phân công trước khởi hành cho tài xế chỉ có legacy, tài xế dựa vào legacy đang làm eKYC, hoặc tài xế khác chưa chứng minh được nguồn phê duyệt dùng được ngay sau V42. Projection chỉ có ở feed cần replay và xác minh riêng. Gate cũng chặn phân công có tài xế đã xóa, bị đánh dấu hoặc bị khóa. `PASS` chỉ xác nhận không còn nhóm phân công này tại thời điểm đọc, không thay thế kiểm tra điều kiện nhận chuyến theo phương tiện, hạn giấy tờ hoặc giờ đặt lịch. Kiểm tra lại sau khi xử lý tồn đọng và ngay trước khi đóng writer để backup. Kết quả của lệnh trên production hiện chưa được xác minh.

Diễn tập nguyên khối Bash trên PostgreSQL 17 cô lập, khôi phục từ dump V41 tổng hợp. Kết quả `BLOCKED` gồm chuyến đặt lịch đã gán cho tài xế chỉ legacy và chuyến tức thời đang bàn giao cho tài xế có hồ sơ eKYC chưa được duyệt. Sau khi hai phân công được xử lý trên fixture, gate trả `PASS` và vẫn liệt kê hai chuyến đã bắt đầu. Sai mã cluster trả `NOT_VERIFIED`. Đã kiểm tra vai trò chỉ đọc, checksum dữ liệu chuyến và quyền file báo cáo `0600`.

~~~bash
set -euo pipefail
umask 077
: "${PGSERVICE:?libpq service read-only của primary V41}"
: "${PGDATABASE:?database đích đã duyệt}"
: "${EXPECTED_PG_CLUSTER_ID:?system identifier đã duyệt}"
: "${RELEASE_DIR:?thư mục riêng ngoài Git}"
export PGSERVICE PGDATABASE
install -d -m 700 "$RELEASE_DIR"
PREFLIGHT_DIR=$(mktemp -d "$RELEASE_DIR/pre-cutover-v41.XXXXXXXX")
PREFLIGHT_REPORT="$PREFLIGHT_DIR/report.json"
if ! psql -X -qAt -w -v ON_ERROR_STOP=1 -v db="$PGDATABASE" \
    -v cluster_id="$EXPECTED_PG_CLUSTER_ID" > "$PREFLIGHT_REPORT" 2> "$PREFLIGHT_REPORT.stderr" <<'SQL'
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL row_security = off;
SET LOCAL TIME ZONE 'UTC';
SELECT current_database() = :'db' AND NOT pg_is_in_recovery()
    AND (SELECT system_identifier::text FROM pg_control_system()) = :'cluster_id'
    AND COALESCE((SELECT version = '41' FROM public.flyway_schema_history
                  WHERE success AND version IS NOT NULL ORDER BY installed_rank DESC LIMIT 1), false)
    AS expected_target \gset
\if :expected_target
WITH native_approved AS (
    -- Same approved-projection provenance that V42 preserves.
    SELECT p.owner_uid
    FROM public.driver_verification_projection p
    JOIN public.driver_verification_applications a
      ON a.id = p.application_id AND a.owner_uid = p.owner_uid
    JOIN public.driver_verification_submissions s
      ON s.application_id = a.id AND s.revision = a.approved_submission_revision
    WHERE p.status = 'APPROVED' AND NOT a.identity_hold AND p.revision = a.approved_revision
      AND s.snapshot_json::jsonb ->> 'legacyBackfill' IS DISTINCT FROM 'true'
      AND EXISTS (SELECT 1 FROM public.driver_verification_audit au
                  WHERE au.application_id = a.id AND au.revision = a.approved_revision
                    AND au.action = 'APPROVED' AND au.actor_role = 'admin')
), driver_evidence AS (
    SELECT d.id, d.deleted_at IS NOT NULL AS deleted,
           (d.is_flagged IS TRUE OR d.verification_status IS NOT DISTINCT FROM 'SUSPENDED'
            OR d.status IS NOT DISTINCT FROM 'BLOCKED') AS restricted,
           n.owner_uid IS NOT NULL AS native_approved,
           (p.status = 'APPROVED' AND EXISTS (SELECT 1 FROM public.verification_sync_checkpoint
                                             WHERE singleton AND stream_id IS NOT NULL)) AS feed_replay_required,
           (NULLIF(btrim(d.license_image_url), '') IS NOT NULL
            OR EXISTS (SELECT 1 FROM public.driver_documents doc WHERE doc.driver_id = d.id)
            OR EXISTS (SELECT 1 FROM public.driver_verification_submissions s WHERE s.application_id = a.id
                       AND s.snapshot_json::jsonb ->> 'legacyBackfill' = 'true')
            OR (n.owner_uid IS NULL AND (d.verification_status IS NOT DISTINCT FROM 'APPROVED'
                                       OR d.license_verified IS TRUE))) AS legacy_evidence,
           (EXISTS (SELECT 1 FROM public.driver_verification_submissions s WHERE s.application_id = a.id
                    AND s.snapshot_json::jsonb ->> 'legacyBackfill' IS DISTINCT FROM 'true')
            OR EXISTS (SELECT 1 FROM public.driver_verification_captures c WHERE c.application_id = a.id)
            OR EXISTS (SELECT 1 FROM public.driver_verification_audit au
                       WHERE au.application_id = a.id AND au.action = 'CREATE')) AS native_activity
    FROM public.drivers d
    LEFT JOIN public.driver_verification_applications a ON a.owner_uid = d.firebase_uid
    LEFT JOIN public.driver_verification_projection p ON p.owner_uid = d.firebase_uid
    LEFT JOIN native_approved n ON n.owner_uid = d.firebase_uid
), driver_classes AS (
    SELECT e.*, CASE
        WHEN native_approved THEN 'NATIVE_EKYC_APPROVED'
        WHEN feed_replay_required THEN 'FEED_REPLAY_REQUIRED'
        WHEN legacy_evidence AND NOT native_activity THEN 'LEGACY_ONLY'
        WHEN legacy_evidence THEN 'LEGACY_WITHOUT_NATIVE_APPROVAL'
        ELSE 'NO_CONFIRMED_EKYC_APPROVAL'
    END AS verification_source
    FROM driver_evidence e
), assigned_or_started AS (
    SELECT r.id AS ride_id, r.driver_id, r.type AS booking_type, r.status, r.scheduled_at,
           COALESCE(d.verification_source, 'NO_CONFIRMED_EKYC_APPROVAL') AS verification_source,
           CASE WHEN r.status IN ('IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED')
                THEN 'STARTED' ELSE 'ASSIGNED_BEFORE_START' END AS phase,
           CASE WHEN r.status IN ('IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED') THEN false
                ELSE (d.id IS NULL OR d.deleted OR d.restricted OR NOT d.native_approved) END AS blocks_cutover
    FROM public.rides r
    LEFT JOIN driver_classes d ON d.id = r.driver_id
    WHERE r.status IN ('DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'VEHICLE_HANDOVER',
                       'IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED')
       OR (r.status IN ('PENDING', 'SEARCHING') AND r.driver_id IS NOT NULL)
), ride_counts AS (
    SELECT count(*) FILTER (WHERE phase = 'ASSIGNED_BEFORE_START') AS assigned_before_start,
           count(*) FILTER (WHERE phase = 'ASSIGNED_BEFORE_START' AND booking_type = 'SCHEDULED') AS assigned_scheduled,
           count(*) FILTER (WHERE phase = 'STARTED') AS started,
           count(*) FILTER (WHERE phase = 'STARTED' AND booking_type = 'SCHEDULED') AS started_scheduled,
           count(*) FILTER (WHERE blocks_cutover) AS blocked,
           count(*) FILTER (WHERE blocks_cutover AND booking_type = 'SCHEDULED') AS blocked_scheduled
    FROM assigned_or_started
), unassigned_queue AS (
    SELECT count(*) AS pending_or_searching,
           count(*) FILTER (WHERE type = 'SCHEDULED') AS scheduled
    FROM public.rides WHERE driver_id IS NULL AND status IN ('PENDING', 'SEARCHING')
), legacy_only AS (
    SELECT id FROM driver_classes WHERE verification_source = 'LEGACY_ONLY' AND NOT deleted
)
SELECT jsonb_build_object(
    'gate', CASE WHEN ride_counts.blocked > 0 THEN 'BLOCKED' ELSE 'PASS' END,
    'summary', to_jsonb(ride_counts) || jsonb_build_object(
        'legacy_only_drivers', (SELECT count(*) FROM legacy_only),
        'unassigned_queue', to_jsonb(unassigned_queue)),
    'legacy_only_driver_ids', COALESCE((SELECT jsonb_agg(id ORDER BY id) FROM legacy_only), '[]'::jsonb),
    'rides', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY blocks_cutover DESC, scheduled_at, ride_id)
                       FROM assigned_or_started r), '[]'::jsonb)
)
FROM ride_counts CROSS JOIN unassigned_queue;
\else
SELECT jsonb_build_object('gate', 'NOT_VERIFIED');
\endif
ROLLBACK;
SQL
then
  printf 'NOT VERIFIED — không đọc được snapshot V41. Log riêng %s\n' "$PREFLIGHT_REPORT.stderr" >&2
  exit 1
fi
jq -e '{gate, summary}' "$PREFLIGHT_REPORT"
printf 'Báo cáo nội bộ %s\n' "$PREFLIGHT_REPORT"
case "$(jq -er '.gate' "$PREFLIGHT_REPORT")" in
  PASS) ;;
  BLOCKED) exit 2 ;;
  *) exit 1 ;;
esac
~~~

### 9.2. Cloudinary inventory trước V42

Dùng cùng kết nối đích trong hai pha inventory và cleanup. Script ràng buộc manifest với tên database, OID, cluster và địa chỉ/port mà PostgreSQL quan sát. Dùng kết nối chỉ đọc có thể nhìn toàn bộ bảng tham chiếu. RLS làm truy vấn thất bại nếu chính sách có thể che hàng dữ liệu.

~~~bash
set -euo pipefail
umask 077
: "${PGSERVICE:?libpq service của V41}"
: "${PGDATABASE:?database đích đã đối chiếu}"
: "${EXPECTED_PG_CLUSTER_ID:?system identifier đã duyệt}"
: "${PTITGO_CLEANUP_ENV:?môi trường đã duyệt}"
: "${PTITGO_CLEANUP_CLOUD:?Cloudinary cloud đã duyệt}"
: "${RELEASE_DIR:?thư mục bảo mật ngoài Git}"
install -d -m 700 "$RELEASE_DIR"

test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -c 'SELECT current_database()')" = "$PGDATABASE"
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -c 'SELECT system_identifier FROM pg_control_system()')" = "$EXPECTED_PG_CLUSTER_ID"
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -c 'SELECT version FROM public.flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1')" = 41

python3 scripts/legacy_verification_assets.py \
  --environment "$PTITGO_CLEANUP_ENV" --database "$PGDATABASE" --cloud "$PTITGO_CLEANUP_CLOUD"

python3 scripts/legacy_verification_assets.py \
  --environment "$PTITGO_CLEANUP_ENV" --database "$PGDATABASE" --cloud "$PTITGO_CLEANUP_CLOUD" \
  --resolve-cloud --limit 25 --output "$RELEASE_DIR/cloudinary-v41-batch-001.json"
sha256sum "$RELEASE_DIR/cloudinary-v41-batch-001.json" > "$RELEASE_DIR/cloudinary-v41-batch-001.sha256"
~~~

Nếu manifest có nextAfterPublicId, lặp lệnh resolve với --after-public-id "$CURSOR" đọc từ manifest và dùng tên file batch mới. Terminal chỉ hiển thị tổng số. File riêng chứa ID và tham chiếu để duyệt. Biến PTITGO_CLEANUP_CLOUD_KEY và PTITGO_CLEANUP_CLOUD_SECRET chỉ cấp từ secret manager cho lệnh cần gọi Cloudinary.

### 9.3. Backup và xác minh khả năng phục hồi

Giữ cấu hình và image backend đang chạy, deployment GoAdmin, bản build Driver, snapshot mã hóa của `DATXE_VERIFICATION_HOST_DIR` và khóa giải mã đúng phiên bản. Xác minh restore capture với ảnh đã lưu thử và giữ bản sao khôi phục được của các asset Cloudinary nằm trong từng manifest trước khi deploy. Đối chiếu quyền truy cập và khả năng khôi phục theo phiên bản asset, kể cả avatar tham chiếu chéo. Dùng PostgreSQL client 17. Biến VERIFY_SERVICE trỏ đến cluster diễn tập riêng có database trống và vai trò cần thiết. Bản dump custom-format có dữ liệu cá nhân, nên lưu và vận chuyển như backup production.

~~~bash
set -euo pipefail
umask 077
: "${VERIFY_SERVICE:?libpq service của cluster diễn tập}"
: "${VERIFY_DB:?tên database diễn tập mới}"
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -d "service=$VERIFY_SERVICE dbname=postgres" -c 'SELECT system_identifier FROM pg_control_system()')" != "$EXPECTED_PG_CLUSTER_ID"

pg_dump --no-password --format=custom --file="$RELEASE_DIR/pre-v42.dump"
sha256sum "$RELEASE_DIR/pre-v42.dump" > "$RELEASE_DIR/pre-v42.dump.sha256"
sha256sum --check "$RELEASE_DIR/pre-v42.dump.sha256"
pg_restore --list "$RELEASE_DIR/pre-v42.dump" > "$RELEASE_DIR/pre-v42.toc"
createdb --no-password --maintenance-db="service=$VERIFY_SERVICE dbname=postgres" "$VERIFY_DB"
pg_restore --no-password --exit-on-error --single-transaction \
  --dbname="service=$VERIFY_SERVICE dbname=$VERIFY_DB" "$RELEASE_DIR/pre-v42.dump"

test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -d "service=$VERIFY_SERVICE dbname=$VERIFY_DB" \
  -c 'SELECT version FROM public.flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1')" = 41
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -d "service=$VERIFY_SERVICE dbname=$VERIFY_DB" \
  -c "SELECT (to_regclass('public.driver_documents') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.drivers'::regclass
      AND attname = 'license_image_url' AND NOT attisdropped))")" = t
~~~

Chạy Flyway validate bằng đúng bộ migration V1–V41 trên bản phục hồi. Đối chiếu số dòng ví, chuyến, đánh giá và capture với bản nguồn đã đóng ghi. Diễn tập đọc capture thực tế trên kho sao lưu bằng khóa phù hợp theo quyền owner/reviewer trước khi chuyển lưu lượng. [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) · [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)

### 9.4. Backend V42

Workflow yêu cầu CI của sự kiện push trên đúng SHA của main và qua bước duyệt GitHub Environment. Giữ main ổn định từ lúc đối chiếu SHA đến lúc dispatch. Bản deploy phải dùng đúng Compose project và mount kho eKYC đã sao lưu.

~~~bash
set -euo pipefail
: "${BACKEND_SHA:?SHA backend đã duyệt có V42}"
BACKEND_REPO=quyennv1912ptit/datxebackend
test "$(gh api "repos/$BACKEND_REPO/git/ref/heads/main" --jq '.object.sha')" = "$BACKEND_SHA"
gh run list --repo "$BACKEND_REPO" --workflow ci.yml --branch main --commit "$BACKEND_SHA" \
  --event push --status success --json headSha,conclusion \
  --jq '.[] | select(.conclusion == "success") | .headSha' | grep -Fx "$BACKEND_SHA" >/dev/null
gh workflow run deploy.yml --repo "$BACKEND_REPO" --ref main
~~~

~~~bash
: "${BACKEND_DEPLOY_RUN_ID:?run ID vừa tạo}"
test "$(gh run view "$BACKEND_DEPLOY_RUN_ID" --repo "$BACKEND_REPO" --json headSha --jq '.headSha')" = "$BACKEND_SHA"
gh run watch "$BACKEND_DEPLOY_RUN_ID" --repo "$BACKEND_REPO" --exit-status

: "${PTITGO_BACKEND_ORIGIN:?origin HTTPS đã duyệt}"
curl --fail --silent --show-error "$PTITGO_BACKEND_ORIGIN/actuator/health" | jq -e '.status == "UP"' >/dev/null
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -c 'SELECT version FROM public.flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1')" = 42
~~~

Sau healthcheck, xác nhận API eKYC trả đúng schema, ảnh private chặn tài khoản sai quyền, tài xế eKYC hợp lệ có thể nhận chuyến và tài xế legacy bị chặn. Nếu bật feed eKYC độc lập, chờ replay bắt kịp và xác nhận nguồn trước khi mở lại phân công hoặc khởi hành. Smoke có ghi phải dùng tài khoản và dữ liệu thử được phê duyệt. [GitHub CLI workflow run](https://cli.github.com/manual/gh_workflow_run) · [GitHub CLI run watch](https://cli.github.com/manual/gh_run_watch)

### 9.5. GoAdmin, Driver và smoke test tích hợp

GoAdmin dùng đúng checkout release đã link với Vercel project production. Pull cấu hình để Vite build theo origin backend đã duyệt. Kiểm tra dashboard và hàng chờ trên deployment vừa tạo, sau đó promote chính deployment đó. Bản production trước được ghi lại để rollback.

~~~bash
set -euo pipefail
: "${ADMIN_SHA:?SHA GoAdmin đã duyệt}"
test "$(git rev-parse HEAD)" = "$ADMIN_SHA"
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
vercel pull --yes --environment=production
vercel build --prod
STAGED_ADMIN_URL=$(vercel deploy --prebuilt --prod --skip-domain)
printf '%s\n' "$STAGED_ADMIN_URL"
# Chạy sau khi smoke staging đạt.
vercel promote "$STAGED_ADMIN_URL"
~~~

Driver dùng profile production đã có ở apps/driver/eas.json. Chuẩn bị cấu hình Firebase, EAS Environment và signing credentials đúng project trước. Chạy npm tại gốc monorepo, sau đó chạy EAS trong thư mục apps/driver. Lệnh này tạo bản build, bước phân phối app được duyệt riêng.

~~~bash
set -euo pipefail
: "${DRIVER_SHA:?SHA monorepo mobile đã duyệt}"
test "$(git rev-parse HEAD)" = "$DRIVER_SHA"
npm ci --include=dev
npm run check
cd apps/driver
eas whoami
eas build --platform all --profile production --non-interactive --wait
~~~

Đưa đúng bản build đã duyệt lên kênh production đã cấu hình và ghi lại mã build cùng phiên bản đã phát hành. Sau GoAdmin và Driver, chạy smoke tích hợp với tài khoản thử được duyệt. Giữ khóa tạo và phân công chuyến cho lưu lượng công khai, chỉ cho phép đường thử đã duyệt. Xác nhận Driver đăng nhập và mở eKYC, GoAdmin đọc hàng chờ và xử lý hồ sơ, backend cho tài xế eKYC hợp lệ nhận chuyến và chặn tài xế chỉ legacy. Đối chiếu cả chuyến tức thời, chuyến đặt lịch và trạng thái tài xế sau khi hoàn tất chuyến. Chỉ mở lại nhận chuyến sau khi smoke đạt. [Vercel CLI](https://vercel.com/docs/cli) · [Vercel staged deploy](https://vercel.com/docs/cli/deploy) · [EAS CLI](https://docs.expo.dev/eas/cli/)

### 9.6. Cleanup sau smoke test

Chạy riêng sau khi đã xác nhận smoke backend, GoAdmin và Driver, chốt khả năng khôi phục ảnh và nhận phê duyệt cụ thể cho checksum từng batch. Giữ cửa sổ bảo trì hoặc cơ chế khóa writer tạo tham chiếu để tránh thay đổi giữa lần recheck và xóa. Script trả exit code 1 khi có asset đổi, còn tham chiếu hoặc lỗi provider. Đối chiếu báo cáo riêng trước khi tiếp tục batch sau.

~~~bash
set -euo pipefail
umask 077
: "${APPROVED_MANIFEST_SHA:?checksum nhận từ người duyệt}"
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -c 'SELECT version FROM public.flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1')" = 42
python3 scripts/legacy_verification_assets.py \
  --environment "$PTITGO_CLEANUP_ENV" --database "$PGDATABASE" --cloud "$PTITGO_CLEANUP_CLOUD" \
  --execute --limit 25 --manifest "$RELEASE_DIR/cloudinary-v41-batch-001.json" \
  --approved-sha256 "$APPROVED_MANIFEST_SHA" --output "$RELEASE_DIR/cloudinary-cleanup-batch-001.json"
~~~

### 9.7. Rollback sau khi V42 đã DROP

Đóng writer và giữ database V42 để bảo toàn giao dịch phát sinh. Nếu đã mở ghi sau cutover, chụp thêm archive/PITR checkpoint của V42 và đối soát các thay đổi ví, chuyến, đánh giá, hồ sơ và ảnh kể từ mốc backup trước khi chuyển traffic. Nếu chưa thể bảo đảm đối soát, giữ traffic đóng và chọn sửa tiến hoặc phương án khôi phục đã duyệt.

Phục hồi bản V41 vào database mới do backend cũ truy cập được. Với Compose hiện tại, database mới nằm trên dịch vụ postgres cùng project, còn POSTGRES_DB chỉ được override lúc thay container backend. Đối chiếu quyền đăng nhập của vai trò ứng dụng và chạy Flyway validate với bộ V1–V41. Khôi phục kho ảnh đúng snapshot và khóa. Giữ database V42 đến khi đối soát xong.

~~~bash
set -euo pipefail
: "${ROLLBACK_PG_SERVICE:?libpq service để tạo DB mới cho backend cũ}"
: "${ROLLBACK_DB:?tên DB khôi phục mới}"
test "$ROLLBACK_DB" != "$PGDATABASE"
sha256sum --check "$RELEASE_DIR/pre-v42.dump.sha256"
createdb --no-password --maintenance-db="service=$ROLLBACK_PG_SERVICE dbname=postgres" "$ROLLBACK_DB"
pg_restore --no-password --exit-on-error --single-transaction \
  --dbname="service=$ROLLBACK_PG_SERVICE dbname=$ROLLBACK_DB" "$RELEASE_DIR/pre-v42.dump"
test "$(psql -X -qAt -w -v ON_ERROR_STOP=1 -d "service=$ROLLBACK_PG_SERVICE dbname=$ROLLBACK_DB" \
  -c 'SELECT version FROM public.flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1')" = 41
~~~

Từ checkout đúng release Compose cũ sau khi đã kiểm tra restore, cấp lại DATXE_FIREBASE_FILE, DATXE_DEPLOY_UID, DATXE_DEPLOY_GID, cấu hình kho ảnh mã hóa, khóa và token tunnel qua secret manager. Xác minh alias postgres và database vừa phục hồi trước khi chạy khối tiếp theo.

~~~bash
set -euo pipefail
: "${COMPOSE_PROJECT:?project đang chạy}"
: "${ROLLBACK_ENV:?env file release cũ đã duyệt}"
: "${OLD_BACKEND_IMAGE:?tag rollback hoặc digest backend cũ}"
export DATXE_DEPLOY_ENV_FILE="$ROLLBACK_ENV"
export DATXE_BACKEND_IMAGE="$OLD_BACKEND_IMAGE"
export POSTGRES_DB="$ROLLBACK_DB"
docker compose --project-name "$COMPOSE_PROJECT" --env-file "$ROLLBACK_ENV" \
  -f docker-compose.yml -f docker-compose.production.yml config --quiet
docker compose --project-name "$COMPOSE_PROJECT" --env-file "$ROLLBACK_ENV" \
  -f docker-compose.yml -f docker-compose.production.yml \
  up -d --no-deps --no-build --wait --wait-timeout 180 backend
curl --fail --silent --show-error "$PTITGO_BACKEND_ORIGIN/actuator/health" | jq -e '.status == "UP"' >/dev/null

# Chạy ở project GoAdmin sau khi endpoint cũ qua smoke.
vercel rollback "$PREVIOUS_ADMIN_URL"
vercel rollback status
~~~

Sau khi backend và GoAdmin khớp phiên bản, dùng bản Driver đã duyệt tương thích với schema phục hồi. Nếu cleanup đã chạy, phục hồi đúng asset từ backup đã xác minh trước khi mở lại luồng cần chúng. [Vercel rollback](https://vercel.com/docs/cli/rollback)

## 10. Đối chiếu test đã bỏ

| Repo | Số lượng | Kết quả đối chiếu |
|---|---|---|
| Mobile | 247 → 244 | Bỏ đúng ba test ở driver-backend.test.cjs. Chúng kiểm tra validation ngày hết hạn/số giấy tờ của form cũ, sửa metadata mà giữ ảnh Cloudinary cũ và upload DRIVER_DOCUMENT rồi POST /driver/documents. Các ca chữ số 0 đầu, OCR/QR và sửa trường eKYC, gửi lại hồ sơ, giữ phê duyệt đang hiệu lực và kiểm tra ảnh bằng revision vẫn có. Test upload file thật chuyển mục đích sang SUPPORT. Test push kiểm tra DRIVER_VERIFICATION_UPDATED dẫn tới /profile/verification. |
| GoAdmin | 107 → 88 trước hai test bổ sung | Bỏ 18 ca của documents.test.tsx chỉ chạy drawer/manual API. Bỏ ba ca workflow manual và thêm hai ca thay thế, nên tổng giảm 19. Test DTO trong api.test.ts vẫn tồn tại và đi qua eKYC decision. Hai test sau đó xác nhận thu hồi và tải ảnh private. Gate bổ sung ca eKYC chống gửi lặp và đóng drawer khi đang lưu, đưa full suite lên 91. |

Trong 18 ca GoAdmin, nhóm phân trang/tìm/lọc và gom giấy tờ nhiều trang kiểm tra cách frontend dựng hồ sơ thủ công. Hàng chờ hiện lấy tổng và một snapshot hiện hành từ backend, có test đếm qua nhiều revision, dashboard deep link, trang chi tiết và trạng thái trống. Các ca duyệt giấy tờ, duyệt tài khoản, báo thiếu giấy tờ, chuyển giấy tờ tiếp theo và xác minh kỹ năng chỉ gọi endpoint đã bỏ. Hành động ép offline vẫn có test xác nhận, còn lý do từ chối, quyền truy cập, chọn capability và quyết định đúng revision được kiểm tra trên eKYC.

UnsavedReviewGuard chỉ được import bởi DriverDocumentsDrawer cũ ở HEAD trước cleanup. Ca Back giữ draft thuộc drawer đó. Không có ca chưa lưu tương đương cho eKYC tại baseline, nên báo cáo này không xác nhận eKYC có cơ chế giữ draft khi rời trang. Ca eKYC mới kiểm tra gửi đúng một lần, khóa nút đóng và giữ drawer khi nhấn Escape trong lúc chờ lưu.

## 11. Git release gate và phạm vi stage

Đã fetch origin, kiểm tra status và diff whitespace. Bảng ghi số commit ahead/behind trước khi tạo commit release. Khi đó, backend và GoAdmin có cùng cây mã nguồn đã commit với origin/main. Cây origin/main của mobile trùng merge-base, nên phần chênh lệch về nội dung đến từ phía mobile hiện tại. Nhánh mobile đã có một commit `5341b2f` chưa push trước đợt chốt này. Cần xác nhận đúng SHA sau khi tích hợp qua quy trình phát hành.

| Repo và branch | So với upstream | So với origin/main |
|---|---:|---:|
| datxebackend integration/backend-release | 0 / 0 | 0 / 8 |
| goAdmin integration/admin-release | 0 / 0 | 0 / 1 |
| datxe_rn integration/mobile-release | 1 / 0 | 2 / 3 |
| ekyc-service main | 0 / 0 | 0 / 0 |

V42 đang là một migration local duy nhất. Backend HEAD và origin/main có cùng bộ migration tới V41. Không có migration cùng version trên các ref origin đã fetch tại thời điểm gate. Đối chiếu lại trước khi chọn release SHA.

Gitleaks chạy trên snapshot của file dự kiến stage còn tồn tại và nội dung commit mobile đang ahead. Quét tĩnh bổ sung kiểm tra số điện thoại, chuỗi 12 chữ số, email, JWT và URL giao nhận Cloudinary. Các dòng nhận diện nằm ở fixture test hoặc placeholder giao diện. Phạm vi không gồm file secret bị ignore, dữ liệu thực tế, thư mục ảnh chụp cục bộ hoặc lịch sử Git ngoài thay đổi dự kiến.

Danh sách dưới đây dùng path tương đối trong từng repo. Bao gồm cả file đã xóa. Index ở cả bốn repo trống tại thời điểm gate. Bỏ qua bộ kỹ năng, cấu hình công cụ, ảnh chụp và skills-lock.json đang untracked ngoài phạm vi release. Commit mobile đang ahead được review như một phần của branch và không cần stage lại.

### datxebackend

~~~text
README.md
scripts/legacy_verification_assets.py
src/main/kotlin/com/nhom15/datxebackend/admin/controller/AdminDriverController.kt
src/main/kotlin/com/nhom15/datxebackend/admin/repository/AdminDriverQueryRepository.kt
src/main/kotlin/com/nhom15/datxebackend/admin/service/AdminDriverService.kt
src/main/kotlin/com/nhom15/datxebackend/admin/service/AdminRideService.kt
src/main/kotlin/com/nhom15/datxebackend/auth/service/AccountDeletionService.kt
src/main/kotlin/com/nhom15/datxebackend/common/api/ErrorCode.kt
src/main/kotlin/com/nhom15/datxebackend/common/websocket/PayloadType.kt
src/main/kotlin/com/nhom15/datxebackend/driver/controller/DriverOnboardingController.kt
src/main/kotlin/com/nhom15/datxebackend/driver/controller/DriverProfileController.kt
src/main/kotlin/com/nhom15/datxebackend/driver/dto/DriverOnboardingDtos.kt
src/main/kotlin/com/nhom15/datxebackend/driver/dto/DriverProfileDtos.kt
src/main/kotlin/com/nhom15/datxebackend/driver/entity/Driver.kt
src/main/kotlin/com/nhom15/datxebackend/driver/repository/DriverDocumentRepository.kt
src/main/kotlin/com/nhom15/datxebackend/driver/repository/DriverSkillRepository.kt
src/main/kotlin/com/nhom15/datxebackend/driver/service/DriverOnboardingService.kt
src/main/kotlin/com/nhom15/datxebackend/driver/service/DriverProfileService.kt
src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationEligibility.kt
src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWarnings.kt
src/main/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationWorkflowService.kt
src/main/kotlin/com/nhom15/datxebackend/driver/verification/VerificationProjectionRepository.kt
src/main/kotlin/com/nhom15/datxebackend/matching/service/DispatchScripts.kt
src/main/kotlin/com/nhom15/datxebackend/matching/service/DriverReleaseService.kt
src/main/kotlin/com/nhom15/datxebackend/matching/service/DriverSelectionService.kt
src/main/kotlin/com/nhom15/datxebackend/notification/channel/FcmMessageFactory.kt
src/main/kotlin/com/nhom15/datxebackend/notification/dto/DriverAccountNotificationPayload.kt
src/main/kotlin/com/nhom15/datxebackend/ride/service/RideDispatchRecoveryTask.kt
src/main/kotlin/com/nhom15/datxebackend/ride/service/state/RideStateMachine.kt
src/main/kotlin/com/nhom15/datxebackend/tracking/service/DriverPresenceService.kt
src/main/kotlin/com/nhom15/datxebackend/uploads/CloudinaryAssetService.kt
src/main/kotlin/com/nhom15/datxebackend/uploads/UploadSignatureService.kt
src/main/resources/application.properties
src/main/resources/db/migration/V42__remove_legacy_driver_verification.sql
src/test/kotlin/com/nhom15/datxebackend/DatxebackendApplicationTests.kt
src/test/kotlin/com/nhom15/datxebackend/driver/verification/DriverRideEligibilityTest.kt
src/test/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationEligibilityTest.kt
src/test/kotlin/com/nhom15/datxebackend/driver/verification/DriverVerificationIdentityLockTest.kt
src/test/kotlin/com/nhom15/datxebackend/driver/verification/LegacyVerificationRemovalPostgresTest.kt
src/test/kotlin/com/nhom15/datxebackend/integration/IntegrationReleaseRegressionPostgresTests.kt
src/test/kotlin/com/nhom15/datxebackend/matching/DriverSelectionTests.kt
src/test/kotlin/com/nhom15/datxebackend/matching/SequentialDispatchTests.kt
src/test/kotlin/com/nhom15/datxebackend/payment/DriverCreditAccessTests.kt
src/test/kotlin/com/nhom15/datxebackend/tracking/DriverOnlineVehicleTypeTests.kt
src/test/python/test_dispatch_presence.py
~~~

### goAdmin

~~~text
.env.example
README.md
src/App.tsx
src/components/UnsavedReviewGuard.tsx
src/components/common.tsx
src/layout.css
src/lib/api.ts
src/pages/Dashboard.tsx
src/pages/DriverDocumentsDrawer.tsx
src/pages/DriverReviewForm.tsx
src/pages/Drivers.tsx
src/pages/VerificationReview.tsx
src/pages/documentApplications.ts
src/pages/verificationReviewModel.ts
src/test/admin-integration.test.tsx
src/test/api.test.ts
src/test/documents.test.tsx
src/test/fixtures.ts
src/test/ui-ux-regressions.test.tsx
src/test/verification-review.test.tsx
src/test/workflows.test.tsx
src/theme/alignment.css
src/types.ts
~~~

### datxe_rn

~~~text
apps/driver/.env.example
apps/driver/screenshot/README.md
apps/driver/src/app/(auth)/approval-status.tsx
apps/driver/src/config/env.ts
apps/driver/src/features/auth/api.ts
apps/driver/src/features/auth/hooks/useApprovalStatus.ts
apps/driver/src/features/auth/onboardingValidation.ts
apps/driver/src/features/auth/screens/ApprovalStatusScreen.tsx
apps/driver/src/features/offers/hooks/useHome.ts
apps/driver/src/features/offers/screens/HomeScreen.tsx
apps/driver/src/features/profile/screens/ProfileScreen.tsx
apps/driver/src/features/verification/api.ts
apps/driver/src/lib/displayLabels.ts
apps/driver/src/lib/driverApi.ts
docs/backend-screen-audit.md
docs/legacy-verification-complete-removal.md
docs/system-architecture.md
packages/shared/src/api/vehicleCatalog.ts
packages/shared/src/notifications/contracts.ts
packages/shared/src/notifications/display.ts
packages/shared/src/types/driver.ts
tests/driver-audit-fixes.test.cjs
tests/driver-backend.test.cjs
tests/driver-labels.test.cjs
tests/driver-verification.test.cjs
tests/image-upload.test.cjs
tests/notification-text.test.cjs
tests/push.test.cjs
~~~

### ekyc-service

Không có file cần stage.

## 12. Kết quả FINAL RELEASE GATE

**PASS cho release candidate trên workspace, 0 FAIL cuối.** Hạng mục SKIPPED và NOT VERIFIED dưới đây tách biệt với kết quả kiểm thử cô lập.

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Backend full Gradle check build | PASS | PostgreSQL 17.11 cô lập. 250 ca được phát hiện, 247 đạt, 0 lỗi và 3 smoke live được bỏ qua theo điều kiện sẵn có. |
| Fresh database, Flyway và Hibernate | PASS | Schema history có đủ 42 version thành công, từ V1 đến V42. Flyway validate trực tiếp đạt. Spring Boot chạy Hibernate ddl-auto=validate và kiểm tra route đã gỡ trên schema mới. |
| Upgrade từ V41 | PASS | Flyway áp dụng đúng một migration rồi validate. Bảng driver_documents và cột drivers.license_image_url đều biến mất. Quét src/main ngoài migration cho 0 tham chiếu runtime. |
| PostgreSQL integration | PASS | Bộ test bật đủ TEST_DB_URL, VERIFICATION_E2E_PG_URL và VERIFICATION_SYNC_TEST_DB. Toàn bộ ca phụ thuộc PostgreSQL chạy, gồm wallet, voucher settlement, matching, ride history, lịch đặt, support và verification. |
| Tài xế legacy, eKYC và trạng thái chờ | PASS | Legacy không được online hoặc nhận chuyến, kể cả khi giả lập trạng thái ONLINE cũ. eKYC đã duyệt có hoặc không có giấy tờ legacy giữ grant hợp lệ. Biến thể hỗn hợp đang xét và bản nộp đang chờ vẫn còn trong hàng chờ. |
| Chuyến đã gán và chuyến đang chạy | PASS | Chuyến đã gán giữ driver và trạng thái, còn START_TRIP của tài xế chỉ legacy bị từ chối. Chuyến đã chạy hoàn tất chuỗi tới điểm trả, biên bản trả xe và COMPLETE qua RideStateMachine với dữ liệu test, sau đó tài xế về OFFLINE và bị chặn khỏi chuyến mới. Test gọi state machine thật với lớp ghi/đọc test trên PostgreSQL. |
| Dữ liệu ví, lịch sử và đánh giá | PASS | So sánh số dư, dòng giao dịch ví, bản ghi chuyến hoàn tất và điểm đánh giá qua V41→V42. |
| Cloudinary cleanup safety | PASS | Dry-run mặc định chỉ đọc DB. Manifest ở V41 dùng được sau V42 trên cùng DB. Kiểm tra lại public ID và asset ID, giữ avatar và capture eKYC, chặn tham chiếu phát sinh và asset đổi fingerprint. Cloudinary giả lập xác nhận lần hai báo already_missing. Checksum sai và đích sai đều bị chặn. Terminal chỉ có tổng số. Kiểm tra riêng request lookup/destroy, asset ID và chữ ký với transport giả lập, không mở kết nối Cloudinary. |
| Backup/restore V41 | PASS | Tạo pg_dump custom-format, kiểm tra SHA-256 và TOC, restore sang PostgreSQL test cluster có system identifier khác, validate Flyway V41 và kiểm tra còn 4 giấy tờ, 1 giá trị cột legacy và 1 metadata capture tổng hợp. |
| Mobile và audit test | PASS | npm run check đạt đủ các cổng, 244 test qua. Chỉ ba test form/API thủ công bị bỏ. |
| GoAdmin và audit test | PASS | Lint, typecheck, build và full Vitest đạt. 91 ca qua, gồm thu hồi, ảnh private và chống gửi lặp hoặc đóng drawer khi đang lưu. |
| Git, migration version và scan | PASS | Fetch cả bốn repo, index trống, không trùng V42, diff whitespace đạt. Snapshot release được quét bằng Gitleaks và đối chiếu mẫu PII. |
| Smoke test trực tiếp qua nhà cung cấp | SKIPPED | Một smoke Modal và hai smoke Goong nằm sau điều kiện live có sẵn. Không bỏ qua test PostgreSQL. |
| Thao tác production | SKIPPED | Không dispatch deploy, build EAS, áp dụng migration trên DB đang dùng hay xóa ảnh thật trong gate. |
| Điều kiện production và release SHA | NOT VERIFIED | Cần đối chiếu database/manifest thật, xử lý các chuyến legacy chưa START_TRIP, xác minh backup kho ảnh và khóa thật, chạy smoke bằng credential môi trường và xác nhận SHA cuối. Máy gate không xác minh phiên Firebase/thiết bị native hoặc quyền GitHub/Vercel/EAS. |

Lượt thử ban đầu của fixture mở rộng phát hiện dữ liệu test dùng chung một khách cho hai chuyến đang hoạt động, vi phạm chỉ mục unique. Fixture được tách sang hai khách và hai xe, rồi full gate chạy lại trên database trống và đạt. Không sửa điều kiện nghiệp vụ, bỏ ca hay hạ assertion để qua gate.
