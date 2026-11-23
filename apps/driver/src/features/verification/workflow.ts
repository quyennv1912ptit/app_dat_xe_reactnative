export const slots = [
  ['cccd_front', 'CCCD trước'], ['cccd_back', 'CCCD sau'],
  ['gplx_front', 'GPLX trước'], ['gplx_back', 'GPLX sau'], ['selfie', 'Selfie'],
] as const;
export const fields = [
  ['cccd_name', 'Họ tên CCCD'], ['cccd_id', 'Số định danh (12 chữ số)'],
  ['cccd_expiry_date', 'Hạn CCCD (nếu có)'],
  ['cccd_dob', 'Ngày sinh CCCD'], ['cccd_gender', 'Giới tính CCCD (tùy chọn)'], ['gplx_number', 'Số GPLX'],
  ['gplx_name', 'Họ tên GPLX'], ['gplx_dob', 'Ngày sinh GPLX'],
  ['gplx_classes', 'Hạng GPLX (cách nhau bằng dấu phẩy)'], ['expiry_date', 'Hạn GPLX'],
] as const;
export type Fields = Partial<Record<(typeof fields)[number][0], string>>;

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function confirmedDetails(values: Fields, noExpiry: boolean) {
  const details = Object.fromEntries(fields.map(([key]) => [key, values[key]?.trim() ?? '']));
  const classes = [...new Set((details.gplx_classes ?? '').toUpperCase().split(/[,;\s]+/).filter(Boolean))];
  if (fields.some(([key]) => key !== 'cccd_gender' && key !== 'cccd_expiry_date' && !(key === 'expiry_date' && noExpiry) && !details[key])
    || !/^\d{12}$/.test(details.cccd_id ?? '') || (details.gplx_number?.length ?? 0) > 30
    || (details.cccd_name?.length ?? 0) > 150 || (details.gplx_name?.length ?? 0) > 150
    || !['', 'MALE', 'FEMALE'].includes(details.cccd_gender)
    || !validDate(details.cccd_dob ?? '') || !validDate(details.gplx_dob ?? '')
    || (Boolean(details.cccd_expiry_date) && !validDate(details.cccd_expiry_date))
    || (!noExpiry && !validDate(details.expiry_date ?? ''))
    || !classes.length || classes.length > 20 || classes.some(value => !/^[A-Z0-9]{1,8}$/.test(value))) {
    throw new Error('Kiểm tra lại các trường bắt buộc, định dạng ngày, số định danh và hạng GPLX.');
  }
  return { ...details, cccd_expiry_date: details.cccd_expiry_date || null, gplx_classes: classes, no_expiry: noExpiry, expiry_date: noExpiry ? null : details.expiry_date };
}

export function compareNames(a: string, b: string) {
  const normalize = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  const first = normalize(a), second = normalize(b);
  if (first === second) return 'EXACT_MATCH';
  const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
  return fold(first) === fold(second) ? 'DIACRITIC_MISMATCH' : 'NAME_MISMATCH';
}

export type SlotKey = (typeof slots)[number][0];
export type FieldKey = (typeof fields)[number][0];
export type Source = 'QR' | 'OCR';
export type ProposalOrigin = 'QR_IMAGE' | 'QR_LIVE_SCAN' | 'OCR';
export type QrStatus =
  | 'NOT_FOUND'
  | 'DETECTED_UNREADABLE'
  | 'DECODED_VALID'
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_FORMAT'
  | 'CONFLICT'
  | 'ENGINE_UNAVAILABLE';
export type QrSource = 'QR_IMAGE' | 'QR_LIVE_SCAN';
export type QrDocumentSide = 'FRONT' | 'BACK' | 'UNKNOWN';
export type QrDocumentType = 'CCCD' | 'GPLX';
export type QrCardVariant = 'CCCD_2021' | 'CAN_CUOC_2024' | 'GPLX_PET' | 'UNKNOWN';
export type QrCrossValidationStatus = 'MATCHED' | 'CONFLICT' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';
export type QrExtractionResult = {
  status: QrStatus;
  source: QrSource;
  documentSide: QrDocumentSide;
  cardVariant?: QrCardVariant | null;
  fields?: Record<string, unknown>;
  missingFields?: string[];
  conflictFields?: string[];
  warnings?: string[];
  crossValidationStatus?: QrCrossValidationStatus;
  attachmentId?: string | null;
  revision?: number | null;
  boundToCapture?: boolean;
};
export type Extraction = {
  qrStatus: string;
  ocrStatus: string;
  qr?: QrExtractionResult | null;
  warnings: string[];
  conflictFields?: string[];
  candidates: {
    fieldKey: string;
    candidateValue?: unknown;
    source: Source;
    sourceDocument: 'CCCD' | 'GPLX';
    sourceSide: 'FRONT' | 'BACK';
    parseStatus: string;
    validationStatus: string;
    conflict: boolean;
  }[];
};
export type Choice = {
  value: string;
  noExpiry?: boolean;
  conflict?: boolean;
  sources: Source[];
  origins?: ProposalOrigin[];
};
export type Choices = Partial<Record<FieldKey, Choice[]>>;

