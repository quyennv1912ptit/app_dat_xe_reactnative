import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import * as Picker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { DriverPage } from '@/components/DriverPage';
import {
  Button, Card, Typography as Text, spacing,
  useThemeColors, useThemedStyles, type ThemeColors,
} from '@datxe/ui';
import { useSessionStore } from '@/lib/store';
import { jsonBody, verificationClient, verificationUrl, type Application, type ProposalResponse, type QrScanResponse, type VerificationWarning } from './api';
import { VerificationError } from './transport';
import { GuidedCaptureScreen, type CapturedPhoto, type ServerInspectionResult } from './GuidedCaptureScreen';
import QrScannerScreen, { type QrScanSubmissionResult } from './QrScannerScreen';
import { cacheFileSize, removeCacheFile } from './captureFiles';
import { DOCUMENT_JPEG_QUALITY, optimizeCapturedImage } from './imageOptimization';
import {
  EXTRACT_TIMEOUT_MS,
  FACE_QUALITY_TIMEOUT_MS,
  METADATA_TIMEOUT_MS,
  QR_SCAN_TIMEOUT_MS,
  SUBMIT_TIMEOUT_MS,
  TASK_STATUS_COMPLETED,
  TASK_STATUS_EXTRACTING,
  TASK_STATUS_UPLOADING,
  UPLOAD_TIMEOUT_MS,
  hydratableObservationsFromApplication,
  resolveQrAttachmentBinding,
} from './reliabilityHelpers';
import {
  appPath, captureInstructions, editable, faceSlots, fieldAllowed,
  isIdentityLockedField, isSmall, scoped, slotAllowed,
  visibleObservationWarnings,
  type FlowStage, type PhotoAsset, type SlotMap,
} from './verificationLabels';
import { VerificationStepHeader } from './components/VerificationStepHeader';
import { VerificationFooter } from './components/VerificationFooter';
import { EditingStatusBanner, PendingReviewView, VerifiedBaselineView } from './components/VerificationStatusView';
import { VerificationPrepareStep } from './components/VerificationPrepareStep';
import { VerificationCaptureStep } from './components/VerificationCaptureStep';
import { VerificationExtractionStep } from './components/VerificationExtractionStep';
import { VerificationFieldsStep } from './components/VerificationFieldsStep';
import { VerificationSummaryStep } from './components/VerificationSummaryStep';
import {
  autofillChoices, collectChoices, compareNames, confirmedDetails, fields, qrScanDecision,
  sameExtractionGeneration, slots, warningReviewForRevision,
  type Choice, type Extraction, type FieldKey, type Fields, type QrDocumentSide, type QrDocumentType, type QrExtractionResult, type SlotKey,
} from './workflow';

type DraftFaceQuality = {
  revision: number;
  status: 'QUALITY_CHECKED' | 'NOT_EVALUATED';
  verificationWarnings: VerificationWarning[];
};

type Pending = { id: string; revision: number; key: string; faceConsentVersion?: string; warningAcknowledgementRevision?: number };

function operationKey() {
  return globalThis.crypto?.randomUUID?.() ?? (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
  );
}

/** Root Driver eKYC screen coordinating guided capture, QR extraction, review, and re-verification. */
export default function VerificationScreen() {
  const uid = useSessionStore(state => state.user?.firebaseUid);
  return uid && verificationUrl ? <Workflow key={uid} uid={uid} /> : (
    <DriverPage title="Xác minh tài xế" backFallback="/(tabs)/profile">
      <Card><Text>Chưa thể mở xác minh tài xế. Kiểm tra phiên đăng nhập hoặc cấu hình máy chủ.</Text></Card>
    </DriverPage>
  );
}

