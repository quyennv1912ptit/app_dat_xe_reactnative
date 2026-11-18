export const slots = [
  ['cccd_front', 'CCCD trước'], ['cccd_back', 'CCCD sau'],
  ['gplx_front', 'GPLX trước'], ['gplx_back', 'GPLX sau (tùy chọn)'], ['selfie', 'Selfie'],
] as const;
export const fields = [
  ['cccd_name', 'Họ tên CCCD'], ['cccd_id', 'Số định danh (12 chữ số)'],
  ['cccd_expiry_date', 'Hạn CCCD (YYYY-MM-DD, nếu có)'],
  ['cccd_dob', 'Ngày sinh CCCD (YYYY-MM-DD)'], ['cccd_gender', 'Giới tính CCCD (tùy chọn)'], ['gplx_number', 'Số GPLX'],
  ['gplx_name', 'Họ tên GPLX'], ['gplx_dob', 'Ngày sinh GPLX (YYYY-MM-DD)'],
  ['gplx_classes', 'Hạng GPLX (cách nhau bằng dấu phẩy)'], ['expiry_date', 'Hạn GPLX (YYYY-MM-DD)'],
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
export type Extraction = {
  qrStatus: string;
  ocrStatus: string;
  warnings: string[];
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
export type Choice = { value: string; noExpiry?: boolean; conflict?: boolean; sources: Source[] };
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

export function collectChoices(observations: Partial<Record<SlotKey, Extraction>>): Choices {
  const result: Choices = {};
  for (const [slot, observation] of Object.entries(observations)) {
    for (const item of observation.candidates) {
      if (item.parseStatus !== 'parsed' || item.validationStatus !== 'valid'
        || (item.source !== 'QR' && item.source !== 'OCR')
        || slot !== (item.sourceDocument + '_' + item.sourceSide).toLowerCase()) continue;
      const key = (item.sourceDocument === 'CCCD' ? cccdKeys : gplxKeys)[item.fieldKey];
      if (!key || !fields.some(([field]) => field === key)) continue;
      const value = candidateValue(key, item.candidateValue);
      if (!value) continue;
      const options = (result[key] ??= []);
      const existing = options.find(option =>
        option.noExpiry === value.noExpiry
        && (key === 'cccd_name' || key === 'gplx_name'
          ? compareNames(option.value, value.value) === 'EXACT_MATCH' : option.value === value.value));
      if (!existing) options.push({ ...value, sources: [item.source], conflict: item.conflict });
      else {
        existing.conflict ||= item.conflict;
        if (!existing.sources.includes(item.source)) existing.sources.push(item.source);
      }
    }
  }
  return result;
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
