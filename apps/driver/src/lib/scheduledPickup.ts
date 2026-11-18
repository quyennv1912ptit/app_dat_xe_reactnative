import { getLocale, translate } from '@datxe/shared';

export function formatScheduledPickup(scheduledAt?: string | null): string | null {
  if (!scheduledAt) return null;
  const pickup = new Date(scheduledAt);
  if (!Number.isFinite(pickup.getTime())) return null;

  const date = pickup.toLocaleString(getLocale(), {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return translate('Hẹn đón {0} (giờ Việt Nam)', { '0': date });
}