function Workflow({ uid }: { uid: string }) {
  const router = useRouter();
  const api = useMemo(() => verificationClient(uid), [uid]);
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const [app, setApp] = useState<Application | null>(null);
  const current = useRef<Application | null>(null);
  const [photos, setPhotos] = useState<SlotMap<PhotoAsset>>({});
  const livePhotos = useRef<SlotMap<PhotoAsset>>({});
  const uploaded = useRef<SlotMap<string>>({});
  const [uploadedPhotos, setUploadedPhotos] = useState<SlotMap<string>>({});
  const trackUploads = useCallback((next: SlotMap<string>) => {
    uploaded.current = next;
    setUploadedPhotos(next);
  }, []);
  const [ack, setAck] = useState<SlotMap<boolean>>({});
  const [previews, setPreviews] = useState<SlotMap<{ uri: string; id: string }>>({});
  const livePreviews = useRef<typeof previews>({});
  const [observations, setObservations] = useState<SlotMap<Extraction>>({});
  const [liveQr, setLiveQr] = useState<QrExtractionResult>();
  const liveQrRef = useRef<QrExtractionResult | undefined>(undefined);
  const setLiveQrState = useCallback((next?: QrExtractionResult) => {
    liveQrRef.current = next;
    setLiveQr(next);
  }, []);
  const [gplxLiveQr, setGplxLiveQr] = useState<QrExtractionResult>();
  const gplxLiveQrRef = useRef<QrExtractionResult | undefined>(undefined);
  const setGplxLiveQrState = useCallback((next?: QrExtractionResult) => {
    gplxLiveQrRef.current = next;
    setGplxLiveQr(next);
  }, []);
  const [extractFailed, setExtractFailed] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScannerDocType, setQrScannerDocType] = useState<QrDocumentType>('CCCD');
  const [qrReturnTarget, setQrReturnTarget] = useState<'CAPTURE_NEXT' | 'OCR' | 'CONFIRM_FIELDS'>('CONFIRM_FIELDS');
  const [backQrPromptDoc, setBackQrPromptDoc] = useState<QrDocumentType | null>(null);
  const [qrSkipped, setQrSkipped] = useState(false);
  const [gplxQrSkipped, setGplxQrSkipped] = useState(false);
  const [cccdRevalidationNeeded, setCccdRevalidationNeeded] = useState(false);
  const [gplxRevalidationNeeded, setGplxRevalidationNeeded] = useState(false);
  const [values, setValues] = useState<Fields>({});
  const [noExpiry, setNoExpiry] = useState(false);
  const [origins, setOrigins] = useState<Partial<Record<FieldKey, Choice>>>({});
  const [manualFields, setManualFields] = useState<Partial<Record<FieldKey, boolean>>>({});
  const currentValues = useRef({ values: {} as Fields, noExpiry: false, origins: {} as typeof origins });
  const touched = useRef(new Set<FieldKey>());
  const [consent, setConsent] = useState(false);
  const [faceNotice, setFaceNotice] = useState<string>();
  const [faceConsent, setFaceConsent] = useState(false);
  const [draftFace, setDraftFace] = useState<DraftFaceQuality>();
  const [confirm, setConfirmed] = useState(false);
  const [warningReview, setWarningReview] = useState<{ revision: number; acknowledged: boolean }>();
  const setConfirm = useCallback((value: boolean) => {
    setConfirmed(value);
    if (!value) setWarningReview(undefined);
  }, []);
  const [stage, setStage] = useState<FlowStage>('PREPARE');
  const [step, setStep] = useState(0);
  const [compareGroup, setCompareGroup] = useState<'CCCD' | 'GPLX' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [guidedSlot, setGuidedSlot] = useState<SlotKey | null>(null);
  const [busy, setBusy] = useState('');
  const [reading, setReading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState('');
  const [readingNote, setReadingNote] = useState('');
  const [settingsAction, setSettingsAction] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const alive = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const ocr = useRef<AbortController | null>(null);
  const qrScanRequest = useRef<AbortController | null>(null);
  const pickerActive = useRef(false);
  const generation = useRef(0);
  const pendingRef = useRef<Pending | null>(null);
  const serverExtracted = useRef<SlotMap<{ uri: string; proposal: Extraction }>>({});
  const inspectedCapture = useRef<SlotMap<{ uri: string; proposal?: Extraction }>>({});

  const slot = slots[step];
  const photo = slot && photos[slot[0]];
  const choices = collectChoices(observations, liveQr, gplxLiveQr);
  const qrDecision = qrScanDecision(observations, { documentType: 'CCCD', liveQr, extractFailed });
  const gplxQrDecision = qrScanDecision(observations, { documentType: 'GPLX', liveQr: gplxLiveQr, extractFailed });
  const targets = scoped(app);
  const targetLabels = [
    ...slots.filter(([key]) => targets?.captures.includes(key)).map(([, label]) => label),
    ...fields.filter(([key]) => targets?.fields.includes(key)).map(([, label]) => label),
  ];
  const firstEditableStep = useMemo(() => {
    if (!targets?.captures.length) return 0;
    const idx = slots.findIndex(([key]) => targets.captures.includes(key));
    return idx >= 0 ? idx : 0;
  }, [targets]);
  const needsCapture = targets ? targets.captures.length > 0 : true;
  const liveFace = faceConsent && draftFace?.revision === app?.revision ? draftFace : undefined;
  const warnings = [
    ...(app?.verificationWarnings ?? []),
    ...(liveFace?.verificationWarnings.filter(warning => warning.code === 'FACE_INSUFFICIENT_QUALITY') ?? []),
  ];
  const currentWarningReview = warningReviewForRevision(app?.revision, warningReview);
  const canEdit = editable(app) && !pending;
  const locked = Boolean(busy) || picking || Boolean(pending);

  const updateForm = useCallback((form: typeof currentValues.current) => {
    currentValues.current = form;
    setValues(form.values);
    setNoExpiry(form.noExpiry);
    setOrigins(form.origins);
  }, []);

  const accept = useCallback((next: Application): Application => {
    const previous = current.current;
    const merged = {
      ...previous, ...next,
      document: next.document ?? previous?.document,
    };
    current.current = merged;
    setApp(merged);
    return merged;
  }, []);

  const cancelReading = useCallback((abort = true) => {
    setDraftFace(undefined);
    generation.current++;
    if (abort) {
      ocr.current?.abort();
      qrScanRequest.current?.abort();
      qrScanRequest.current = null;
    }
    setObservations({});
    setLiveQrState(undefined);
    setGplxLiveQrState(undefined);
    setExtractFailed(false);
    setQrSkipped(false);
    setGplxQrSkipped(false);
    setBackQrPromptDoc(null);
    setQrScannerOpen(false);
    serverExtracted.current = {};
    inspectedCapture.current = {};
    setReadingNote('');
    const form = currentValues.current;
    const next = { ...form, origins: { ...form.origins }, values: { ...form.values } };
    for (const [key] of fields) {
      if (isIdentityLockedField(key, current.current)) continue;
      const approved = current.current?.approvedDocument?.confirmed?.[key];
      if (approved !== undefined && !fieldAllowed(current.current, key)) {
        next.values[key] = Array.isArray(approved) ? approved.join(', ') : typeof approved === 'string' ? approved : '';
        if (key === 'expiry_date') next.noExpiry = current.current?.approvedDocument?.confirmed?.no_expiry === true;
        delete next.origins[key];
        continue;
      }
      if (form.origins[key] && !touched.current.has(key)) {
        delete next.values[key];
        if (key === 'expiry_date') next.noExpiry = false;
      }
      if (form.origins[key]) delete next.origins[key];
    }
    updateForm(next);
  }, [setGplxLiveQrState, setLiveQrState, updateForm]);

  const reload = useCallback(async (signal: AbortSignal) => {
    const rows = await api.json<Application[]>('applications', { signal, timeoutMs: METADATA_TIMEOUT_MS });
    if (!rows[0]) return null;
    const detail = await api.json<Application>(appPath(rows[0].id), { signal, timeoutMs: METADATA_TIMEOUT_MS });
    if (!alive.current || signal.aborted) return null;
    const previous = current.current;
    if (previous && detail.revision !== previous.revision) {
      cancelReading(ocr.current?.signal !== signal);
      trackUploads({});
      setConfirm(false);
    }
    const restoredProposals = hydratableObservationsFromApplication(detail, livePhotos.current);
    if (Object.keys(restoredProposals).length > 0) {
      setObservations(prev => ({ ...restoredProposals, ...prev }));
    }
    if ((!previous || detail.revision !== previous.revision)
      && !livePhotos.current.cccd_front && !livePhotos.current.cccd_back) {
      const savedLiveQr = detail.document?.qrLiveScan;
      setLiveQrState(
        savedLiveQr && (savedLiveQr.status === 'DECODED_VALID' || savedLiveQr.status === 'CONFLICT')
          ? savedLiveQr
          : undefined,
      );
    }
    if ((!previous || detail.revision !== previous.revision)
      && !livePhotos.current.gplx_front && !livePhotos.current.gplx_back) {
      const savedGplxQr = detail.document?.gplxQrLiveScan;
      setGplxLiveQrState(
        savedGplxQr && (savedGplxQr.status === 'DECODED_VALID' || savedGplxQr.status === 'CONFLICT')
          ? savedGplxQr
          : undefined,
      );
    }
    const confirmed = detail.document?.confirmed;
    if (confirmed) {
      const form = currentValues.current;
      const next = { ...form, values: { ...form.values } };
      for (const [key] of fields) {
        if (touched.current.has(key) || form.origins[key]) continue;
        const value = confirmed[key];
        next.values[key] = Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';
        if (key === 'expiry_date') next.noExpiry = confirmed.no_expiry === true;
      }
      updateForm(next);
    }
    return accept(detail);
  }, [accept, api, cancelReading, setConfirm, setGplxLiveQrState, setLiveQrState, trackUploads, updateForm]);

  const run = useCallback(async (label: string, action: (signal: AbortSignal) => Promise<unknown>) => {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(label);
    setMessage('');
    try {
      await action(controller.signal);
    } catch (error) {
      if (alive.current && !controller.signal.aborted) {
        setMessage(error instanceof Error ? error.message : 'Thao tác chưa hoàn tất.');
      }
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        if (alive.current) setBusy('');
      }
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    const ownedPhotos = livePhotos;
    const ownedPreviews = livePreviews;
    void run('Đang tải hồ sơ…', reload);
    const notice = new AbortController();
    void api.json<{ faceConsentVersion?: string }>('me', { signal: notice.signal })
      .then(result => {
        if (!notice.signal.aborted && result.faceConsentVersion === 'face-comparison-v1') {
          setFaceNotice(result.faceConsentVersion);
        }
      })
      .catch(() => { /* Experimental consent stays unavailable. */ });
    let backgrounded = false;
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background') {
        backgrounded = true;
        operation.current?.abort();
        ocr.current?.abort();
        qrScanRequest.current?.abort();
        qrScanRequest.current = null;
        generation.current++;
      } else if (state === 'active' && backgrounded) {
        backgrounded = false;
        if (!pickerActive.current && !operation.current && !ocr.current && !qrScanRequest.current) {
          void run('Đang kiểm tra trạng thái…', reload);
        } else if (!pickerActive.current) {
          setMessage('Làm mới trạng thái để kiểm tra tác vụ trước khi tiếp tục.');
        }
      }
    });
    return () => {
      alive.current = false;
      operation.current?.abort();
      operation.current = null;
      ocr.current?.abort();
      qrScanRequest.current?.abort();
      qrScanRequest.current = null;
      listener.remove();
      notice.abort();
      Object.values(ownedPhotos.current).forEach(p => removeCacheFile(p.uri));
      Object.values(ownedPreviews.current).forEach(p => removeCacheFile(p.uri));
    };
  }, [api, reload, run]);

  /** Validates one photo (from guided camera or gallery) and clears stale extractions for its document. */
  function acceptAsset(key: SlotKey, asset: Picker.ImagePickerAsset) {
    if (!alive.current) { removeCacheFile(asset.uri); return; }
    const file = new File(asset.uri);
    const size = asset.fileSize ?? file.size;
    const mime = asset.mimeType || file.type;
    if (!file.exists || !size || size > 8_000_000 || !Number.isFinite(asset.width)
      || !Number.isFinite(asset.height) || Math.min(asset.width, asset.height) < 2
      || Math.max(asset.width, asset.height) > 16384 || asset.width * asset.height > 40_000_000
      || !/^image\/(jpeg|png|webp)$/.test(mime)) {
      removeCacheFile(asset.uri);
      throw new Error('Chọn hoặc chụp lại ảnh JPEG, PNG hoặc WebP hợp lệ, tối đa 8 MB và 40 MP.');
    }
    if (livePhotos.current[key]?.uri !== asset.uri) removeCacheFile(livePhotos.current[key]?.uri ?? '');
    removeCacheFile(livePreviews.current[key]?.uri ?? '');
    delete livePreviews.current[key];
    setPreviews({ ...livePreviews.current });
    trackUploads({ ...uploaded.current, [key]: undefined });
    livePhotos.current = { ...livePhotos.current, [key]: { ...asset, mimeType: mime } };
    setPhotos(livePhotos.current);
    setAck(old => ({ ...old, [key]: false }));
    setConfirm(false);
    if (key === 'cccd_front' || key === 'cccd_back') {
      setCccdRevalidationNeeded(true);
      if (current.current?.document) {
        current.current = {
          ...current.current,
          document: { ...current.current.document, qrLiveScan: null },
        };
        setApp(current.current);
      }
    } else if (key === 'gplx_front' || key === 'gplx_back') {
      setGplxRevalidationNeeded(true);
      if (current.current?.document) {
        current.current = {
          ...current.current,
          document: { ...current.current.document, gplxQrLiveScan: null },
        };
        setApp(current.current);
      }
    }
    cancelReading();
  }

  function openGuidedCapture(key: SlotKey) {
    if (pickerActive.current || locked || !canEdit || !slotAllowed(current.current, key)) return;
    setSettingsAction(false);
    setMessage('');
    setGuidedSlot(key);
  }

  function onGuidedCaptured(key: SlotKey, captured: CapturedPhoto) {
    setGuidedSlot(null);
    try {
      const inspected = inspectedCapture.current[key]?.uri === captured.uri ? inspectedCapture.current[key] : undefined;
      acceptAsset(key, {
        uri: captured.uri, width: captured.width, height: captured.height,
        fileSize: captured.fileSize ?? undefined, mimeType: captured.mimeType,
      });
      if (inspected) {
        trackUploads({ ...uploaded.current, [key]: captured.uri });
        if (inspected.proposal) {
          serverExtracted.current[key] = { uri: captured.uri, proposal: inspected.proposal };
        }
        inspectedCapture.current = { ...inspectedCapture.current, [key]: undefined };
      }
    } catch (error) {
      if (alive.current) setMessage(error instanceof Error ? error.message : 'Không dùng được ảnh này.');
    }
  }

  async function inspectCapturedWithServer(
    key: SlotKey,
    captured: CapturedPhoto,
    signal: AbortSignal,
  ): Promise<ServerInspectionResult> {
    let base = await loadOrCreate(signal);
    if (!slotAllowed(base, key)) {
      return { warnings: [], verified: false, note: 'Ảnh này không nằm trong mục cần bổ sung.' };
    }
    if (inspectedCapture.current[key]?.uri !== captured.uri) {
      const uploadedApp = await api.json<Application>(appPath(base.id) + '/captures/' + key + '?revision=' + base.revision, {
        method: 'PUT', body: new File(captured.uri), headers: { 'Content-Type': captured.mimeType }, signal, timeoutMs: UPLOAD_TIMEOUT_MS,
      });
      ensureActive(signal);
      base = accept({
        ...uploadedApp,
        document: {
          ...base.document,
          captures: {
            ...base.document?.captures,
            [key]: uploadedApp.document?.captures?.[key] ?? { id: '', mime: captured.mimeType },
          },
          proposals: uploadedApp.document?.proposals ?? (
            base.document?.proposals ? { ...base.document.proposals, [key]: undefined } : undefined
          ),
          qrLiveScan: (key === 'cccd_front' || key === 'cccd_back') ? null : base.document?.qrLiveScan,
          gplxQrLiveScan: (key === 'gplx_front' || key === 'gplx_back') ? null : base.document?.gplxQrLiveScan,
        },
      });
      inspectedCapture.current = { ...inspectedCapture.current, [key]: { uri: captured.uri } };
    }

    const collectSlotWarnings = (list?: VerificationWarning[]) =>
      (list ?? [])
        .filter(w => w.slot === key && !w.fieldKey)
        .map(w => ({
          code: w.code,
          message: w.humanReadableMessage + ' ' + w.recommendedAction,
          severe: w.severity === 'CRITICAL' || w.severity === 'BLOCKING',
        }));

    if (key === 'selfie') {
      const slotWarnings = collectSlotWarnings(base.verificationWarnings);
      return {
        warnings: slotWarnings,
        verified: false,
        note: slotWarnings.length
          ? 'Máy chủ phát hiện cảnh báo kích thước/ảnh trên selfie.'
          : 'Máy chủ đã kiểm tra định dạng và kích thước ảnh selfie.',
      };
    }

    try {
      const response = await api.json<ProposalResponse>(appPath(base.id) + '/extract/' + key, {
        method: 'POST', ...jsonBody({ revision: base.revision }), signal, timeoutMs: EXTRACT_TIMEOUT_MS,
      });
      ensureActive(signal);
      accept(response);
      inspectedCapture.current = { ...inspectedCapture.current, [key]: { uri: captured.uri, proposal: response.proposal } };
      const combined = new Map<string, { code: string; message: string; severe?: boolean }>();
      for (const item of collectSlotWarnings(response.verificationWarnings)) combined.set(item.code, item);
      for (const msg of visibleObservationWarnings(response.proposal.warnings)) {
        if (!combined.has(msg)) combined.set(msg, { code: msg, message: msg });
      }
      const list = [...combined.values()];
      return {
        warnings: list,
        verified: true,
        note: list.length
          ? 'Máy chủ phát hiện vấn đề chất lượng trên ảnh.'
          : 'Ảnh đạt kiểm tra độ rõ và góc thẻ từ máy chủ.',
      };
    } catch (error) {
      if (error instanceof VerificationError && ['ENGINE_TIMEOUT', 'ENGINE_BUSY'].includes(error.code)) {
        return {
          warnings: collectSlotWarnings(base.verificationWarnings),
          verified: false,
          note: 'Máy chủ đọc ảnh đang bận. Bạn vẫn có thể dùng ảnh để nhập tay ở bước sau.',
        };
      }
      throw error;
    }
  }

  async function pickFromGallery(key: SlotKey) {
    if (pickerActive.current || locked || !canEdit || !slotAllowed(current.current, key)) return;
    pickerActive.current = true;
    setPicking(true);
    setSettingsAction(false);
    setMessage('');
    try {
      const result = await Picker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: DOCUMENT_JPEG_QUALITY, exif: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const picked = result.assets[0];
      const normalized = await optimizeCapturedImage(
        {
          uri: picked.uri,
          width: picked.width,
          height: picked.height,
          mimeType: picked.mimeType ?? undefined,
          fileSize: picked.fileSize ?? cacheFileSize(picked.uri),
        },
        { kind: 'document', statSize: cacheFileSize, cleanup: removeCacheFile },
      );
      if (!alive.current) { removeCacheFile(normalized.uri); return; }
      acceptAsset(key, {
        ...picked,
        uri: normalized.uri,
        width: normalized.width,
        height: normalized.height,
        mimeType: normalized.mimeType,
        fileSize: normalized.fileSize ?? undefined,
      });
    } catch (error) {
      if (alive.current) setMessage(error instanceof Error ? error.message : 'Không mở được ảnh.');
    } finally {
      pickerActive.current = false;
      if (alive.current) setPicking(false);
    }
  }

  function ensureActive(signal: AbortSignal) {
    if (signal.aborted || !alive.current) throw new VerificationError('CANCELLED');
  }

  async function loadOrCreate(signal: AbortSignal) {
    const found = await reload(signal);
    ensureActive(signal);
    const result = found ?? await api.json<Application>('applications', { method: 'POST', signal, timeoutMs: METADATA_TIMEOUT_MS });
    ensureActive(signal);
    if (!editable(result)) throw new VerificationError('INVALID_TRANSITION');
    return accept(result);
  }

  function applyConfirmedToForm(confirmed?: Record<string, unknown>) {
    if (!confirmed) {
      updateForm({ values: {}, noExpiry: false, origins: {} });
      return;
    }
    const nextValues: Fields = {};
    for (const [key] of fields) {
      const value = confirmed[key];
      nextValues[key] = Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';
    }
    updateForm({
      values: nextValues,
      noExpiry: confirmed.no_expiry === true,
      origins: {},
    });
  }

  async function startReverify(signal: AbortSignal) {
    const active = current.current;
    if (!active) return;
    const updated = await api.json<Application>(appPath(active.id) + '/reverify', {
      method: 'POST', ...jsonBody({ revision: active.revision }), signal,
    });
    ensureActive(signal);
    cancelReading(true);
    touched.current.clear();
    setManualFields({});
    Object.values(livePhotos.current).forEach(p => removeCacheFile(p.uri));
    livePhotos.current = {};
    setPhotos({});
    trackUploads({});
    Object.values(livePreviews.current).forEach(p => removeCacheFile(p.uri));
    livePreviews.current = {};
    setPreviews({});
    setAck({});
    setConsent(false);
    setFaceConsent(false);
    setConfirm(false);
    setCompareGroup(null);
    setShowHistory(false);
    applyConfirmedToForm(updated.document?.confirmed ?? updated.approvedDocument?.confirmed);
    accept(updated);
    setStep(0);
    setStage('PREPARE');
  }

  async function cancelReverify(signal: AbortSignal) {
    const active = current.current;
    if (!active) return;
    const updated = await api.json<Application>(appPath(active.id) + '/cancel-reverify', {
      method: 'POST', ...jsonBody({ revision: active.revision }), signal,
    });
    ensureActive(signal);
    cancelReading(true);
    touched.current.clear();
    setManualFields({});
    Object.values(livePhotos.current).forEach(p => removeCacheFile(p.uri));
    livePhotos.current = {};
    setPhotos({});
    trackUploads({});
    Object.values(livePreviews.current).forEach(p => removeCacheFile(p.uri));
    livePreviews.current = {};
    setPreviews({});
    setConfirm(false);
    applyConfirmedToForm(updated.document?.confirmed ?? updated.approvedDocument?.confirmed);
    accept(updated);
    setStage('PREPARE');
    setMessage('Đã hủy cập nhật và khôi phục trạng thái hồ sơ đã xác minh.');
  }

  async function upload(key: SlotKey, base: Application, signal: AbortSignal) {
    const selectedPhoto = livePhotos.current[key];
    if (!selectedPhoto || !slotAllowed(base, key) || uploaded.current[key] === selectedPhoto.uri) return base;
    if (isSmall(selectedPhoto) && !ack[key]) throw new Error('Hãy xem lại và xác nhận ảnh nhỏ trước khi tải lên.');
    const result = await api.json<Application>(appPath(base.id) + '/captures/' + key + '?revision=' + base.revision, {
      method: 'PUT', body: new File(selectedPhoto.uri), headers: { 'Content-Type': selectedPhoto.mimeType }, signal, timeoutMs: UPLOAD_TIMEOUT_MS,
    });
    ensureActive(signal);
    if (livePhotos.current[key]?.uri !== selectedPhoto.uri) throw new VerificationError('CANCELLED');
    trackUploads({ ...uploaded.current, [key]: selectedPhoto.uri });
    return accept({
      ...result,
      document: {
        ...base.document,
        captures: {
          ...base.document?.captures,
          [key]: result.document?.captures?.[key] ?? { id: '', mime: selectedPhoto.mimeType },
        },
        proposals: result.document?.proposals ?? (
          base.document?.proposals ? { ...base.document.proposals, [key]: undefined } : undefined
        ),
        qrLiveScan: (key === 'cccd_front' || key === 'cccd_back') ? null : base.document?.qrLiveScan,
        gplxQrLiveScan: (key === 'gplx_front' || key === 'gplx_back') ? null : base.document?.gplxQrLiveScan,
      },
    });
  }

  async function checkFaceQuality(signal: AbortSignal) {
    if (!faceConsent || !faceNotice) return;
    setDraftFace(undefined);
    let base = await loadOrCreate(signal);
    for (const key of faceSlots) base = await upload(key, base, signal);
    const result = await api.json<DraftFaceQuality>(appPath(base.id) + '/face-quality', {
      method: 'POST', ...jsonBody({ revision: base.revision, faceConsentVersion: faceNotice }),
      signal, timeoutMs: FACE_QUALITY_TIMEOUT_MS,
    });
    ensureActive(signal);
    if (current.current?.id !== base.id || current.current.revision !== result.revision) return;
    setDraftFace(result);
  }

  function applyChoice(key: FieldKey, choice: Choice, user: boolean) {
    const form = currentValues.current;
    if (!fieldAllowed(current.current, key) || isIdentityLockedField(key, current.current)) return;
    if (user) {
      touched.current.add(key);
      setManualFields(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    updateForm({
      values: { ...form.values, [key]: choice.value },
      noExpiry: key === 'expiry_date' ? choice.noExpiry === true : form.noExpiry,
      origins: { ...form.origins, [key]: choice },
    });
    setConfirm(false);
  }

  function manual(key: FieldKey, value: string, unlimited?: boolean) {
    if (!fieldAllowed(current.current, key) || isIdentityLockedField(key, current.current)) return;
    const form = currentValues.current;
    touched.current.add(key);
    setManualFields(prev => (prev[key] ? prev : { ...prev, [key]: true }));
    updateForm({
      values: { ...form.values, [key]: value },
      noExpiry: unlimited ?? form.noExpiry,
      origins: { ...form.origins, [key]: undefined },
    });
    setConfirm(false);
  }

  async function runSlotExtraction(targetSlots: readonly SlotKey[], opts?: { autoAdvance?: boolean }) {
    if (ocr.current || operation.current || qrScanRequest.current || !consent || !canEdit) return null;
    const controller = new AbortController();
    const signal = controller.signal;
    ocr.current = controller;
    setReading(true);
    setExtractFailed(false);
    setQrSkipped(false);
    setGplxQrSkipped(false);
    setBackQrPromptDoc(null);
    setReadingNote(TASK_STATUS_UPLOADING);
    const results: SlotMap<Extraction> = { ...observations };
    let failures = 0;
    let version: number | undefined;
    try {
      let base = await loadOrCreate(signal);
      version = generation.current;
      for (const key of targetSlots) {
        if (key === 'selfie' || !slotAllowed(base, key) || (!livePhotos.current[key] && !base.document?.captures[key])) continue;
        const cached = serverExtracted.current[key];
        if (cached && livePhotos.current[key]?.uri === cached.uri) {
          results[key] = cached.proposal;
          continue;
        }
        const needsUpload = Boolean(livePhotos.current[key] && uploaded.current[key] !== livePhotos.current[key]?.uri);
        if (needsUpload) {
          setReadingNote(TASK_STATUS_UPLOADING);
        }
        base = await upload(key, base, signal);
        const savedProposal = hydratableObservationsFromApplication(
          base,
          needsUpload ? { ...livePhotos.current, [key]: undefined } : livePhotos.current,
        )[key];
        if (savedProposal) {
          results[key] = savedProposal;
          if (livePhotos.current[key]?.uri) {
            serverExtracted.current[key] = { uri: livePhotos.current[key]!.uri, proposal: savedProposal };
          }
          continue;
        }
        const expected = { generation: version, id: base.id, revision: base.revision };
        try {
          setReadingNote(TASK_STATUS_EXTRACTING);
          const response = await api.json<ProposalResponse>(appPath(base.id) + '/extract/' + key, {
            method: 'POST', ...jsonBody({ revision: base.revision }), signal, timeoutMs: EXTRACT_TIMEOUT_MS,
          });
          ensureActive(signal);
          if (!current.current || !sameExtractionGeneration(expected, { ...current.current, generation: generation.current })) return null;
          results[key] = response.proposal;
          if (livePhotos.current[key]?.uri) {
            serverExtracted.current[key] = { uri: livePhotos.current[key]!.uri, proposal: response.proposal };
          }
          base = accept(response);
        } catch (error) {
          if (error instanceof VerificationError && ['ENGINE_TIMEOUT', 'ENGINE_BUSY', 'TIMEOUT', 'NETWORK'].includes(error.code)) {
            if (error.code === 'TIMEOUT' || error.code === 'ENGINE_TIMEOUT') {
              try {
                const synced = await reload(signal);
                const recovered = hydratableObservationsFromApplication(
                  synced,
                  { ...livePhotos.current, [key]: undefined },
                )[key];
                if (synced && recovered) {
                  base = synced;
                  results[key] = recovered;
                  if (livePhotos.current[key]?.uri) {
                    serverExtracted.current[key] = { uri: livePhotos.current[key]!.uri, proposal: recovered };
                  }
                  continue;
                }
              } catch { /* Preserve local capture and report recoverable timeout below. */ }
            }
            failures++;
          } else { throw error; }
        }
      }
      ensureActive(signal);
      if (version !== generation.current) return null;
      setObservations(results);
      if (failures > 0) setExtractFailed(true);
      if (results.cccd_front || results.cccd_back) setCccdRevalidationNeeded(false);
      if (results.gplx_front || results.gplx_back) setGplxRevalidationNeeded(false);
      const form = currentValues.current;
      const activeLiveQr = liveQrRef.current;
      const activeGplxLiveQr = gplxLiveQrRef.current;
      const proposals = collectChoices(results, activeLiveQr, activeGplxLiveQr);
      const fill = autofillChoices(form.values, form.noExpiry, touched.current, proposals);
      for (const [key] of fields) if (fill[key]) applyChoice(key, fill[key], false);
      const cccdDecision = qrScanDecision(results, { documentType: 'CCCD', liveQr: activeLiveQr, extractFailed: failures > 0 });
      const gplxDecision = qrScanDecision(results, { documentType: 'GPLX', liveQr: activeGplxLiveQr, extractFailed: failures > 0 });
      const decision = targetSlots.every(s => s.startsWith('gplx')) ? gplxDecision : cccdDecision;
      const docLabel = targetSlots.every(s => s.startsWith('gplx')) ? 'GPLX' : 'CCCD';
      const any = Object.keys(proposals).length > 0;
      const hasWarn = Object.values(results).some(r => r.warnings.length);
      if (failures) {
        setReadingNote('Kết nối chậm hoặc máy chủ đang khởi động. Ảnh đã chọn vẫn được giữ lại — bạn có thể thử lại, quét QR hoặc nhập tay.');
      } else if (decision.mode === 'SKIP_DECODED') {
        setReadingNote(hasWarn
          ? `${TASK_STATUS_COMPLETED} Đã giải mã mã QR trên ảnh ${docLabel} và điền đề xuất; hãy đối chiếu lại.`
          : `${TASK_STATUS_COMPLETED} Đã giải mã mã QR trên ảnh ${docLabel}. Không cần quét thêm mã QR.`);
      } else if (decision.mode === 'RECOMMEND_LIVE_SCAN') {
        setReadingNote(`Phát hiện mã QR trên ${docLabel} nhưng ảnh khó đọc. Hãy quét mã QR trực tiếp hoặc bỏ qua để nhập tay.`);
      } else if (decision.mode === 'ALLOW_LIVE_SCAN') {
        setReadingNote(`Chưa đọc được mã QR từ ảnh ${docLabel}. Bạn có thể quét QR trực tiếp hoặc bỏ qua nếu thẻ cũ không có QR.`);
      } else {
        setReadingNote(any
          ? (hasWarn ? `${TASK_STATUS_COMPLETED} Đã điền sẵn đề xuất. Một số mục cần đối chiếu kỹ hơn.` : `${TASK_STATUS_COMPLETED} Hãy kiểm tra và xác nhận.`)
          : 'Chưa đọc được thông tin từ ảnh. Bạn có thể tự nhập thông tin ở bước tiếp theo.');
      }
      if (opts?.autoAdvance && failures === 0
        && cccdDecision.mode !== 'RECOMMEND_LIVE_SCAN'
        && gplxDecision.mode !== 'RECOMMEND_LIVE_SCAN') {
        setStage('CONFIRM_FIELDS');
      }
      return decision;
    } catch (error) {
      if (alive.current && !signal.aborted) {
        setExtractFailed(true);
        if (version === generation.current) setObservations(results);
        setReadingNote((error instanceof Error ? error.message : 'Chưa đọc được.') + ' Bạn vẫn có thể quét QR trực tiếp hoặc nhập tay.');
        const docType: QrDocumentType = targetSlots.every(s => s.startsWith('gplx')) ? 'GPLX' : 'CCCD';
        return qrScanDecision(results, {
          documentType: docType,
          liveQr: docType === 'GPLX' ? gplxLiveQrRef.current : liveQrRef.current,
          extractFailed: true,
        });
      }
      return null;
    } finally {
      ocr.current = null;
      if (alive.current) {
        setReading(false);
        if (signal.aborted) setReadingNote('Lượt đọc đã dừng. Bạn có thể đọc lại hoặc nhập tay.');
      }
    }
  }

  function completeCaptureFlow() {
    if (targets?.captures.every(key => key === 'selfie')) {
      setStage('CONFIRM_FIELDS');
      return;
    }
    const alreadyReady = !cccdRevalidationNeeded
      && !gplxRevalidationNeeded
      && Object.keys(observations).length > 0;
    if (alreadyReady) {
      setStage('CONFIRM_FIELDS');
      return;
    }
    setStage('OCR');
    void runSlotExtraction(slots.map(([key]) => key), { autoAdvance: true });
  }

  async function readAutomatically() {
    await runSlotExtraction(slots.map(([key]) => key));
  }

  function openLiveQrScanner(docType: QrDocumentType, target: 'CAPTURE_NEXT' | 'OCR' | 'CONFIRM_FIELDS') {
    setQrScannerDocType(docType);
    setQrReturnTarget(target);
    if (docType === 'GPLX') setGplxQrSkipped(false);
    else setQrSkipped(false);
    setBackQrPromptDoc(null);
    setQrScannerOpen(true);
  }

  async function continueAfterDocumentBack(docType: QrDocumentType) {
    const nextStep = step + 1;
    const isGplx = docType === 'GPLX';
    const pair: readonly [SlotKey, SlotKey] = isGplx
      ? ['gplx_front', 'gplx_back']
      : ['cccd_front', 'cccd_back'];
    const currentDecision = isGplx ? gplxQrDecision : qrDecision;
    const skipped = isGplx ? gplxQrSkipped : qrSkipped;
    const hasPair = Boolean(
      (photos[pair[0]] || app?.document?.captures[pair[0]])
      && (photos[pair[1]] || app?.document?.captures[pair[1]]),
    );
    const goNext = () => {
      if (nextStep < slots.length) setStep(nextStep);
      else completeCaptureFlow();
    };
    if (!hasPair || currentDecision.mode === 'SKIP_DECODED' || currentDecision.mode === 'LIVE_SCANNED' || skipped) {
      goNext();
      return;
    }
    const decision = await runSlotExtraction(pair);
    if (!alive.current || !decision) {
      goNext();
      return;
    }
    if (decision.mode === 'SKIP_DECODED' || decision.mode === 'LIVE_SCANNED' || decision.mode === 'NO_QR_CARD') {
      goNext();
      return;
    }
    if (decision.mode === 'RECOMMEND_LIVE_SCAN') {
      openLiveQrScanner(docType, 'CAPTURE_NEXT');
      return;
    }
    setBackQrPromptDoc(docType);
  }

  async function submitQrLivePayload(
    rawPayload: string,
    side: QrDocumentSide,
    signal: AbortSignal,
  ): Promise<QrScanSubmissionResult> {
    if (qrScanRequest.current) {
      return { ok: false, message: 'Đang xử lý lượt quét trước. Hãy đợi hoàn tất.' };
    }
    const docType = qrScannerDocType;
    const localController = new AbortController();
    const forwardAbort = () => localController.abort();
    signal.addEventListener('abort', forwardAbort);
    qrScanRequest.current = localController;
    const startedGeneration = generation.current;

    const localUris: SlotMap<string> = {};
    (Object.keys(livePhotos.current) as SlotKey[]).forEach(k => {
      if (livePhotos.current[k]?.uri) localUris[k] = livePhotos.current[k]!.uri;
    });

    const postQrScan = async (baseApp: Application) => {
      const { attachmentId } = resolveQrAttachmentBinding({
        docType,
        side,
        application: baseApp,
        uploadedUris: uploaded.current,
        localUris,
      });
      return api.json<QrScanResponse>(appPath(baseApp.id) + '/qr-scan', {
        method: 'POST',
        ...jsonBody({
          revision: baseApp.revision,
          rawPayload,
          documentSide: side,
          documentType: docType,
          ...(attachmentId ? { attachmentId } : {}),
        }),
        signal: localController.signal,
        timeoutMs: QR_SCAN_TIMEOUT_MS,
      });
    };

    try {
      let base = current.current && editable(current.current)
        ? current.current
        : await loadOrCreate(localController.signal);
      if (startedGeneration !== generation.current) {
        return { ok: false, message: 'Ảnh hoặc hồ sơ đã thay đổi, lượt quét cũ đã được bỏ qua.' };
      }
      let expected = { generation: generation.current, id: base.id, revision: base.revision };
      let response: QrScanResponse;
      try {
        response = await postQrScan(base);
      } catch (error) {
        if (error instanceof VerificationError && error.code === 'REVISION_CONFLICT') {
          const synced = await reload(localController.signal);
          if (!synced || !editable(synced) || startedGeneration !== generation.current) {
            return { ok: false, message: 'Ảnh hoặc hồ sơ vừa thay đổi. Hãy đóng máy quét và thử lại.' };
          }
          base = synced;
          expected = { generation: generation.current, id: base.id, revision: base.revision };
          response = await postQrScan(base);
        } else {
          throw error;
        }
      }
      if (!alive.current || localController.signal.aborted) {
        return { ok: false, message: 'Đã hủy lượt quét QR.' };
      }
      if (!current.current || !sameExtractionGeneration(expected, { ...current.current, generation: generation.current })) {
        return { ok: false, message: 'Hồ sơ hoặc ảnh đã thay đổi, kết quả quét cũ đã được bỏ qua.' };
      }
      if (response.qr.status === 'INVALID_FORMAT' || response.qr.status === 'UNSUPPORTED_FORMAT') {
        return {
          ok: false,
          status: response.qr.status,
          message: response.qr.status === 'UNSUPPORTED_FORMAT'
            ? (docType === 'GPLX'
                ? 'Mã QR là liên kết tra cứu hoặc định dạng chưa hỗ trợ đọc trực tiếp thông tin trên thẻ.'
                : 'Định dạng mã QR chưa được hỗ trợ.')
            : `Mã QR vừa quét không đúng định dạng ${docType}.`,
        };
      }
      accept(response);
      if (docType === 'GPLX') {
        setGplxLiveQrState(response.qr);
        setGplxRevalidationNeeded(false);
        setGplxQrSkipped(false);
      } else {
        setLiveQrState(response.qr);
        setCccdRevalidationNeeded(false);
        setQrSkipped(false);
      }
      const nextCccdLive = docType === 'CCCD' ? response.qr : liveQrRef.current;
      const nextGplxLive = docType === 'GPLX' ? response.qr : gplxLiveQrRef.current;
      const form = currentValues.current;
      const proposals = collectChoices(observations, nextCccdLive, nextGplxLive);
      const fill = autofillChoices(form.values, form.noExpiry, touched.current, proposals);
      for (const [key] of fields) if (fill[key]) applyChoice(key, fill[key], false);
      return { ok: true, qr: response.qr };
    } catch (error) {
      if (localController.signal.aborted) {
        return { ok: false, message: 'Đã hủy lượt quét QR.' };
      }
      if (error instanceof VerificationError && error.code === 'REVISION_CONFLICT') {
        return { ok: false, message: 'Ảnh hoặc hồ sơ vừa thay đổi. Hãy đóng máy quét và thử lại.' };
      }
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Chưa gửi được mã QR. Bạn có thể Quét lại hoặc Bỏ qua.',
      };
    } finally {
      signal.removeEventListener('abort', forwardAbort);
      if (qrScanRequest.current === localController) {
        qrScanRequest.current = null;
      }
    }
  }

  async function preview(key: SlotKey, signal: AbortSignal) {
    const activeApp = current.current;
    const capture = activeApp?.document?.captures[key];
    if (!activeApp || !capture?.id) return;
    const result = await api.preview(appPath(activeApp.id) + '/captures/' + key, signal);
    ensureActive(signal);
    if (current.current?.document?.captures[key]?.id !== capture.id) return;
    const file = new File(Paths.cache, 'verification-preview-' + operationKey() + '.' + result.mime.split('/')[1]);
    try {
      file.create();
      await file.write(result.bytes);
      ensureActive(signal);
    } catch (error) {
      removeCacheFile(file.uri);
      throw error;
    }
    removeCacheFile(livePreviews.current[key]?.uri ?? '');
    livePreviews.current = { ...livePreviews.current, [key]: { uri: file.uri, id: capture.id } };
    setPreviews(livePreviews.current);
  }

  async function submit(signal: AbortSignal) {
    let request = pendingRef.current;
    if (!request) {
      if (!consent || !confirm) return;
      const details = confirmedDetails(values, noExpiry);
      let saved = current.current;
      if (!saved || !currentWarningReview?.acknowledged) {
        const expected = current.current?.revision;
        let base = await loadOrCreate(signal);
        if (expected !== undefined && base.revision !== expected) {
          throw new VerificationError('REVISION_CONFLICT');
        }
        for (const [key] of slots) {
          if (!livePhotos.current[key] && !base.document?.captures[key]) {
            throw new Error('Còn thiếu ảnh bắt buộc.');
          }
        }
        for (const [key] of slots) base = await upload(key, base, signal);
        saved = await api.json<Application>(appPath(base.id) + '/confirmation', {
          method: 'PUT', ...jsonBody({ details, revision: base.revision }), signal, timeoutMs: METADATA_TIMEOUT_MS,
        });
        ensureActive(signal);
        accept(saved);
        if (saved.verificationWarnings?.some(warning => warning.requiresReview)) {
          setWarningReview({ revision: saved.revision, acknowledged: false });
          setMessage('Hãy xem lại cảnh báo và bật xác nhận trước khi gửi.');
          return;
        }
      }
      request = {
        id: saved.id, revision: saved.revision, key: operationKey(),
        faceConsentVersion: faceConsent ? faceNotice : undefined,
        warningAcknowledgementRevision: currentWarningReview?.acknowledged ? saved.revision : undefined,
      };
      pendingRef.current = request;
      setPending(request);
    }
    const body = jsonBody({
      revision: request.revision, faceConsentVersion: request.faceConsentVersion,
      warningAcknowledgementRevision: request.warningAcknowledgementRevision,
    });
    let saved: Application;
    try {
      saved = await api.json<Application>(appPath(request.id) + '/submit', {
        ...body, headers: { ...body.headers, 'Idempotency-Key': request.key }, method: 'POST', signal, timeoutMs: SUBMIT_TIMEOUT_MS,
      });
    } catch (error) {
      if (error instanceof VerificationError && ['REVISION_CONFLICT', 'INVALID_TRANSITION', 'FIELD_MISSING', 'WARNING_ACK_REQUIRED'].includes(error.code)) {
        pendingRef.current = null;
        setPending(null);
        setConfirm(false);
        await reload(signal);
      }
      throw error;
    }
    ensureActive(signal);
    if (!saved.status || saved.status === 'DRAFT' || saved.status === 'NEEDS_MORE_INFO') {
      throw new VerificationError('SERVER');
    }
    if (!current.current || current.current.revision <= saved.revision) accept(saved);
    pendingRef.current = null;
    setPending(null);
    setConfirm(false);
    setFaceConsent(false);
    Object.values(livePhotos.current).forEach(p => removeCacheFile(p.uri));
    livePhotos.current = {};
    trackUploads({});
    setPhotos({});
    Object.values(livePreviews.current).forEach(p => removeCacheFile(p.uri));
    livePreviews.current = {};
    setPreviews({});
    setMessage('Hồ sơ đã được gửi lên máy chủ.');
    try { await reload(signal); } catch { /* A confirmed submission remains successful. */ }
  }

  function resolvedPhotoUri(key: SlotKey) {
    const saved = app?.document?.captures[key];
    const existing = saved && previews[key]?.id === saved.id ? previews[key]?.uri : undefined;
    return photos[key]?.uri ?? existing;
  }

  function jumpToFirstEditableSlot() {
    setStep(firstEditableStep);
    setStage('CAPTURE');
  }

  const nameMismatch = !currentWarningReview && values.cccd_name && values.gplx_name
    ? compareNames(values.cccd_name, values.gplx_name) : null;
  const dobMismatch = Boolean(!currentWarningReview && values.cccd_dob && values.gplx_dob
    && values.cccd_dob.trim() !== values.gplx_dob.trim());
  const ocrLockedCccdConflict = Boolean(
    app?.identityLocked &&
    values.cccd_id &&
    (
      observations.cccd_front?.candidates?.some(
        item => item.fieldKey === 'id_number' && item.validationStatus === 'valid' &&
          typeof item.candidateValue === 'string' && item.candidateValue.trim() !== values.cccd_id?.trim(),
      )
      || observations.cccd_back?.candidates?.some(
        item => item.fieldKey === 'id_number' && item.validationStatus === 'valid' &&
          typeof item.candidateValue === 'string' && item.candidateValue.trim() !== values.cccd_id?.trim(),
      )
      || (typeof liveQr?.fields?.id_number === 'string' && liveQr.fields.id_number.trim() !== values.cccd_id?.trim())
    ),
  );

  const readyCaptureCount = slots.filter(([k]) => Boolean(photos[k] || app?.document?.captures[k])).length;
  const hasVerifiedBaseline = Boolean(app && (app.status === 'APPROVED' || app.approvedRevision != null));
  const currentHasPhoto = Boolean(slot && (photos[slot[0]] || app?.document?.captures[slot[0]]));
  const currentSlotAllowed = Boolean(slot && slotAllowed(app, slot[0]));
  const currentSlotWarnings = slot
    ? warnings.filter(warning =>
        warning.slot === slot[0] && !warning.fieldKey && (!photos[slot[0]] || uploadedPhotos[slot[0]] === photos[slot[0]]?.uri))
    : [];

  const smallBlocked = Boolean(slot && photo && isSmall(photo) && !ack[slot[0]]);

  return (
    <DriverPage
      form
      title="Xác minh tài xế"
      backFallback="/(tabs)/profile"
      scrollResetKey={`${stage}:${step}:${app?.status ?? 'new'}:${canEdit ? 'edit' : 'view'}`}
      headerContent={canEdit ? (
        <VerificationStepHeader
          stage={stage}
          step={step}
          hasPhoto={key => Boolean(photos[key] || app?.document?.captures[key])}
        />
      ) : undefined}
      headerAction={(
        <Appbar.Action
          icon="refresh"
          style={styles.headerAction}
          disabled={Boolean(busy) || picking}
          accessibilityLabel="Làm mới trạng thái xác minh"
          onPress={() => { ocr.current?.abort(); void run('Đang làm mới…', reload); }}
        />
      )}
      footer={(pending || canEdit) ? (
        <VerificationFooter
          pending={Boolean(pending)}
          canEdit={canEdit}
          stage={stage}
          step={step}
          slotKey={slot?.[0]}
          busy={busy}
          locked={locked}
          reading={reading}
          consent={consent}
          needsCapture={needsCapture}
          currentSlotAllowed={currentSlotAllowed}
          currentHasPhoto={currentHasPhoto}
          smallBlocked={smallBlocked}
          hasObservations={Object.keys(observations).length > 0}
          extractFailed={extractFailed}
          confirm={confirm}
          currentWarningReview={currentWarningReview}
          warnings={warnings}
          appStatus={app?.status}
          onRetryPendingSubmit={() => void run('Đang kiểm tra lần nộp…', submit)}
          onStartCapture={jumpToFirstEditableSlot}
          onJumpConfirmFields={() => setStage('CONFIRM_FIELDS')}
          onOpenCamera={() => { if (slot) openGuidedCapture(slot[0]); }}
          onContinueBack={docType => { void continueAfterDocumentBack(docType); }}
          onNextCaptureStep={() => setStep(step + 1)}
          onCompleteCapture={completeCaptureFlow}
          onBackFromCapture={() => {
            setBackQrPromptDoc(null);
            if (step === 0) setStage('PREPARE');
            else setStep(step - 1);
          }}
          onAbortExtractionToManual={() => {
            ocr.current?.abort();
            setStage('CONFIRM_FIELDS');
          }}
          onBackToCaptureFromOcr={() => { setStep(slots.length - 1); setStage('CAPTURE'); }}
          onGoSummary={() => setStage('SUMMARY')}
          onBackFromFields={() => setStage(extractFailed ? 'OCR' : 'CAPTURE')}
          onSubmit={() => void run('Đang nộp hồ sơ…', submit)}
        />
      ) : undefined}
    >
      <View style={styles.page}>
        {app && !(hasVerifiedBaseline && !canEdit && !pending) ? (
          <EditingStatusBanner
            app={app}
            targetLabels={targetLabels}
            needsCapture={needsCapture}
            busy={busy}
            picking={picking}
            pending={Boolean(pending)}
            onJumpCapture={() => { setConsent(true); jumpToFirstEditableSlot(); }}
            onJumpFields={() => { setConsent(true); setStage('CONFIRM_FIELDS'); }}
            onStartReverify={() => void run('Đang tạo yêu cầu hồ sơ mới…', startReverify)}
            onCancelReverify={() => void run('Đang khôi phục trạng thái…', cancelReverify)}
          />
        ) : null}

        {!canEdit && app && hasVerifiedBaseline && !pending ? (
          <VerifiedBaselineView
            app={app}
            busy={busy}
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory(v => !v)}
            onOpenCapabilities={() => router.push('/profile/capabilities')}
            onStartReverify={() => void run('Đang mở cập nhật giấy tờ…', startReverify)}
          />
        ) : null}

        {busy || message ? (
          <View style={[styles.infoBanner, { backgroundColor: colors.surfaceContainerHigh }]}>
            {busy ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            <Text style={styles.flex} accessibilityLiveRegion="polite">{busy || message}</Text>
          </View>
        ) : null}

        {settingsAction ? (
          <Button
            variant="secondary"
            label="Mở cài đặt quyền camera"
            onPress={() => {
              void Linking.openSettings().catch(() => setMessage('Không mở được cài đặt trên thiết bị này.'));
            }}
          />
        ) : null}

        {!canEdit && app && !pending && !hasVerifiedBaseline ? (
          <PendingReviewView
            app={app}
            warnings={warnings}
            busy={Boolean(busy)}
            resolvedUri={resolvedPhotoUri}
            onPreviewSaved={key => void run('Đang mở ảnh…', signal => preview(key, signal))}
            onGoHome={() => router.replace('/(tabs)/home')}
          />
        ) : null}

        {canEdit && stage === 'PREPARE' ? (
          <VerificationPrepareStep
            consent={consent}
            locked={locked}
            reading={reading}
            onToggleConsent={value => { setConsent(value); setConfirm(false); }}
          />
        ) : null}

        {canEdit && stage === 'CAPTURE' && slot ? (
          <VerificationCaptureStep
            slotKey={slot[0]}
            slotLabel={slot[1]}
            stepIndex={step}
            totalSlots={slots.length}
            photo={photo}
            photoUri={resolvedPhotoUri(slot[0])}
            hasSavedCapture={Boolean(app?.document?.captures[slot[0]])}
            allowed={currentSlotAllowed}
            locked={locked}
            reading={reading}
            smallAck={Boolean(ack[slot[0]])}
            slotWarnings={currentSlotWarnings}
            backQrPromptDoc={backQrPromptDoc}
            extractFailed={extractFailed}
            onToggleSmallAck={value => setAck(old => ({ ...old, [slot[0]]: value }))}
            onOpenCamera={() => openGuidedCapture(slot[0])}
            onPickGallery={() => void pickFromGallery(slot[0])}
            onOpenLiveQr={docType => openLiveQrScanner(docType, 'CAPTURE_NEXT')}
            onSkipBackQr={isGplx => {
              setBackQrPromptDoc(null);
              if (isGplx) setGplxQrSkipped(true);
              else setQrSkipped(true);
              if (step + 1 < slots.length) setStep(step + 1);
              else completeCaptureFlow();
            }}
          />
        ) : null}

        {canEdit && stage === 'OCR' ? (
          <VerificationExtractionStep
            reading={reading}
            readingNote={readingNote}
            readyCaptureCount={readyCaptureCount}
            observations={observations}
            qrDecision={qrDecision}
            gplxQrDecision={gplxQrDecision}
            qrSkipped={qrSkipped}
            gplxQrSkipped={gplxQrSkipped}
            hasCccdPhotos={Boolean(photos.cccd_front || photos.cccd_back || app?.document?.captures.cccd_front || app?.document?.captures.cccd_back)}
            hasGplxPhotos={Boolean(photos.gplx_front || photos.gplx_back || app?.document?.captures.gplx_front || app?.document?.captures.gplx_back)}
            cccdRevalidationNeeded={cccdRevalidationNeeded}
            gplxRevalidationNeeded={gplxRevalidationNeeded}
            ocrLockedCccdConflict={ocrLockedCccdConflict}
            locked={locked}
            disableAutoExtract={Boolean(targets && targets.captures.every(key => key === 'selfie'))}
            onReadAutomatically={() => void readAutomatically()}
            onOpenLiveQr={docType => openLiveQrScanner(docType, 'CONFIRM_FIELDS')}
            onSkipQr={docType => (docType === 'GPLX' ? setGplxQrSkipped(true) : setQrSkipped(true))}
          />
        ) : null}

        {canEdit && stage === 'CONFIRM_FIELDS' ? (
          <VerificationFieldsStep
            app={app}
            locked={locked}
            reading={reading}
            values={values}
            noExpiry={noExpiry}
            origins={origins}
            manualFields={manualFields}
            choices={choices}
            warnings={warnings}
            photos={photos}
            resolvedUri={resolvedPhotoUri}
            qrDecision={qrDecision}
            gplxQrDecision={gplxQrDecision}
            cccdRevalidationNeeded={cccdRevalidationNeeded}
            gplxRevalidationNeeded={gplxRevalidationNeeded}
            compareGroup={compareGroup}
            nameMismatch={nameMismatch}
            dobMismatch={dobMismatch}
            ocrLockedCccdConflict={ocrLockedCccdConflict}
            onToggleCompare={group => setCompareGroup(compareGroup === group ? null : group)}
            onOpenLiveQr={docType => openLiveQrScanner(docType, 'CONFIRM_FIELDS')}
            onPreviewSaved={key => void run('Đang mở ảnh…', signal => preview(key, signal))}
            onManualChange={manual}
            onApplyChoice={(key, choice) => applyChoice(key, choice, true)}
          />
        ) : null}

        {canEdit && stage === 'SUMMARY' ? (
          <VerificationSummaryStep
            app={app}
            locked={locked}
            reading={reading}
            photos={photos}
            resolvedUri={resolvedPhotoUri}
            values={values}
            noExpiry={noExpiry}
            warnings={warnings}
            faceNotice={faceNotice}
            faceConsent={faceConsent}
            liveFace={liveFace}
            confirm={confirm}
            currentWarningReview={currentWarningReview}
            onEditPhoto={idx => { setStep(idx); setStage('CAPTURE'); setConfirm(false); }}
            onEditFields={() => setStage('CONFIRM_FIELDS')}
            onPreviewSaved={key => void run('Đang mở ảnh…', signal => preview(key, signal))}
            onToggleFaceConsent={value => { setFaceConsent(value); setDraftFace(undefined); setConfirm(false); }}
            onCheckFaceQuality={() => void run('Đang kiểm tra chất lượng ảnh…', checkFaceQuality)}
            onToggleConfirm={setConfirm}
            onToggleWarningReview={(revision, acknowledged) => setWarningReview({ revision, acknowledged })}
          />
        ) : null}
      </View>

      {guidedSlot ? (
        <GuidedCaptureScreen
          visible
          kind={guidedSlot === 'selfie' ? 'selfie' : 'document'}
          label={slots.find(([key]) => key === guidedSlot)?.[1].replace(' (tùy chọn)', '') ?? ''}
          side={guidedSlot.endsWith('_back') ? 'back' : guidedSlot === 'selfie' ? undefined : 'front'}
          instruction={captureInstructions[guidedSlot]}
          onPickFromGallery={guidedSlot === 'selfie' ? undefined : () => { const key = guidedSlot; setGuidedSlot(null); void pickFromGallery(key); }}
          onInspectServer={consent ? (captured, signal) => inspectCapturedWithServer(guidedSlot, captured, signal) : undefined}
          onCapture={captured => onGuidedCaptured(guidedSlot, captured)}
          onClose={() => setGuidedSlot(null)}
        />
      ) : null}

      {qrScannerOpen ? (
        <QrScannerScreen
          visible
          documentType={qrScannerDocType}
          defaultSide={(qrScannerDocType === 'GPLX' ? gplxQrDecision : qrDecision).defaultSide}
          expectedVariant={(qrScannerDocType === 'GPLX' ? gplxQrDecision : qrDecision).expectedVariant}
          onScanPayload={submitQrLivePayload}
          onSkip={() => {
            setQrScannerOpen(false);
            setBackQrPromptDoc(null);
            if (qrScannerDocType === 'GPLX') setGplxQrSkipped(true);
            else setQrSkipped(true);
            if (qrReturnTarget === 'CAPTURE_NEXT') {
              const nextStep = step + 1;
              if (nextStep < slots.length) setStep(nextStep);
              else completeCaptureFlow();
            }
          }}
          onDone={() => {
            setQrScannerOpen(false);
            setBackQrPromptDoc(null);
            if (qrReturnTarget === 'CAPTURE_NEXT') {
              const nextStep = step + 1;
              if (nextStep < slots.length) setStep(nextStep);
              else completeCaptureFlow();
            } else {
              setStage('CONFIRM_FIELDS');
            }
          }}
        />
      ) : null}
    </DriverPage>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { gap: spacing.spaceMd, paddingBottom: spacing.spaceXl },
  headerAction: { width: 48, height: 48, borderRadius: 24 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, padding: spacing.px3, borderRadius: spacing.spaceMd },
  flex: { flex: 1 },
});
