import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, Switch, View } from 'react-native';
import * as Picker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { ActivityIndicator, Appbar, ProgressBar } from 'react-native-paper';
import { DriverPage } from '@/components/DriverPage';
import { DriverPhoto } from '@/components/DriverPhoto';
import {
  Button, Card, GroupedList, SettingsListItem, Typography as Text, ThemedTextInput as TextInput, borderRadius, spacing, typography,
  useThemeColors, useThemedStyles, type ThemeColors,
} from '@datxe/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useSessionStore } from '@/lib/store';
import { jsonBody, verificationClient, verificationUrl, type Application, type ProposalResponse, type VerificationWarning } from './api';
import { VerificationError } from './transport';
import { GuidedCaptureScreen, type CapturedPhoto, type ServerInspectionResult } from './GuidedCaptureScreen';
import { removeCacheFile } from './captureFiles';
import {
  autofillChoices, collectChoices, compareNames, confirmedDetails, fields, sameExtractionGeneration, slots, warningReviewForRevision,
  type Choice, type Extraction, type FieldKey, type Fields, type SlotKey,
} from './workflow';

type DraftFaceQuality = {
  revision: number;
  status: 'QUALITY_CHECKED' | 'NOT_EVALUATED';
  verificationWarnings: VerificationWarning[];
};
type FlowStage = 'PREPARE' | 'CAPTURE' | 'OCR' | 'CONFIRM_FIELDS' | 'SUMMARY';
const faceSlots = ['cccd_front', 'gplx_front', 'selfie'] as const;
const cccdFieldKeys: readonly FieldKey[] = ['cccd_name', 'cccd_id', 'cccd_dob', 'cccd_gender', 'cccd_expiry_date'];
const gplxFieldKeys: readonly FieldKey[] = ['gplx_name', 'gplx_number', 'gplx_dob', 'gplx_classes', 'expiry_date'];
const optionalFields = new Set<FieldKey>(['cccd_gender', 'cccd_expiry_date']);

type Photo = Picker.ImagePickerAsset & { mimeType: string };
type SlotMap<T> = Partial<Record<SlotKey, T>>;
type Pending = { id: string; revision: number; key: string; faceConsentVersion?: string; warningAcknowledgementRevision?: number };

const statusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp · Chờ xét duyệt',
  UNDER_REVIEW: 'Đang xét duyệt',
  NEEDS_MORE_INFO: 'Cần bổ sung hồ sơ',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Không được duyệt',
  REVOKED: 'Đã thu hồi xác minh',
};
const stageLabels: Record<FlowStage, string> = {
  PREPARE: 'Bước 1/5 · Chuẩn bị giấy tờ',
  CAPTURE: 'Bước 2/5 · Chụp ảnh giấy tờ',
  OCR: 'Bước 3/5 · Đọc thông tin tự động',
  CONFIRM_FIELDS: 'Bước 4/5 · Xác nhận thông tin',
  SUMMARY: 'Bước 5/5 · Kiểm tra & nộp hồ sơ',
};
const captureInstructions: Record<SlotKey, string> = {
  cccd_front: 'Xoay dọc mặt trước CCCD vừa khít khung, đủ 4 góc, chữ và ảnh rõ nét, tránh lóa sáng.',
  cccd_back: 'Xoay dọc mặt sau CCCD ngay ngắn trong khung, thấy rõ mã chip, dấu mộc và dòng MRZ.',
  gplx_front: 'Xoay dọc mặt trước GPLX vừa khít khung, thấy rõ số bằng, họ tên, hạng và thời hạn.',
  gplx_back: 'Có thể xoay dọc chụp mặt sau GPLX để đối chiếu hạng xe, hoặc bấm Tiếp tục để bỏ qua.',
  selfie: 'Giữ máy ngang tầm mắt, nhìn thẳng, đủ sáng, không đeo kính râm hay khẩu trang.',
};
const editable = (app: Application | null) =>
  !app || app.status === 'DRAFT' || app.status === 'NEEDS_MORE_INFO';
const appPath = (id: string) => 'applications/' + encodeURIComponent(id);
const scoped = (app: Application | null) => (app?.status === 'NEEDS_MORE_INFO' ? app.requestedChanges : null);
const slotAllowed = (app: Application | null, key: SlotKey) =>
  scoped(app)?.captures.includes(key) ?? true;
const fieldAllowed = (app: Application | null, key: FieldKey) =>
  scoped(app)?.fields.includes(key) ?? true;
const isSmall = (photo: Photo) => Math.min(photo.width, photo.height) < 480;
const warningLabels: Record<string, string> = {
  ORIENTATION_UNCERTAIN: 'Chưa xác định chắc chiều thẻ.',
  RAW_FRAME_FALLBACK: 'Không nắn được thẻ. Hãy kiểm tra lại ảnh.',
  DOCUMENT_SLOT_MISMATCH: 'Ảnh có thể sai loại hoặc sai mặt.',
  LOW_RESOLUTION: 'Chữ có thể quá nhỏ.',
  LOW_KEYPOINT_CONFIDENCE: 'Hãy kiểm tra đủ các góc thẻ.',
  OCR_UNAVAILABLE: 'Không thể đọc chữ ở lượt này.',
  DETECTOR_NO_BOX: 'Không tìm thấy vùng thẻ trong ảnh.',
  DETECTOR_CARD_NOT_FOUND: 'Không xác định được vùng thẻ.',
  KEYPOINT_INVALID_GEOMETRY: 'Đã thấy vùng thẻ nhưng góc hoặc hình học chưa đạt.',
  KEYPOINT_CONFIDENCE_REJECTED: 'Chưa xác định đủ tin cậy các góc thẻ.',
  CARD_RECTIFICATION_REJECTED: 'Vùng thẻ không đủ điều kiện nắn ảnh.',
  CARD_WARP_FAILED: 'Không thể nắn ảnh thẻ.',
  CARD_GEOMETRY_REJECTED: 'Thẻ có thể quá nhỏ hoặc nằm sát mép.',
  CARD_QUALITY_REJECTED: 'Ảnh thẻ không đạt kiểm tra chất lượng.',
};

const historyActionLabels: Record<string, string> = {
  CREATE: 'Tạo hồ sơ',
  LEGACY_BACKFILL: 'Đồng bộ hồ sơ đã xác minh',
  START_REVERIFICATION: 'Bắt đầu cập nhật giấy tờ',
  CANCEL_REVERIFICATION: 'Hủy cập nhật giấy tờ',
  ADD_CAPTURE: 'Thêm ảnh giấy tờ',
  REPLACE_CAPTURE: 'Thay ảnh giấy tờ',
  EXTRACT: 'Đọc thông tin tự động',
  CONFIRM_FIELDS: 'Xác nhận thông tin',
  SUBMIT: 'Nộp hồ sơ',
  RESUBMIT: 'Nộp bổ sung',
  IDENTITY_HOLD_APPLIED: 'Tạm giữ để kiểm tra danh tính',
  UNDER_REVIEW: 'Bắt đầu xét duyệt',
  APPROVED: 'Phê duyệt hồ sơ',
  REJECTED: 'Từ chối bản nộp',
  NEEDS_MORE_INFO: 'Yêu cầu bổ sung',
  REVOKED: 'Thu hồi xác minh',
  ADMIN_IDENTITY_OVERRIDE: 'Điều chỉnh ngoại lệ danh tính',
};
const restrictionLabels: Record<string, string> = {
  IDENTITY_UNDER_REVIEW: 'Hồ sơ có thay đổi cần đối chiếu danh tính. Quyền nhận chuyến tạm khóa cho đến khi admin kiểm tra xong.',
  CCCD_EXPIRED: 'CCCD đã hết hạn. Hãy cập nhật CCCD mới để tiếp tục nhận chuyến.',
  GPLX_EXPIRED: 'GPLX đã hết hạn. Hãy cập nhật GPLX mới để mở lại quyền nhận chuyến.',
  VERIFICATION_NOT_APPROVED: 'Hồ sơ đang chờ xét duyệt.',
};

function todayVnIso() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

const removeCache = removeCacheFile;