const cccdKeys: Readonly<Record<string, FieldKey>> = {
  full_name: 'cccd_name', id_number: 'cccd_id', dob: 'cccd_dob', gender: 'cccd_gender', expiry: 'cccd_expiry_date',
};
const gplxKeys: Readonly<Record<string, FieldKey>> = {
  full_name: 'gplx_name', id_number: 'gplx_number', dob: 'gplx_dob',
  vehicle_class: 'gplx_classes', expiry: 'expiry_date',
};

function candidateValue(key: FieldKey, input: unknown): Omit<Choice, 'sources'> | undefined {
  if (key === 'cccd_expiry_date') {
    if (typeof input === 'string' && validDate(input)) return { value: input };
    if (input && typeof input === 'object' && 'no_expiry' in input && input.no_expiry === false
      && 'expiry_date' in input && typeof input.expiry_date === 'string' && validDate(input.expiry_date)) {
      return { value: input.expiry_date };
    }
    return;
  }
  if (key === 'expiry_date') {
    if (typeof input === 'string' && validDate(input)) return { value: input, noExpiry: false };
    if (!input || typeof input !== 'object' || !('no_expiry' in input) || !('expiry_date' in input)) return;
    if (input.no_expiry === true && input.expiry_date === null) return { value: '', noExpiry: true };
    if (input.no_expiry === false && typeof input.expiry_date === 'string' && validDate(input.expiry_date)) {
      return { value: input.expiry_date, noExpiry: false };
    }
    return;
  }
  if (key === 'gplx_classes') {
    if (!Array.isArray(input) || !input.length || input.length > 20
      || input.some(value => typeof value !== 'string' || !/^[A-Z0-9]{1,8}$/.test(value))) return;
    return { value: [...new Set(input)].sort().join(', ') };
  }
  if (typeof input !== 'string') return;
  const value = input.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!value || value.length > 150) return;
  if (key === 'cccd_gender' && !['MALE', 'FEMALE'].includes(value)) return;
  if (key === 'cccd_id' && !/^\d{12}$/.test(value)) return;
  if (key === 'gplx_number' && value.length > 30) return;
  if ((key === 'cccd_dob' || key === 'gplx_dob') && !validDate(value)) return;
  return { value };
}

function pushChoiceOption(
  result: Choices,
  key: FieldKey,
  value: Omit<Choice, 'sources' | 'origins'>,
  source: Source,
  origin: ProposalOrigin,
  conflict: boolean,
) {
  const options = (result[key] ??= []);
  const existing = options.find(option =>
    option.noExpiry === value.noExpiry
    && (key === 'cccd_name' || key === 'gplx_name'
      ? compareNames(option.value, value.value) === 'EXACT_MATCH' : option.value === value.value));
  if (!existing) {
    options.push({ ...value, sources: [source], origins: [origin], conflict });
    return;
  }
  existing.conflict ||= conflict;
  if (!existing.sources.includes(source)) existing.sources.push(source);
  const origins = (existing.origins ??= [source === 'QR' ? 'QR_IMAGE' : 'OCR']);
  if (!origins.includes(origin)) origins.push(origin);
}

function appendLiveQrChoices(
  result: Choices,
  liveQr: QrExtractionResult | null | undefined,
  keyMap: Readonly<Record<string, FieldKey>>,
) {
  if (!liveQr || (liveQr.status !== 'DECODED_VALID' && liveQr.status !== 'CONFLICT') || !liveQr.fields) {
    return;
  }
  const liveConflicts = liveQr.conflictFields ?? [];
  for (const [rawKey, rawValue] of Object.entries(liveQr.fields)) {
    const key = keyMap[rawKey];
    if (!key || !fields.some(([field]) => field === key)) continue;
    const value = candidateValue(key, rawValue);
    if (!value) continue;
    const hasConflict = liveConflicts.includes(rawKey);
    pushChoiceOption(result, key, value, 'QR', 'QR_LIVE_SCAN', hasConflict);
  }
}

