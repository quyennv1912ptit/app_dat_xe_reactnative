export type FormatMoneyOptions = {
  locale?: string;
  signed?: boolean;
  nonBreaking?: boolean;
};

export const formatMoney = (value: number, options?: FormatMoneyOptions | string) => {
  const opts: FormatMoneyOptions = typeof options === 'string' ? { locale: options } : (options ?? {});
  if (!Number.isFinite(value)) return '—';
  const rounded = Object.is(Math.round(value), -0) ? 0 : Math.round(value);
  const absFormatted = new Intl.NumberFormat(opts.locale ?? 'vi-VN', { maximumFractionDigits: 0 }).format(Math.abs(rounded));
  const prefix = rounded < 0 ? '-' : opts.signed && rounded > 0 ? '+' : '';
  const unitSeparator = opts.nonBreaking ? '\u00A0' : ' ';
  return `${prefix}${absFormatted}${unitSeparator}đ`;
};
export const formatDate = (value: string | Date) => new Date(value).toLocaleString('vi-VN');
export const formatDistance = (km: number, locale = 'vi-VN') => `${km.toLocaleString(locale, { maximumFractionDigits: 1 })} km`;
