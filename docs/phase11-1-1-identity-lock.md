# Phase 11.1.1 — Khóa danh tính & Xác minh lại giấy tờ (Identity Lock & Re-verification)

Tài liệu kỹ thuật chi tiết được đồng bộ giữa backend và ứng dụng di động.

- Xem bản đầy đủ kiến trúc backend & PostgreSQL tại `F:\datxebackend\docs\phase11-1-1-identity-lock.md`.
- Trên ứng dụng tài xế (`F:\datxe_rn`):
  - `apps/driver/src/features/verification/VerificationScreen.tsx`: màn hình trạng thái **Đã xác minh (chỉ đọc)** hiển thị số CCCD ẩn (`********1234`), hạng & thời hạn GPLX, trạng thái ảnh chân dung (`Đã được admin kiểm tra`), thông báo khóa danh tính (*"Thông tin định danh đã xác minh không thể tự ý thay đổi."*), lịch sử xác minh và luồng **Cập nhật giấy tờ** (`POST /ekyc/driver-verification/v1/applications/{id}/reverify`) có khóa trường định danh + nút hủy cập nhật (`POST .../cancel-reverify`).
  - `apps/driver/src/features/verification/api.ts` & `transport.ts`: bổ sung `lockedIdentity`, `approvedRevision`, `approvedDocument`, `eligibilityStatus`, và thông báo lỗi `IDENTITY_LOCKED`, `IDENTITY_MISMATCH`, `DUPLICATE_DOCUMENT`, `VERIFICATION_ACTIVATION_BLOCKED`.