export function collectChoices(
  observations: Partial<Record<SlotKey, Extraction>>,
  liveQr?: QrExtractionResult | null,
  gplxLiveQr?: QrExtractionResult | null,
): Choices {
  const result: Choices = {};
  for (const [slot, observation] of Object.entries(observations)) {
    const slotQrConflicts = observation.qr?.conflictFields ?? [];
    for (const item of observation.candidates) {
      if (item.parseStatus !== 'parsed' || item.validationStatus !== 'valid'
        || (item.source !== 'QR' && item.source !== 'OCR')
        || slot !== (item.sourceDocument + '_' + item.sourceSide).toLowerCase()) continue;
      const key = (item.sourceDocument === 'CCCD' ? cccdKeys : gplxKeys)[item.fieldKey];
      if (!key || !fields.some(([field]) => field === key)) continue;
      const value = candidateValue(key, item.candidateValue);
      if (!value) continue;
      const origin: ProposalOrigin = item.source === 'QR' ? 'QR_IMAGE' : 'OCR';
      const hasConflict = Boolean(item.conflict || (item.source === 'QR' && slotQrConflicts.includes(item.fieldKey)));
      pushChoiceOption(result, key, value, item.source, origin, hasConflict);
    }
  }
  appendLiveQrChoices(result, liveQr, cccdKeys);
  appendLiveQrChoices(result, gplxLiveQr, gplxKeys);
  return result;
}

const originLabels: Record<ProposalOrigin, string> = {
  QR_IMAGE: 'Đọc từ QR trên ảnh',
  QR_LIVE_SCAN: 'Đọc từ quét QR trực tiếp',
  OCR: 'Đọc từ ảnh',
};

export function formatOriginLabel(
  choice?: Choice | null,
  options?: { touched?: boolean; locked?: boolean },
): string {
  if (options?.locked) return 'Đã khóa theo danh tính đã xác minh';
  if (options?.touched || !choice) return 'Tài xế nhập';
  const origins: ProposalOrigin[] = choice.origins?.length
    ? choice.origins
    : choice.sources.map(source => (source === 'QR' ? 'QR_IMAGE' : 'OCR'));
  return [...new Set(origins)].map(origin => originLabels[origin]).join(' · ');
}

export type QrPromptMode =
  | 'SKIP_DECODED'
  | 'LIVE_SCANNED'
  | 'RECOMMEND_LIVE_SCAN'
  | 'ALLOW_LIVE_SCAN'
  | 'NO_QR_CARD'
  | 'SERVER_FALLBACK';

export type QrPromptDecision = {
  mode: QrPromptMode;
  shouldOffer: boolean;
  recommended: boolean;
  defaultSide: QrDocumentSide;
  expectedVariant: QrCardVariant | null;
};