function operationKey() {
  return globalThis.crypto?.randomUUID?.() ?? (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
  );
}

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
  const [photos, setPhotos] = useState<SlotMap<Photo>>({});
  const livePhotos = useRef<SlotMap<Photo>>({});
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
  const [values, setValues] = useState<Fields>({});
  const [noExpiry, setNoExpiry] = useState(false);
  const [origins, setOrigins] = useState<Partial<Record<FieldKey, Choice>>>({});
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
  const pickerActive = useRef(false);
  const generation = useRef(0);
  const pendingRef = useRef<Pending | null>(null);
  const serverExtracted = useRef<SlotMap<{ uri: string; proposal: Extraction }>>({});
  const inspectedCapture = useRef<SlotMap<{ uri: string; proposal?: Extraction }>>({});

  const slot = slots[step];
  const photo = slot && photos[slot[0]];
  const choices = collectChoices(observations);
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

  const fieldLabelMap = useMemo(() => Object.fromEntries(fields) as Record<FieldKey, string>, []);

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
    if (abort) ocr.current?.abort();
    setObservations({});
    serverExtracted.current = {};
    inspectedCapture.current = {};
    setReadingNote('');
    const form = currentValues.current;
    const next = { ...form, origins: {}, values: { ...form.values } };
    for (const [key] of fields) {
      if (form.origins[key] && !touched.current.has(key)) {
        delete next.values[key];
        if (key === 'expiry_date') next.noExpiry = false;
      }
    }
    updateForm(next);
  }, [updateForm]);

  const reload = useCallback(async (signal: AbortSignal) => {
    const rows = await api.json<Application[]>('applications', { signal });
    if (!rows[0]) return null;
    const detail = await api.json<Application>(appPath(rows[0].id), { signal });
    if (!alive.current || signal.aborted) return null;
    if (current.current && detail.revision !== current.current.revision) {
      cancelReading(ocr.current?.signal !== signal);
      trackUploads({});
      setConfirm(false);
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
  }, [accept, api, cancelReading, setConfirm, trackUploads, updateForm]);

  const run = useCallback(async (label: string, action: (signal: AbortSignal) => Promise<unknown>) => {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(label);
    setMessage('');
    try { await action(controller.signal); }
    catch (error) {
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
        generation.current++;
      } else if (state === 'active' && backgrounded) {
        backgrounded = false;
        if (!pickerActive.current && !operation.current && !ocr.current) {
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
      listener.remove();
      notice.abort();
      Object.values(ownedPhotos.current).forEach(p => removeCache(p.uri));
      Object.values(ownedPreviews.current).forEach(p => removeCache(p.uri));
    };
  }, [api, reload, run]);

  // Validates one photo (from the guided camera or the gallery) and stores it as the slot's pending upload.
  function acceptAsset(key: SlotKey, asset: Picker.ImagePickerAsset) {
    if (!alive.current) { removeCache(asset.uri); return; }
    const file = new File(asset.uri);
    const size = asset.fileSize ?? file.size;
    const mime = asset.mimeType || file.type;
    if (!file.exists || !size || size > 8_000_000 || !Number.isFinite(asset.width)
      || !Number.isFinite(asset.height) || Math.min(asset.width, asset.height) < 2
      || Math.max(asset.width, asset.height) > 16384 || asset.width * asset.height > 40_000_000
      || !/^image\/(jpeg|png|webp)$/.test(mime)) {
      removeCache(asset.uri);
      throw new Error('Chọn hoặc chụp lại ảnh JPEG, PNG hoặc WebP hợp lệ, tối đa 8 MB và 40 MP.');
    }
    if (livePhotos.current[key]?.uri !== asset.uri) removeCache(livePhotos.current[key]?.uri ?? '');
    removeCache(livePreviews.current[key]?.uri ?? '');
    delete livePreviews.current[key];
    setPreviews({ ...livePreviews.current });
    trackUploads({ ...uploaded.current, [key]: undefined });
    livePhotos.current = { ...livePhotos.current, [key]: { ...asset, mimeType: mime } };
    setPhotos(livePhotos.current);
    setAck(old => ({ ...old, [key]: false }));
    setConfirm(false);
    cancelReading();
  }

  function openGuidedCapture(key: SlotKey) {
    if (pickerActive.current || locked || !canEdit || !slotAllowed(current.current, key)) return;
    setSettingsAction(false);
    setMessage('');
    setGuidedSlot(key);
  }

  function onGuidedCaptured(key: SlotKey, photo: CapturedPhoto) {
    setGuidedSlot(null);
    try {
      const inspected = inspectedCapture.current[key]?.uri === photo.uri ? inspectedCapture.current[key] : undefined;
      acceptAsset(key, {
        uri: photo.uri, width: photo.width, height: photo.height,
        fileSize: photo.fileSize ?? undefined, mimeType: photo.mimeType,
      });
      if (inspected) {
        trackUploads({ ...uploaded.current, [key]: photo.uri });
        if (inspected.proposal) {
          serverExtracted.current[key] = { uri: photo.uri, proposal: inspected.proposal };
        }
        inspectedCapture.current = { ...inspectedCapture.current, [key]: undefined };
      }
    } catch (error) {
      if (alive.current) setMessage(error instanceof Error ? error.message : 'Không dùng được ảnh này.');
    }
  }

  async function inspectCapturedWithServer(
    key: SlotKey,
    photo: CapturedPhoto,
    signal: AbortSignal,
  ): Promise<ServerInspectionResult> {
    let base = await loadOrCreate(signal);
    if (!slotAllowed(base, key)) {
      return { warnings: [], verified: false, note: 'Ảnh này không nằm trong mục cần bổ sung.' };
    }
    if (inspectedCapture.current[key]?.uri !== photo.uri) {
      const uploadedApp = await api.json<Application>(appPath(base.id) + '/captures/' + key + '?revision=' + base.revision, {
        method: 'PUT', body: new File(photo.uri), headers: { 'Content-Type': photo.mimeType }, signal,
      });
      ensureActive(signal);
      base = accept({
        ...uploadedApp,
        document: { ...base.document, captures: { ...base.document?.captures, [key]: { id: '', mime: photo.mimeType } } },
      });
      inspectedCapture.current = { ...inspectedCapture.current, [key]: { uri: photo.uri } };
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
        method: 'POST', ...jsonBody({ revision: base.revision }), signal, timeoutMs: 39000,
      });
      ensureActive(signal);
      accept(response);
      inspectedCapture.current = { ...inspectedCapture.current, [key]: { uri: photo.uri, proposal: response.proposal } };
      const combined = new Map<string, { code: string; message: string; severe?: boolean }>();
      for (const item of collectSlotWarnings(response.verificationWarnings)) combined.set(item.code, item);
      for (const rawCode of response.proposal.warnings) {
        if (!combined.has(rawCode) && warningLabels[rawCode]) {
          combined.set(rawCode, { code: rawCode, message: warningLabels[rawCode] });
        }
      }
      const list = [...combined.values()];
      return {
        warnings: list,
        verified: true,
        note: list.length
          ? 'Máy chủ/AI phát hiện vấn đề chất lượng trên ảnh.'
          : 'Đã đối chiếu qua máy chủ/AI (độ mờ, lóa, khung thẻ).',
      };
    } catch (error) {
      if (error instanceof VerificationError && ['ENGINE_TIMEOUT', 'ENGINE_BUSY'].includes(error.code)) {
        return {
          warnings: collectSlotWarnings(base.verificationWarnings),
          verified: false,
          note: 'Engine đọc ảnh đang bận hoặc quá thời gian. Bạn vẫn có thể dùng ảnh để nhập tay ở bước sau.',
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
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, exif: false });
      if (result.canceled || !result.assets[0]) return;
      acceptAsset(key, result.assets[0]);
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
    const result = found ?? await api.json<Application>('applications', { method: 'POST', signal });
    ensureActive(signal);
    if (!editable(result)) throw new VerificationError('INVALID_TRANSITION');
    return accept(result);
  }

  function applyConfirmedToForm(confirmed?: Record<string, unknown>) {
    if (!confirmed) return;
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
    Object.values(livePhotos.current).forEach(p => removeCache(p.uri));
    livePhotos.current = {};
    setPhotos({});
    trackUploads({});
    Object.values(livePreviews.current).forEach(p => removeCache(p.uri));
    livePreviews.current = {};
    setPreviews({});
    setConfirm(false);
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
    Object.values(livePhotos.current).forEach(p => removeCache(p.uri));
    livePhotos.current = {};
    setPhotos({});
    trackUploads({});
    Object.values(livePreviews.current).forEach(p => removeCache(p.uri));
    livePreviews.current = {};
    setPreviews({});
    setConfirm(false);
    applyConfirmedToForm(updated.document?.confirmed ?? updated.approvedDocument?.confirmed);
    accept(updated);
    setStage('PREPARE');
    setMessage('Đã hủy cập nhật và khôi phục trạng thái hồ sơ đã xác minh.');
  }

  function isIdentityLockedField(key: FieldKey, targetApp: Application | null) {
    if (!targetApp?.identityLocked) return false;
    if (key === 'cccd_id' && targetApp.lockedIdentity?.maskedCccdId) return true;
    if (key === 'cccd_name' && targetApp.lockedIdentity?.fullName) return true;
    if (key === 'cccd_dob' && targetApp.lockedIdentity?.dob) return true;
    return false;
  }

  async function upload(key: SlotKey, base: Application, signal: AbortSignal) {
    const selectedPhoto = livePhotos.current[key];
    if (!selectedPhoto || !slotAllowed(base, key) || uploaded.current[key] === selectedPhoto.uri) return base;
    if (isSmall(selectedPhoto) && !ack[key]) throw new Error('Hãy xem lại và xác nhận ảnh nhỏ trước khi tải lên.');
    const result = await api.json<Application>(appPath(base.id) + '/captures/' + key + '?revision=' + base.revision, {
      method: 'PUT', body: new File(selectedPhoto.uri), headers: { 'Content-Type': selectedPhoto.mimeType }, signal,
    });
    ensureActive(signal);
    if (livePhotos.current[key]?.uri !== selectedPhoto.uri) throw new VerificationError('CANCELLED');
    trackUploads({ ...uploaded.current, [key]: selectedPhoto.uri });
    return accept({
      ...result,
      document: { ...base.document, captures: { ...base.document?.captures, [key]: { id: '', mime: selectedPhoto.mimeType } } },
    });
  }

  async function checkFaceQuality(signal: AbortSignal) {
    if (!faceConsent || !faceNotice) return;
    setDraftFace(undefined);
    let base = await loadOrCreate(signal);
    for (const key of faceSlots) base = await upload(key, base, signal);
    const result = await api.json<DraftFaceQuality>(appPath(base.id) + '/face-quality', {
      method: 'POST', ...jsonBody({ revision: base.revision, faceConsentVersion: faceNotice }),
      signal, timeoutMs: 35_000,
    });
    ensureActive(signal);
    if (current.current?.id !== base.id || current.current.revision !== result.revision) return;
    setDraftFace(result);
  }

  function applyChoice(key: FieldKey, choice: Choice, user: boolean) {
    const form = currentValues.current;
    if (!fieldAllowed(current.current, key) || isIdentityLockedField(key, current.current)) return;
    if (user) touched.current.add(key);
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
    updateForm({
      values: { ...form.values, [key]: value }, noExpiry: unlimited ?? form.noExpiry,
      origins: { ...form.origins, [key]: undefined },
    });
    setConfirm(false);
  }

  async function readAutomatically() {
    if (ocr.current || operation.current || !consent || !canEdit) return;
    const controller = new AbortController();
    const signal = controller.signal;
    ocr.current = controller;
    setReading(true);
    setReadingNote('Đang tải ảnh và đọc thông tin từ giấy tờ…');
    const results: SlotMap<Extraction> = {};
    let failures = 0;
    let version: number | undefined;
    try {
      let base = await loadOrCreate(signal);
      version = generation.current;
      for (const [key] of slots) {
        if (key === 'selfie' || !slotAllowed(base, key) || (!livePhotos.current[key] && !base.document?.captures[key])) continue;
        const cached = serverExtracted.current[key];
        if (cached && livePhotos.current[key]?.uri === cached.uri) {
          results[key] = cached.proposal;
          continue;
        }
        base = await upload(key, base, signal);
        const expected = { generation: version, id: base.id, revision: base.revision };
        try {
          const response = await api.json<ProposalResponse>(appPath(base.id) + '/extract/' + key, {
            method: 'POST', ...jsonBody({ revision: base.revision }), signal, timeoutMs: 39000,
          });
          ensureActive(signal);
          if (!current.current || !sameExtractionGeneration(expected, { ...current.current, generation: generation.current })) return;
          results[key] = response.proposal;
          if (livePhotos.current[key]?.uri) {
            serverExtracted.current[key] = { uri: livePhotos.current[key]!.uri, proposal: response.proposal };
          }
          base = accept(response);
        } catch (error) {
          if (error instanceof VerificationError && ['ENGINE_TIMEOUT', 'ENGINE_BUSY'].includes(error.code)) {
            failures++;
          } else { throw error; }
        }
      }
      ensureActive(signal);
      if (version !== generation.current) return;
      setObservations(results);
      const form = currentValues.current;
      const proposals = collectChoices(results);
      const fill = autofillChoices(form.values, form.noExpiry, touched.current, proposals);
      for (const [key] of fields) if (fill[key]) applyChoice(key, fill[key], false);
      const any = Object.keys(proposals).length > 0;
      const hasWarn = Object.values(results).some(r => r.warnings.length);
      setReadingNote(failures
        ? 'Một số lượt đọc quá thời gian hoặc máy chủ đang bận. Bạn có thể bấm Tiếp tục để nhập tay.'
        : any
          ? (hasWarn ? 'Đã điền sẵn đề xuất. Một số mục cần bạn đối chiếu kỹ hơn.' : 'Đã đọc xong thông tin. Hãy bấm Tiếp tục để đối chiếu và xác nhận.')
          : 'Chưa đọc được thông tin từ ảnh. Bạn vẫn có thể bấm Tiếp tục để nhập tay.');
    } catch (error) {
      if (alive.current && !signal.aborted) {
        if (version === generation.current) setObservations(results);
        setReadingNote((error instanceof Error ? error.message : 'Chưa đọc được.') + ' Bạn vẫn có thể nhập tay ở bước sau.');
      }
    } finally {
      ocr.current = null;
      if (alive.current) {
        setReading(false);
        if (signal.aborted) setReadingNote('Lượt đọc đã dừng. Bạn có thể đọc lại hoặc nhập tay.');
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
      removeCache(file.uri);
      throw error;
    }
    removeCache(livePreviews.current[key]?.uri ?? '');
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
          if (key !== 'gplx_back' && !livePhotos.current[key] && !base.document?.captures[key]) {
            throw new Error('Còn thiếu ảnh bắt buộc.');
          }
        }
        for (const [key] of slots) base = await upload(key, base, signal);
        saved = await api.json<Application>(appPath(base.id) + '/confirmation', {
          method: 'PUT', ...jsonBody({ details, revision: base.revision }), signal,
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
        ...body, headers: { ...body.headers, 'Idempotency-Key': request.key }, method: 'POST', signal,
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
    Object.values(livePhotos.current).forEach(p => removeCache(p.uri));
    livePhotos.current = {};
    trackUploads({});
    setPhotos({});
    Object.values(livePreviews.current).forEach(p => removeCache(p.uri));
    livePreviews.current = {};
    setPreviews({});
    setMessage('Máy chủ đã nhận hồ sơ.');
    try { await reload(signal); } catch { /* A confirmed submission remains successful. */ }
  }

  function renderWarnings(items: VerificationWarning[]) {
    if (!items.length) return null;
    return items.map(warning => {
      const severe = warning.severity === 'CRITICAL' || warning.severity === 'BLOCKING';
      const boxBg = severe ? colors.errorContainer : colors.warningContainer;
      const boxFg = severe ? colors.onErrorContainer : colors.onWarningContainer;
      return (
        <View key={[warning.code, warning.slot, warning.fieldKey].join(':')}
          style={[styles.alertBox, { backgroundColor: boxBg }]} accessibilityRole="alert">
          <MaterialIcons name={severe ? 'error-outline' : 'warning-amber'} size={20} color={boxFg} importantForAccessibility="no" />
          <Text style={[styles.alertText, { color: boxFg }]}>
            {warning.humanReadableMessage} {warning.recommendedAction}
          </Text>
        </View>
      );
    });
  }

  function photoWarnings(key: SlotKey) {
    return renderWarnings(warnings.filter(warning =>
      warning.slot === key && !warning.fieldKey && (!photos[key] || uploadedPhotos[key] === photos[key]?.uri)));
  }

  function resolvedPhotoUri(key: SlotKey) {
    const saved = app?.document?.captures[key];
    const existing = saved && previews[key]?.id === saved.id ? previews[key]?.uri : undefined;
    return photos[key]?.uri ?? existing;
  }

  function renderPhoto(key: SlotKey, label: string, large = false) {
    const saved = app?.document?.captures[key];
    const uri = resolvedPhotoUri(key);
    if (uri) return <DriverPhoto uri={uri} label={label} portrait sensitive />;
    return (
      <View style={[styles.frame, large && styles.frameLarge, key === 'selfie' && styles.selfie]}>
        <Text style={styles.mutedText}>{saved ? 'Ảnh đã lưu trên máy chủ' : 'Chưa có ảnh'}</Text>
        {saved?.id ? <Button variant="secondary" label="Mở ảnh đã lưu" disabled={Boolean(busy)}
          onPress={() => void run('Đang mở ảnh…', signal => preview(key, signal))} /> : null}
      </View>
    );
  }

  function renderCompareImages(keys: readonly SlotKey[]) {
    const available = slots.filter(([k]) => keys.includes(k) && (photos[k] || app?.document?.captures[k]));
    if (!available.length) return <Text style={styles.mutedText}>Chưa có ảnh nào ở mục này để đối chiếu.</Text>;
    return (
      <View style={styles.compareStack}>
        {available.map(([k, label]) => (
          <View key={k} style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {renderPhoto(k, label)}
          </View>
        ))}
      </View>
    );
  }

  function jumpToFirstEditableSlot() {
    setStep(firstEditableStep);
    setStage('CAPTURE');
  }

  function renderFieldInput(key: FieldKey) {
    const label = fieldLabelMap[key];
    const identityLockedField = isIdentityLockedField(key, app);
    const fieldEditable = !locked && fieldAllowed(app, key) && !identityLockedField;
    const fieldWarnings = warnings.filter(warning => warning.fieldKey === key);
    const fieldChoices = identityLockedField ? [] : (choices[key] ?? []);
    const hasConflict = fieldChoices.length > 1 || fieldChoices.some(choice => choice.conflict);
    const missingRequired = !optionalFields.has(key)
      && !(key === 'expiry_date' && noExpiry)
      && !(values[key] ?? '').trim();
    const highlightBg = fieldWarnings.some(w => w.severity === 'CRITICAL' || w.severity === 'BLOCKING')
      ? colors.errorContainer
      : (hasConflict || missingRequired || fieldWarnings.length > 0)
        ? colors.warningContainer
        : identityLockedField
          ? colors.surfaceContainer
          : colors.surfaceContainerHigh;

    return (
      <View key={key} style={[styles.fieldCard, { backgroundColor: highlightBg }]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {renderWarnings(fieldWarnings)}
        {key === 'cccd_gender' ? (
          <View style={styles.chipRow}>
            <Button variant={values[key] === 'MALE' ? 'primary' : 'secondary'} label="Nam"
              disabled={!fieldEditable} onPress={() => manual(key, 'MALE')} />
            <Button variant={values[key] === 'FEMALE' ? 'primary' : 'secondary'} label="Nữ"
              disabled={!fieldEditable} onPress={() => manual(key, 'FEMALE')} />
            {values[key] ? <Button variant="ghost" label="Bỏ chọn"
              disabled={!fieldEditable} onPress={() => manual(key, '')} /> : null}
          </View>
        ) : (
          <TextInput
            accessibilityLabel={label}
            style={[styles.input, { backgroundColor: identityLockedField ? colors.surfaceContainerHigh : colors.cardSurface }]}
            value={values[key] ?? ''}
            keyboardType={key === 'cccd_id' ? 'number-pad' : 'default'}
            placeholder={key === 'expiry_date' && noExpiry ? 'Không thời hạn' : undefined}
            editable={fieldEditable && !(key === 'expiry_date' && noExpiry)}
            onChangeText={value => manual(key, value)}
          />
        )}
        {identityLockedField ? (
          <Text style={styles.mutedText}>Đã khóa theo danh tính đã xác minh (không thể tự ý thay đổi).</Text>
        ) : null}
        {missingRequired ? <Text style={[styles.hintText, { color: colors.onWarningContainer }]}>Trường bắt buộc — vui lòng kiểm tra hoặc nhập tay.</Text> : null}
        {origins[key] ? <Text style={styles.mutedText}>Nguồn đề xuất · {origins[key]?.sources.join(' / ')}</Text> : null}
        {hasConflict ? <Text style={[styles.hintText, { color: colors.onWarningContainer }]}>Có nhiều đề xuất hoặc mâu thuẫn QR/OCR. Hãy chọn đáp án đúng hoặc sửa tay.</Text> : null}
        {fieldChoices.map(choice => (
          <Button
            key={choice.noExpiry ? 'unlimited' : choice.value}
            variant="secondary"
            label={'Chọn: ' + choice.sources.join(' / ') + ' · ' + (choice.noExpiry ? 'Không thời hạn' : choice.value)}
            disabled={!fieldEditable}
            onPress={() => applyChoice(key, choice, true)}
          />
        ))}
        {key === 'expiry_date' ? (
          <View style={styles.row}>
            <Switch accessibilityLabel="GPLX không thời hạn" value={noExpiry}
              disabled={!fieldEditable}
              onValueChange={value => manual('expiry_date', value ? '' : values.expiry_date ?? '', value)} />
            <Text style={styles.flex}>
              {noExpiry ? 'GPLX không thời hạn' : values.expiry_date ? 'Có ngày hết hạn' : 'Chưa có hạn GPLX'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  const nameMismatch = !currentWarningReview && values.cccd_name && values.gplx_name
    ? compareNames(values.cccd_name, values.gplx_name) : null;
  const dobMismatch = !currentWarningReview && values.cccd_dob && values.gplx_dob
    && values.cccd_dob.trim() !== values.gplx_dob.trim();
  const ocrLockedCccdConflict = Boolean(
    app?.identityLocked &&
    values.cccd_id &&
    observations.cccd_front?.candidates?.some(
      item => item.fieldKey === 'id_number' && item.validationStatus === 'valid' &&
        typeof item.candidateValue === 'string' && item.candidateValue.trim() !== values.cccd_id?.trim(),
    ),
  );

  const readyCaptureCount = slots.filter(([k]) => k !== 'gplx_back' && (photos[k] || app?.document?.captures[k])).length;
  const hasVerifiedBaseline = Boolean(app && (app.status === 'APPROVED' || app.approvedRevision != null));
  const verifiedConfirmed = app?.approvedDocument?.confirmed ?? app?.document?.confirmed;
  const verifiedRawCccdId = typeof verifiedConfirmed?.cccd_id === 'string' ? verifiedConfirmed.cccd_id.trim() : '';
  const verifiedMaskedCccd = app?.lockedIdentity?.maskedCccdId
    ?? (verifiedRawCccdId.length >= 4 ? '*'.repeat(verifiedRawCccdId.length - 4) + verifiedRawCccdId.slice(-4) : 'Đã xác minh');
  const verifiedFullName = app?.lockedIdentity?.fullName
    ?? (typeof verifiedConfirmed?.cccd_name === 'string' ? verifiedConfirmed.cccd_name : '');
  const verifiedCccdExpiry = typeof verifiedConfirmed?.cccd_expiry_date === 'string' ? verifiedConfirmed.cccd_expiry_date : '';
  const todayIso = todayVnIso();
  const verifiedCccdExpired = Boolean(verifiedCccdExpiry && verifiedCccdExpiry < todayIso);
  const verifiedGplxClasses = Array.isArray(verifiedConfirmed?.gplx_classes)
    ? verifiedConfirmed.gplx_classes.join(', ')
    : (typeof verifiedConfirmed?.gplx_classes === 'string' ? verifiedConfirmed.gplx_classes : '—');
  const verifiedGplxExpiry = typeof verifiedConfirmed?.expiry_date === 'string' ? verifiedConfirmed.expiry_date : '';
  const verifiedGplxNoExpiry = verifiedConfirmed?.no_expiry === true;
  const verifiedGplxExpired = Boolean(!verifiedGplxNoExpiry && verifiedGplxExpiry && verifiedGplxExpiry < todayIso);
  const verifiedGplxValidity = verifiedGplxNoExpiry
    ? 'Không thời hạn'
    : verifiedGplxExpired
      ? 'Đã hết hạn (' + verifiedGplxExpiry + ')'
      : verifiedGplxExpiry
        ? 'Còn thời hạn (đến ' + verifiedGplxExpiry + ')'
        : 'Chưa rõ thời hạn';

  return (
    <DriverPage
      form
      title="Xác minh tài xế"
      backFallback="/(tabs)/profile"
      headerAction={(
        <Appbar.Action
          icon="refresh"
          style={styles.headerAction}
          disabled={Boolean(busy) || picking}
          accessibilityLabel="Làm mới trạng thái xác minh"
          onPress={() => { ocr.current?.abort(); void run('Đang làm mới…', reload); }}
        />
      )}
    >
      <View style={styles.page}>
        {app && !(hasVerifiedBaseline && !canEdit && !pending) ? (
          <Card style={styles.statusCard}>
            <Text style={styles.statusHeadline}>
              {app.status === 'DRAFT' && app.approvedRevision != null
                ? 'Đang cập nhật giấy tờ mới'
                : (statusLabels[app.status] ?? app.status)}
            </Text>
            {app.reason ? <Text style={styles.bodyText}>{app.reason}</Text> : null}
            {app.identityLocked ? (
              <View style={[styles.infoBanner, { backgroundColor: colors.surfaceContainerHigh }]}>
                <MaterialIcons name="lock-outline" size={20} color={colors.primary} importantForAccessibility="no" />
                <Text style={styles.flex}>
                  Thông tin định danh đã xác minh (số định danh, họ tên, ngày sinh) được khóa cố định. Bạn có thể chụp lại CCCD gia hạn, cập nhật GPLX hoặc selfie mới.
                </Text>
              </View>
            ) : null}
            {targetLabels.length ? (
              <View style={[styles.alertBox, { backgroundColor: colors.warningContainer }]}>
                <MaterialIcons name="edit-note" size={20} color={colors.onWarningContainer} importantForAccessibility="no" />
                <Text style={[styles.alertText, { color: colors.onWarningContainer }]}>Cần bổ sung · {targetLabels.join(', ')}</Text>
              </View>
            ) : null}
            {app.status === 'NEEDS_MORE_INFO' ? (
              <Button label={needsCapture ? 'Đi tới ảnh cần bổ sung' : 'Đi tới sửa thông tin'}
                onPress={() => {
                  setConsent(true);
                  if (needsCapture) jumpToFirstEditableSlot();
                  else setStage('CONFIRM_FIELDS');
                }} />
            ) : null}
            {app.status === 'DRAFT' && app.approvedRevision != null ? (
              <Button variant="ghost" label="Hủy cập nhật · Quay lại hồ sơ đã xác minh" disabled={Boolean(busy)}
                onPress={() => void run('Đang khôi phục trạng thái…', cancelReverify)} />
            ) : null}
          </Card>
        ) : null}

        {/* Màn hình Trạng thái Đã xác minh (Read-Only) */}
        {!canEdit && app && hasVerifiedBaseline && !pending ? (
          <View style={styles.sectionStack}>
            <Card style={styles.statusCard}>
              <View style={styles.verifiedHeaderRow}>
                <View style={styles.flex}>
                  <Text style={styles.statusHeadline}>Xác minh tài xế</Text>
                  <Text style={styles.mutedText}>
                    {app.identityHold
                      ? 'Tạm giữ để kiểm tra danh tính'
                      : app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
                        ? 'Đã xác minh · Đang chờ duyệt cập nhật mới'
                        : 'Đã xác minh'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: app.identityHold ? colors.errorContainer : colors.primaryContainer },
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: app.identityHold ? colors.onErrorContainer : colors.onPrimaryContainer },
                  ]}>
                    {app.identityHold ? 'Chờ kiểm tra' : 'Đã xác minh'}
                  </Text>
                </View>
              </View>

              {app.eligibilityStatus?.restrictionReason ? (
                <View style={[styles.alertBox, { backgroundColor: colors.errorContainer }]}>
                  <MaterialIcons name="error-outline" size={20} color={colors.onErrorContainer} importantForAccessibility="no" />
                  <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>
                    {restrictionLabels[app.eligibilityStatus.restrictionReason] ?? app.identityHoldReason ?? 'Quyền nhận chuyến tạm thời bị hạn chế.'}
                  </Text>
                </View>
              ) : null}

              {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && !app.identityHold ? (
                <View style={[styles.infoBanner, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <MaterialIcons name="hourglass-top" size={20} color={colors.primary} importantForAccessibility="no" />
                  <Text style={styles.flex}>
                    Bản cập nhật giấy tờ mới đang chờ admin xét duyệt. Quyền nhận chuyến từ giấy tờ cũ còn hạn vẫn được giữ nguyên.
                  </Text>
                </View>
              ) : null}

              {app.status === 'REJECTED' && !app.identityHold ? (
                <View style={[styles.alertBox, { backgroundColor: colors.warningContainer }]}>
                  <MaterialIcons name="info-outline" size={20} color={colors.onWarningContainer} importantForAccessibility="no" />
                  <Text style={[styles.alertText, { color: colors.onWarningContainer }]}>
                    Lần cập nhật gần nhất chưa được duyệt{app.reason ? ': ' + app.reason : '.'} Hồ sơ đã xác minh trước đó vẫn còn hiệu lực.
                  </Text>
                </View>
              ) : null}

              {/* Thẻ Căn cước công dân */}
              <View style={[styles.verifiedTile, { backgroundColor: verifiedCccdExpired ? colors.errorContainer : colors.surfaceContainerHigh }]}>
                <View style={styles.verifiedTileTop}>
                  <Text style={styles.fieldLabel}>Căn cước công dân</Text>
                  <Text style={[
                    styles.verifiedPillText,
                    { color: verifiedCccdExpired ? colors.onErrorContainer : colors.primary },
                  ]}>
                    {verifiedCccdExpired ? 'Đã hết hạn' : 'Đã xác minh'}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>Số định danh: {verifiedMaskedCccd}</Text>
                {verifiedFullName ? <Text style={styles.mutedText}>Họ tên: {verifiedFullName}</Text> : null}
                {verifiedCccdExpiry ? <Text style={styles.mutedText}>Có giá trị đến: {verifiedCccdExpiry}</Text> : null}
              </View>

              {/* Thẻ Giấy phép lái xe */}
              <View style={[styles.verifiedTile, { backgroundColor: verifiedGplxExpired ? colors.errorContainer : colors.surfaceContainerHigh }]}>
                <View style={styles.verifiedTileTop}>
                  <Text style={styles.fieldLabel}>Giấy phép lái xe</Text>
                  <Text style={[
                    styles.verifiedPillText,
                    { color: verifiedGplxExpired ? colors.onErrorContainer : colors.primary },
                  ]}>
                    {verifiedGplxExpired ? 'Đã hết hạn' : 'Đã xác minh'}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>Hạng {verifiedGplxClasses} · {verifiedGplxValidity}</Text>
              </View>

              {/* Thẻ Ảnh chân dung */}
              <View style={[styles.verifiedTile, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View style={styles.verifiedTileTop}>
                  <Text style={styles.fieldLabel}>Ảnh chân dung</Text>
                  <Text style={[styles.verifiedPillText, { color: colors.primary }]}>Đã xác minh</Text>
                </View>
                <Text style={styles.bodyText}>Đã được admin kiểm tra</Text>
              </View>

              <Text style={styles.mutedText}>
                Thông tin định danh đã xác minh không thể tự ý thay đổi.
              </Text>

              <View style={styles.buttonStack}>
                <Button
                  variant={app.status === 'APPROVED' ? 'primary' : 'secondary'}
                  label="Chọn loại xe nhận lái hộ"
                  onPress={() => router.push('/profile/capabilities')}
                />
                {app.status === 'APPROVED' || app.status === 'REJECTED' ? (
                  <Button
                    variant={app.status === 'APPROVED' ? 'secondary' : 'primary'}
                    label="Cập nhật giấy tờ"
                    disabled={Boolean(busy)}
                    onPress={() => void run('Đang mở cập nhật giấy tờ…', startReverify)}
                  />
                ) : null}
              </View>
            </Card>

            <GroupedList title="Tra cứu hồ sơ">
              <SettingsListItem
                title={showHistory ? 'Ẩn lịch sử xác minh' : 'Xem lịch sử xác minh'}
                description={app.history?.length ? `${app.history.length} bản ghi cập nhật` : 'Chưa có lịch sử cập nhật'}
                icon={showHistory ? 'expand-less' : 'history'}
                onPress={() => setShowHistory(v => !v)}
              />
            </GroupedList>

            {showHistory ? (
              <Card>
                <View style={styles.sectionStack}>
                  <Text style={styles.sectionTitle}>Lịch sử xác minh</Text>
                  {app.history?.length ? app.history.map((entry, idx) => (
                    <View key={entry.revision + ':' + entry.action + ':' + idx}
                      style={[styles.verifiedTile, { backgroundColor: colors.surfaceContainerHigh }]}>
                      <Text style={styles.fieldLabel}>
                        {historyActionLabels[entry.action] ?? entry.action} · Bản {entry.revision}
                      </Text>
                      <Text style={styles.mutedText}>
                        {new Date(entry.at).toLocaleString('vi-VN')} · {entry.role === 'admin' ? 'Quản trị viên' : 'Tài xế'}
                      </Text>
                      {entry.metadata?.reason ? <Text style={styles.bodyText}>Lý do: {entry.metadata.reason}</Text> : null}
                    </View>
                  )) : <Text style={styles.mutedText}>Chưa có lịch sử cập nhật.</Text>}
                </View>
              </Card>
            ) : null}
          </View>
        ) : null}

        {busy || message ? (
          <View style={[styles.infoBanner, { backgroundColor: colors.surfaceContainerHigh }]}>
            {busy ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            <Text style={styles.flex} accessibilityLiveRegion="polite">{busy || message}</Text>
          </View>
        ) : null}

        {settingsAction ? (
          <Button variant="secondary" label="Mở cài đặt quyền camera" onPress={() => {
            void Linking.openSettings().catch(() => setMessage('Không mở được cài đặt trên thiết bị này.'));
          }} />
        ) : null}

        {pending ? (
          <Button label="Thử nộp lại" disabled={Boolean(busy)} onPress={() => void run('Đang kiểm tra lần nộp…', submit)} />
        ) : null}

        {/* Bước 6: Theo dõi xét duyệt khi chưa từng duyệt xong */}
        {!canEdit && app && !pending && !hasVerifiedBaseline ? (
          <View style={styles.sectionStack}>
            {renderWarnings(warnings)}
            <Card>
              <Text style={styles.sectionTitle}>Ảnh và thông tin đã nộp</Text>
              {slots.filter(([key]) => app.document?.captures[key]).map(([key, label]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  {renderPhoto(key, label)}
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {/* Luồng chính 5 bước trong ứng dụng */}
        {canEdit ? (
          <View style={styles.sectionStack}>
            <Card style={styles.progressCard}>
              <Text style={[styles.stepBadge, { color: colors.primary }]}>{stageLabels[stage]}</Text>
              <ProgressBar
                color={colors.primary}
                style={{ backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.full }}
                progress={
                  stage === 'PREPARE' ? 0.15
                    : stage === 'CAPTURE' ? 0.2 + ((step + 1) / slots.length) * 0.35
                    : stage === 'OCR' ? 0.65
                    : stage === 'CONFIRM_FIELDS' ? 0.85
                    : 1
                }
              />
            </Card>

            {/* BƯỚC 1: Chuẩn bị giấy tờ và đồng ý xử lý ảnh */}
            {stage === 'PREPARE' ? (
              <Card>
                <View style={styles.sectionStack}>
                  <Text style={styles.title}>Chuẩn bị giấy tờ trước khi bắt đầu</Text>
                  <Text style={styles.bodyText}>Để quá trình xét duyệt nhanh chóng, hãy chuẩn bị sẵn:</Text>
                  <View style={[styles.prepItem, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <MaterialIcons name="badge" size={22} color={colors.primary} importantForAccessibility="no" />
                    <Text style={styles.flex}>Căn cước công dân (mặt trước và mặt sau rõ chữ, còn hạn).</Text>
                  </View>
                  <View style={[styles.prepItem, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <MaterialIcons name="fact-check" size={22} color={colors.primary} importantForAccessibility="no" />
                    <Text style={styles.flex}>Giấy phép lái xe (mặt trước bắt buộc, mặt sau tùy chọn).</Text>
                  </View>
                  <View style={[styles.prepItem, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <MaterialIcons name="face" size={22} color={colors.primary} importantForAccessibility="no" />
                    <Text style={styles.flex}>Ảnh chân dung (selfie) chụp rõ khuôn mặt ở nơi đủ sáng.</Text>
                  </View>

                  <View style={[styles.row, styles.consentBox, { backgroundColor: colors.surfaceContainer }]}>
                    <Switch accessibilityLabel="Đồng ý tải ảnh để xác minh" value={consent}
                      disabled={locked || reading}
                      onValueChange={value => { setConsent(value); setConfirm(false); }} />
                    <Text style={styles.flex}>
                      Tôi đồng ý tải ảnh giấy tờ và selfie để đối chiếu thông tin và xét duyệt hồ sơ tài xế.
                    </Text>
                  </View>

                  <Button label="Bắt đầu chụp ảnh" disabled={locked || !consent} onPress={jumpToFirstEditableSlot} />
                  {app?.status === 'NEEDS_MORE_INFO' && !needsCapture ? (
                    <Button variant="secondary" label="Đi thẳng tới sửa thông tin" disabled={locked || !consent}
                      onPress={() => setStage('CONFIRM_FIELDS')} />
                  ) : null}
                </View>
              </Card>
            ) : null}

            {/* BƯỚC 2: Chụp từng ảnh theo thứ tự cố định */}
            {stage === 'CAPTURE' && slot ? (
              <Card>
                <View style={styles.sectionStack}>
                  <Text style={styles.title}>{step + 1}/{slots.length} · {slot[1]}</Text>
                  <Text style={styles.bodyText}>{captureInstructions[slot[0]]}</Text>
                  {renderPhoto(slot[0], slot[1], true)}
                  {photoWarnings(slot[0])}
                  {photo && isSmall(photo) ? (
                    <View style={[styles.row, styles.consentBox, { backgroundColor: colors.warningContainer }]}>
                      <Switch accessibilityLabel="Xác nhận ảnh nhỏ" value={Boolean(ack[slot[0]])}
                        disabled={locked}
                        onValueChange={value => setAck(old => ({ ...old, [slot[0]]: value }))} />
                      <Text style={[styles.flex, { color: colors.onWarningContainer }]}>
                        Ảnh có độ phân giải nhỏ. Tôi đã kiểm tra chữ hoặc khuôn mặt vẫn rõ.
                      </Text>
                    </View>
                  ) : null}
                  {!slotAllowed(app, slot[0]) ? (
                    <Text style={styles.mutedText}>Ảnh này không nằm trong danh sách cần bổ sung lần này.</Text>
                  ) : null}
                  <Button label={photos[slot[0]] || app?.document?.captures[slot[0]] ? 'Chụp lại bằng camera' : 'Mở camera hướng dẫn'}
                    disabled={locked || !slotAllowed(app, slot[0])} onPress={() => openGuidedCapture(slot[0])} />
                  {slot[0] !== 'selfie' ? (
                    <Button variant="secondary" label="Chọn ảnh từ thư viện"
                      disabled={locked || !slotAllowed(app, slot[0])} onPress={() => void pickFromGallery(slot[0])} />
                  ) : (
                    <Text style={styles.mutedText}>Selfie nên chụp trực tiếp để ảnh phản ánh đúng thời điểm xác minh.</Text>
                  )}
                  <View style={styles.buttonStack}>
                    <Button
                      label={step + 1 < slots.length
                        ? (slot[0] === 'gplx_back' && !photos[slot[0]] && !app?.document?.captures[slot[0]]
                          ? 'Tiếp tục (tùy chọn)' : 'Tiếp tục')
                        : 'Xong ảnh · Đọc thông tin'}
                      disabled={locked
                        || (!photos[slot[0]] && slot[0] !== 'gplx_back' && !app?.document?.captures[slot[0]])
                        || Boolean(photo && isSmall(photo) && !ack[slot[0]])}
                      onPress={() => {
                        if (step + 1 < slots.length) setStep(step + 1);
                        else setStage('OCR');
                      }}
                    />
                    <Button variant="ghost" label="Quay lại" disabled={locked}
                      onPress={() => { if (step === 0) setStage('PREPARE'); else setStep(step - 1); }} />
                  </View>
                </View>
              </Card>
            ) : null}

            {/* BƯỚC 3: Đọc thông tin tự động */}
            {stage === 'OCR' ? (
              <Card>
                <View style={styles.sectionStack}>
                  <Text style={styles.title}>Đọc thông tin từ giấy tờ</Text>
                  <Text style={styles.bodyText}>
                    Hệ thống sẽ đọc mã QR và chữ trên ảnh CCCD, GPLX đã chụp để điền sẵn giúp bạn. Nếu máy chủ bận hoặc ảnh khó đọc, bạn luôn có thể chọn nhập tay.
                  </Text>
                  <Text style={styles.mutedText}>Đã chuẩn bị {readyCaptureCount}/4 ảnh bắt buộc.</Text>

                  <View style={styles.chipRow}>
                    {slots.filter(([k]) => photos[k] || app?.document?.captures[k]).map(([k, label], _idx) => (
                      <Button key={k} variant="ghost" label={'Chụp lại ' + label}
                        disabled={locked || reading || !slotAllowed(app, k)}
                        onPress={() => { setStep(slots.findIndex(([item]) => item === k)); setStage('CAPTURE'); }} />
                    ))}
                  </View>

                  <Button
                    label={reading ? 'Đang đọc thông tin…' : 'Đọc thông tin tự động'}
                    disabled={locked || reading || Boolean(targets && targets.captures.every(key => key === 'selfie'))}
                    onPress={() => void readAutomatically()}
                  />

                  {reading || readingNote ? (
                    <View style={[styles.infoBanner, { backgroundColor: colors.surfaceContainerHigh }]}>
                      {reading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                      <Text style={styles.flex} accessibilityLiveRegion="polite">{readingNote || 'Đang xử lý…'}</Text>
                    </View>
                  ) : null}

                  {slots.map(([key, label]) => {
                    const result = observations[key];
                    if (!result) return null;
                    const msgs = result.warnings.map(code => warningLabels[code]).filter(Boolean);
                    if (result.ocrStatus === 'OCR_UNSUPPORTED') msgs.push('Mặt này chưa hỗ trợ OCR.');
                    if (!msgs.length) return null;
                    return (
                      <View key={key} style={[styles.alertBox, { backgroundColor: colors.warningContainer }]}>
                        <Text style={[styles.alertText, { color: colors.onWarningContainer }]}>
                          {label} · {[...new Set(msgs)].join(' ')}
                        </Text>
                      </View>
                    );
                  })}

                  {ocrLockedCccdConflict ? (
                    <View style={[styles.alertBox, { backgroundColor: colors.errorContainer }]}>
                      <MaterialIcons name="error-outline" size={20} color={colors.onErrorContainer} importantForAccessibility="no" />
                      <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>
                        Số CCCD đọc từ ảnh mới khác với danh tính đã xác minh của tài khoản. Không thể sử dụng CCCD của người khác.
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.buttonStack}>
                    <Button label={Object.keys(observations).length ? 'Tiếp tục đối chiếu' : 'Nhập tay thông tin'}
                      disabled={locked || reading}
                      onPress={() => setStage('CONFIRM_FIELDS')} />
                    <Button variant="ghost" label="Quay lại chụp ảnh" disabled={locked || reading}
                      onPress={() => { setStep(slots.length - 1); setStage('CAPTURE'); }} />
                  </View>
                </View>
              </Card>
            ) : null}

            {/* BƯỚC 4: Xác nhận thông tin chia 2 phần CCCD & GPLX */}
            {stage === 'CONFIRM_FIELDS' ? (
              <View style={styles.sectionStack}>
                <Card>
                  <View style={styles.sectionStack}>
                    <Text style={styles.sectionTitle}>1. Thông tin Căn cước công dân (CCCD)</Text>
                    <Button variant="secondary"
                      label={compareGroup === 'CCCD' ? 'Ẩn ảnh CCCD' : 'Mở ảnh CCCD để đối chiếu'}
                      onPress={() => setCompareGroup(compareGroup === 'CCCD' ? null : 'CCCD')} />
                    {compareGroup === 'CCCD' ? renderCompareImages(['cccd_front', 'cccd_back']) : null}
                    {cccdFieldKeys.map(renderFieldInput)}
                  </View>
                </Card>

                <Card>
                  <View style={styles.sectionStack}>
                    <Text style={styles.sectionTitle}>2. Thông tin Giấy phép lái xe (GPLX)</Text>
                    <Text style={styles.mutedText}>
                      Thông tin GPLX dùng để quản trị viên xét quyền lái từng nhóm xe. Sau khi được duyệt, bạn sẽ chọn loại xe muốn nhận chuyến ở bước riêng.
                    </Text>
                    <Button variant="secondary"
                      label={compareGroup === 'GPLX' ? 'Ẩn ảnh GPLX' : 'Mở ảnh GPLX để đối chiếu'}
                      onPress={() => setCompareGroup(compareGroup === 'GPLX' ? null : 'GPLX')} />
                    {compareGroup === 'GPLX' ? renderCompareImages(['gplx_front', 'gplx_back']) : null}
                    {gplxFieldKeys.map(renderFieldInput)}
                  </View>
                </Card>

                {nameMismatch && nameMismatch !== 'EXACT_MATCH' ? (
                  <View style={[styles.alertBox, { backgroundColor: colors.warningContainer }]}>
                    <MaterialIcons name="warning-amber" size={20} color={colors.onWarningContainer} importantForAccessibility="no" />
                    <Text style={[styles.alertText, { color: colors.onWarningContainer }]}>
                      {nameMismatch === 'DIACRITIC_MISMATCH'
                        ? 'Họ tên khác dấu giữa CCCD và GPLX. Hãy đối chiếu lại.'
                        : 'Họ tên khác nhau giữa CCCD và GPLX. Hãy đối chiếu lại.'}
                    </Text>
                  </View>
                ) : null}

                {dobMismatch ? (
                  <View style={[styles.alertBox, { backgroundColor: colors.errorContainer }]}>
                    <MaterialIcons name="error-outline" size={20} color={colors.onErrorContainer} importantForAccessibility="no" />
                    <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>Ngày sinh giữa CCCD và GPLX không trùng khớp.</Text>
                  </View>
                ) : null}

                {ocrLockedCccdConflict ? (
                  <View style={[styles.alertBox, { backgroundColor: colors.errorContainer }]}>
                    <MaterialIcons name="error-outline" size={20} color={colors.onErrorContainer} importantForAccessibility="no" />
                    <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>
                      Ảnh CCCD vừa quét có số định danh khác với tài khoản đã xác minh. Thông tin định danh cố định đã được giữ nguyên.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.buttonStack}>
                  <Button label="Xem tổng hợp" disabled={locked} onPress={() => setStage('SUMMARY')} />
                  <Button variant="ghost" label="Quay lại bước đọc" disabled={locked} onPress={() => setStage('OCR')} />
                </View>
              </View>
            ) : null}

            {/* BƯỚC 5: Xem tổng hợp và nộp */}
            {stage === 'SUMMARY' ? (
              <Card>
                <View style={styles.sectionStack}>
                  <Text style={styles.title}>Kiểm tra tổng hợp trước khi nộp</Text>

                  <Text style={styles.sectionTitle}>Ảnh giấy tờ đã chuẩn bị</Text>
                  <View style={styles.compareStack}>
                    {slots.filter(([key]) => photos[key] || app?.document?.captures[key]).map(([key, label]) => (
                      <View key={key} style={styles.field}>
                        <Text style={styles.fieldLabel}>{label}</Text>
                        {renderPhoto(key, label)}
                        {photoWarnings(key)}
                        {photos[key] && isSmall(photos[key]!) ? <Text style={styles.mutedText}>Ảnh nhỏ · đã xác nhận.</Text> : null}
                        <Button variant="ghost" label={'Sửa ảnh ' + label} disabled={locked || !slotAllowed(app, key)}
                          onPress={() => { setStep(slots.findIndex(([item]) => item === key)); setStage('CAPTURE'); setConfirm(false); }} />
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Thông tin CCCD & GPLX</Text>
                  <View style={[styles.summaryList, { backgroundColor: colors.surfaceContainerHigh }]}>
                    {fields.map(([key, label]) => (
                      <View key={key} style={styles.summaryRow}>
                        <Text style={styles.mutedText}>{label}</Text>
                        <Text style={styles.summaryValue}>
                          {key === 'expiry_date' && noExpiry
                            ? 'Không thời hạn'
                            : key === 'cccd_gender'
                              ? (values[key] === 'MALE' ? 'Nam' : values[key] === 'FEMALE' ? 'Nữ' : '—')
                              : (values[key]?.trim() || '—')}
                        </Text>
                      </View>
                    ))}
                    <Button variant="ghost" label="Sửa thông tin" disabled={locked} onPress={() => setStage('CONFIRM_FIELDS')} />
                  </View>

                  {renderWarnings(warnings)}

                  {faceNotice ? (
                    <View style={[styles.row, styles.consentBox, { backgroundColor: colors.surfaceContainer }]}>
                      <Switch accessibilityLabel="Đồng ý đối chiếu khuôn mặt thử nghiệm"
                        value={faceConsent} onValueChange={value => { setFaceConsent(value); setDraftFace(undefined); setConfirm(false); }}
                        disabled={locked || reading} />
                      <Text style={styles.flex}>
                        Tôi đồng ý kiểm tra chất lượng ảnh trong bản nháp nếu chủ động yêu cầu và cho admin đối chiếu ảnh CCCD, GPLX và selfie của bản nộp này.
                        Tùy chọn này không ảnh hưởng khả năng nộp hồ sơ.
                      </Text>
                    </View>
                  ) : null}

                  {faceNotice && faceConsent ? (
                    <View style={styles.field}>
                      <Button variant="secondary" label="Kiểm tra chất lượng ảnh chân dung" disabled={locked || reading}
                        onPress={() => void run('Đang kiểm tra chất lượng ảnh…', checkFaceQuality)} />
                      {liveFace ? (
                        <Text accessibilityLiveRegion="polite">
                          {liveFace.status === 'NOT_EVALUATED'
                            ? 'Chưa đánh giá được ảnh. Bạn vẫn có thể gửi để admin xem thủ công.'
                            : 'Đã kiểm tra chất lượng ảnh. Bạn có thể chụp lại theo cảnh báo hoặc gửi để admin xem thủ công.'}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={[styles.row, styles.consentBox, { backgroundColor: colors.surfaceContainer }]}>
                    <Switch accessibilityLabel="Xác nhận ảnh và thông tin" value={confirm}
                      onValueChange={setConfirm} disabled={locked || reading} />
                    <Text style={styles.flex}>Tôi đã đối chiếu đầy đủ ảnh và thông tin, và đồng ý nộp hồ sơ.</Text>
                  </View>

                  {currentWarningReview ? (
                    <View style={[styles.row, styles.consentBox, { backgroundColor: colors.warningContainer }]}>
                      <Switch accessibilityLabel="Xác nhận đã xem cảnh báo" value={currentWarningReview.acknowledged}
                        disabled={locked || reading}
                        onValueChange={acknowledged => setWarningReview({ revision: currentWarningReview.revision, acknowledged })} />
                      <Text style={[styles.flex, { color: colors.onWarningContainer }]}>
                        Tôi đã xem cảnh báo của bản hồ sơ này và muốn tiếp tục.
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.buttonStack}>
                    <Button
                      label={!currentWarningReview && warnings.some(warning => warning.requiresReview)
                        ? 'Kiểm tra cảnh báo' : app?.status === 'NEEDS_MORE_INFO' ? 'Nộp bổ sung' : 'Nộp hồ sơ'}
                      disabled={locked || reading || !confirm || Boolean(currentWarningReview && !currentWarningReview.acknowledged)}
                      onPress={() => void run('Đang nộp hồ sơ…', submit)}
                    />
                    <Button variant="ghost" label="Sửa thông tin" disabled={locked} onPress={() => setStage('CONFIRM_FIELDS')} />
                  </View>
                </View>
              </Card>
            ) : null}
          </View>
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
          onInspectServer={consent ? (photo, signal) => inspectCapturedWithServer(guidedSlot, photo, signal) : undefined}
          onCapture={photo => onGuidedCaptured(guidedSlot, photo)}
          onClose={() => setGuidedSlot(null)}
        />
      ) : null}
    </DriverPage>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { gap: spacing.spaceMd, paddingBottom: spacing.spaceXl },
  headerAction: { width: 48, height: 48, borderRadius: 24 },
  statusCard: { gap: spacing.px3 },
  statusHeadline: { ...typography.sectionTitle, color: colors.onSurface },
  progressCard: { gap: spacing.spaceSm },
  stepBadge: { ...typography.label },
  title: { ...typography.screenTitle, color: colors.onSurface },
  sectionTitle: { ...typography.sectionTitle, color: colors.onSurface },
  bodyText: { ...typography.body, color: colors.onSurface },
  mutedText: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
  fieldLabel: { ...typography.label, color: colors.onSurface },
  hintText: { ...typography.caption },
  input: { borderRadius: spacing.spaceMd, paddingHorizontal: spacing.px3, paddingVertical: spacing.px3 },
  frame: {
    backgroundColor: colors.surfaceContainerHigh, borderRadius: spacing.spaceMd, minHeight: 140,
    padding: spacing.px3, justifyContent: 'center', alignItems: 'center', gap: spacing.spaceSm, overflow: 'hidden',
  },
  frameLarge: { width: 210, maxWidth: '100%', aspectRatio: 3 / 4, alignSelf: 'center' },
  selfie: { borderRadius: borderRadius.sheet },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.spaceSm },
  field: { gap: spacing.spaceSm },
  fieldCard: { padding: spacing.px3, borderRadius: spacing.spaceMd, gap: spacing.spaceSm },
  compareStack: { gap: spacing.px3 },
  sectionStack: { gap: spacing.px3 },
  buttonStack: { gap: spacing.spaceSm },
  prepItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.px3, padding: spacing.px3, borderRadius: spacing.spaceMd },
  consentBox: { padding: spacing.px3, borderRadius: spacing.spaceMd },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.spaceSm, padding: spacing.px3, borderRadius: spacing.spaceMd },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.spaceSm, padding: spacing.px3, borderRadius: spacing.spaceMd },
  alertText: { ...typography.label, flex: 1 },
  summaryList: { padding: spacing.px3, borderRadius: spacing.spaceMd, gap: spacing.spaceSm },
  summaryRow: { gap: spacing.xxs },
  summaryValue: { ...typography.cardTitle, color: colors.onSurface },
  verifiedHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.px3 },
  statusBadge: { paddingHorizontal: spacing.px3, paddingVertical: spacing.py1_5, borderRadius: borderRadius.full },
  statusBadgeText: { ...typography.badge },
  verifiedTile: { padding: spacing.spaceMd, borderRadius: spacing.spaceMd, gap: spacing.spaceXs },
  verifiedTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.spaceSm },
  verifiedPillText: { ...typography.badge },
  flex: { flex: 1 },
});

