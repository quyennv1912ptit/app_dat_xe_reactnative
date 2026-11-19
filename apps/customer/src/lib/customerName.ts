import { getAvatarInitials, getCleanDisplayName, getLocale } from '@datxe/shared';

export function getCustomerDisplayName(value: string | null | undefined): string {
  return getCleanDisplayName(value);
}

export function getCustomerInitials(value: string | null | undefined): string {
  return getAvatarInitials(value, 'K', getLocale());
}
