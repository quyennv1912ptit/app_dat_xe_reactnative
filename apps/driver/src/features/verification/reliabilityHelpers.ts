import type { Application } from './api';
import type { Extraction, QrDocumentSide, QrDocumentType, SlotKey } from './workflow';

export const METADATA_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 45_000;
export const EXTRACT_TIMEOUT_MS = 65_000;
export const QR_SCAN_TIMEOUT_MS = 15_000;
export const FACE_QUALITY_TIMEOUT_MS = 45_000;
export const SUBMIT_TIMEOUT_MS = 25_000;

export const TASK_STATUS_UPLOADING = 'Đang tải ảnh…';
export const TASK_STATUS_EXTRACTING = 'Đang đọc thông tin giấy tờ. Quá trình này có thể mất một lúc.';
export const TASK_STATUS_QR_CHECKING = 'Đang kiểm tra thông tin QR…';
export const TASK_STATUS_COMPLETED = 'Đã hoàn thành.';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extracts valid server-persisted OCR/QR proposals for slots that do not have
 * an unsaved local photo overriding the server capture.
 */
export function hydratableObservationsFromApplication(
  application: Application | null | undefined,
  localPhotos: Partial<Record<SlotKey, unknown>>,
): Partial<Record<SlotKey, Extraction>> {
  const savedProposals = application?.document?.proposals;
  if (!savedProposals) return {};
  const captures = application?.document?.captures;
  const restored: Partial<Record<SlotKey, Extraction>> = {};
  (Object.keys(savedProposals) as SlotKey[]).forEach(slotKey => {
    if (localPhotos[slotKey]) return;
    const entry = savedProposals[slotKey];
    if (!entry?.result) return;
    const captureId = captures?.[slotKey]?.id;
    if (captureId && entry.captureId && entry.captureId !== captureId) return;
    restored[slotKey] = entry.result;
  });
  return restored;
}

/**
 * Resolves an already-uploaded attachmentId for live QR submission without
 * forcing blocking uploads of unrelated or un-uploaded photos.
 */
export function resolveQrAttachmentBinding(params: {
  docType: QrDocumentType;
  side: QrDocumentSide;
  application: Application;
  uploadedUris: Partial<Record<SlotKey, string>>;
  localUris: Partial<Record<SlotKey, string>>;
}): { targetSlot?: SlotKey; attachmentId?: string } {
  const { docType, side, application, uploadedUris, localUris } = params;
  const docPrefix = docType.toLowerCase();
  const candidates: SlotKey[] = side === 'FRONT'
    ? [`${docPrefix}_front` as SlotKey]
    : side === 'BACK'
      ? [`${docPrefix}_back` as SlotKey]
      : docType === 'GPLX'
        ? ['gplx_back', 'gplx_front']
        : ['cccd_front', 'cccd_back'];

  const targetSlot = side === 'UNKNOWN' ? undefined : candidates[0];
  for (const slotKey of candidates) {
    const localUri = localUris[slotKey];
    if (localUri && uploadedUris[slotKey] !== localUri) {
      continue;
    }
    const id = application.document?.captures?.[slotKey]?.id;
    if (id && UUID_REGEX.test(id)) {
      return { targetSlot: targetSlot ?? slotKey, attachmentId: id };
    }
  }
  return { targetSlot, attachmentId: undefined };
}