export function qrScanDecision(
  observations: Partial<Record<SlotKey, Extraction>>,
  options?: {
    documentType?: QrDocumentType;
    liveQr?: QrExtractionResult | null;
    extractFailed?: boolean;
    cardHasQrExpected?: boolean;
  },
): QrPromptDecision {
  const docType: QrDocumentType = options?.documentType === 'GPLX' ? 'GPLX' : 'CCCD';
  const defaultSideFallback: QrDocumentSide = docType === 'GPLX' ? 'BACK' : 'FRONT';
  const liveQr = options?.liveQr;
  if (liveQr && (liveQr.status === 'DECODED_VALID' || liveQr.status === 'CONFLICT')) {
    return {
      mode: 'LIVE_SCANNED',
      shouldOffer: true,
      recommended: false,
      defaultSide: liveQr.documentSide === 'BACK' ? 'BACK' : liveQr.documentSide === 'FRONT' ? 'FRONT' : defaultSideFallback,
      expectedVariant: liveQr.cardVariant ?? (docType === 'GPLX' ? 'GPLX_PET' : null),
    };
  }
  const frontObs = docType === 'GPLX' ? observations.gplx_front : observations.cccd_front;
  const backObs = docType === 'GPLX' ? observations.gplx_back : observations.cccd_back;
  const frontQr = frontObs?.qr;
  const backQr = backObs?.qr;
  const frontStatus = frontQr?.status ?? frontObs?.qrStatus;
  const backStatus = backQr?.status ?? backObs?.qrStatus;

  if (frontStatus === 'DECODED_VALID' || backStatus === 'DECODED_VALID'
    || frontStatus === 'CONFLICT' || backStatus === 'CONFLICT') {
    const side: QrDocumentSide = (backStatus === 'DECODED_VALID' || backStatus === 'CONFLICT') ? 'BACK' : 'FRONT';
    const variant = (side === 'BACK' ? backQr?.cardVariant : frontQr?.cardVariant)
      ?? frontQr?.cardVariant ?? backQr?.cardVariant ?? (docType === 'GPLX' ? 'GPLX_PET' : null);
    return {
      mode: 'SKIP_DECODED',
      shouldOffer: false,
      recommended: false,
      defaultSide: side,
      expectedVariant: variant,
    };
  }

  if (frontStatus === 'DETECTED_UNREADABLE' || backStatus === 'DETECTED_UNREADABLE') {
    const side: QrDocumentSide = backStatus === 'DETECTED_UNREADABLE' ? 'BACK' : 'FRONT';
    const variant = (side === 'BACK' ? backQr?.cardVariant : frontQr?.cardVariant)
      ?? (docType === 'GPLX' ? 'GPLX_PET' : null);
    return {
      mode: 'RECOMMEND_LIVE_SCAN',
      shouldOffer: true,
      recommended: true,
      defaultSide: side,
      expectedVariant: variant,
    };
  }

  if (options?.extractFailed || frontStatus === 'ENGINE_UNAVAILABLE' || backStatus === 'ENGINE_UNAVAILABLE') {
    return {
      mode: 'SERVER_FALLBACK',
      shouldOffer: true,
      recommended: false,
      defaultSide: defaultSideFallback,
      expectedVariant: docType === 'GPLX' ? 'GPLX_PET' : null,
    };
  }

  if (options?.cardHasQrExpected === false) {
    return {
      mode: 'NO_QR_CARD',
      shouldOffer: false,
      recommended: false,
      defaultSide: defaultSideFallback,
      expectedVariant: null,
    };
  }

  if (frontStatus === 'NOT_FOUND' || backStatus === 'NOT_FOUND'
    || frontStatus === 'INVALID_FORMAT' || backStatus === 'INVALID_FORMAT'
    || frontStatus === 'UNSUPPORTED_FORMAT' || backStatus === 'UNSUPPORTED_FORMAT') {
    if (docType === 'GPLX') {
      return {
        mode: 'ALLOW_LIVE_SCAN',
        shouldOffer: true,
        recommended: false,
        defaultSide: 'BACK',
        expectedVariant: backQr?.cardVariant ?? frontQr?.cardVariant ?? 'GPLX_PET',
      };
    }
    const variant = backQr?.cardVariant === 'CAN_CUOC_2024'
      ? 'CAN_CUOC_2024'
      : frontQr?.cardVariant === 'CCCD_2021'
        ? 'CCCD_2021'
        : (backQr?.cardVariant ?? frontQr?.cardVariant ?? null);
    return {
      mode: 'ALLOW_LIVE_SCAN',
      shouldOffer: true,
      recommended: false,
      defaultSide: variant === 'CAN_CUOC_2024' ? 'BACK' : 'FRONT',
      expectedVariant: variant,
    };
  }

  return {
    mode: 'ALLOW_LIVE_SCAN',
    shouldOffer: false,
    recommended: false,
    defaultSide: defaultSideFallback,
    expectedVariant: docType === 'GPLX' ? 'GPLX_PET' : null,
  };
}

export function autofillChoices(
  values: Fields, noExpiry: boolean, touched: ReadonlySet<FieldKey>, choices: Choices,
) {
  const filled: Partial<Record<FieldKey, Choice>> = {};
  for (const [key] of fields) {
    const options = choices[key] ?? [];
    if (options.length === 1 && !options[0].conflict && !touched.has(key) && !values[key]?.trim()
      && !(key === 'expiry_date' && noExpiry)) filled[key] = options[0];
  }
  return filled;
}

export function warningReviewForRevision(
  revision: number | undefined,
  review: { revision: number; acknowledged: boolean } | undefined,
) {
  return review && review.revision === revision ? review : undefined;
}

export function sameExtractionGeneration(
  started: { generation: number; id: string; revision: number },
  current: { generation: number; id: string; revision: number },
) {
  return started.generation === current.generation && started.id === current.id
    && started.revision === current.revision;
}
