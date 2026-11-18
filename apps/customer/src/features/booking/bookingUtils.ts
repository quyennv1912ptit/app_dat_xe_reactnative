import { formatMoney, getLocale, translate as i18nT } from '@datxe/shared';
import type { CustomerVehicle, CustomerRideDetail, CustomerVoucher, CustomerVoucherCampaign, PaymentMethod, RideCoordinates, RideEstimate, RideEstimateRequest } from '@datxe/shared';
import type { BookingPlace } from './types';

export const DEFAULT_MAP_CENTER: RideCoordinates = { lat: 21.0285, lng: 105.8542 };

const vietnamTimeZone = 'Asia/Ho_Chi_Minh';
const minute = 60_000;
const slotInterval = 30 * minute;
const scheduleDateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: vietnamTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});
const scheduleClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: vietnamTimeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const scheduleShortDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: vietnamTimeZone, day: '2-digit', month: '2-digit',
});

export type SchedulePickerSession = { referenceTime: number; expired: boolean };

/** Các mốc đặt trước 30 phút, bắt đầu từ mốc kế tiếp sau ít nhất 15 phút. */
export function buildScheduleSlots(now = Date.now(), count = 48): string[] {
  const first = Math.ceil((now + 15 * minute) / slotInterval) * slotInterval;
  return Array.from({ length: count }, (_, index) => new Date(first + index * slotInterval).toISOString());
}

export function createScheduleSlots(now: number): string[] {
  return buildScheduleSlots(now, 48);
}

export function scheduleDayKey(time: string | number): string {
  return scheduleDateKey.format(typeof time === 'string' ? Date.parse(time) : time);
}

export function groupScheduleSlots(slots: readonly string[], now: number) {
  const today = scheduleDayKey(now);
  const tomorrow = scheduleDayKey(now + 24 * 60 * minute);
  const date = new Intl.DateTimeFormat(getLocale(), {
    timeZone: vietnamTimeZone, weekday: 'short', day: '2-digit', month: '2-digit',
  });
  const days = new Map<string, { key: string; label: string; slots: string[] }>();
  for (const slot of slots) {
    const key = scheduleDayKey(slot);
    const day = days.get(key);
    if (day) day.slots.push(slot);
    else days.set(key, {
      key,
      label: key === today ? i18nT('Hôm nay') : key === tomorrow ? i18nT('Ngày mai') : date.format(Date.parse(slot)),
      slots: [slot],
    });
  }
  return [...days.values()];
}

export const formatScheduleTime = (slot: string) => scheduleClock.format(Date.parse(slot));

export function formatScheduledPickup(slot: string): string {
  return `${formatScheduleTime(slot)} · ${scheduleShortDate.format(Date.parse(slot))}`;
}
export function activeRideDestination(ride: Pick<CustomerRideDetail, 'id' | 'status'>) {
  return {
    pathname: ride.status === 'PENDING' || ride.status === 'SEARCHING'
      ? '/ride/find-driver' as const : '/ride/tracking' as const,
    params: { rideId: String(ride.id) },
  };
}

export const money = (value: number) => formatMoney(value, { locale: getLocale(), nonBreaking: true });
export function isCoordinate(point: RideCoordinates): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
}
export function estimateRequest(
  pickup: BookingPlace | null,
  dropoff: BookingPlace | null,
  vehicleId: number | null,
  scheduledAt: string | null,
  voucherCode = '',
  voucherId: number | null = null,
  paymentMethod?: PaymentMethod,
): RideEstimateRequest {
  if (!pickup || !dropoff || !vehicleId || !isCoordinate(pickup.coordinate) || !isCoordinate(dropoff.coordinate)) throw new Error(i18nT("Hãy chọn đủ điểm đón, điểm đến và phương tiện."));
  if (pickup.address.length > 255 || dropoff.address.length > 255) throw new Error(i18nT("Địa chỉ quá dài. Hãy chọn địa chỉ cụ thể ngắn hơn."));
  if (Math.abs(pickup.coordinate.lat - dropoff.coordinate.lat) < 0.00001 && Math.abs(pickup.coordinate.lng - dropoff.coordinate.lng) < 0.00001) throw new Error(i18nT("Điểm đón và điểm đến cần khác nhau."));
  return {
    vehicleId,
    pickupAddress: pickup.address,
    pickupLat: pickup.coordinate.lat,
    pickupLng: pickup.coordinate.lng,
    dropoffAddress: dropoff.address,
    dropoffLat: dropoff.coordinate.lat,
    dropoffLng: dropoff.coordinate.lng,
    scheduledAt,
    voucher_code: voucherCode || null,
    ...(voucherId != null ? { voucher_id: voucherId } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
  };
}

export function voucherDisplayName(
  voucher: Pick<CustomerVoucher, 'code' | 'campaignTitle' | 'description' | 'milestone'>,
): string {
  const code = voucher.code?.trim();
  if (code) return code;
  const title = voucher.campaignTitle?.trim();
  if (title) return title;
  if (voucher.milestone && voucher.milestone > 0) {
    return i18nT("Ưu đãi mốc {0} chuyến", { "0": voucher.milestone });
  }
  const desc = voucher.description?.trim();
  return desc || i18nT("Ưu đãi cá nhân");
}

export function isVoucherSelected(
  voucher: Pick<CustomerVoucher, 'id' | 'code'>,
  selectedCode: string,
  selectedId?: number | null,
): boolean {
  if (selectedId != null) return voucher.id === selectedId;
  return Boolean(selectedCode && voucher.code === selectedCode);
}
export function voucherUnavailable(voucher: CustomerVoucher, subtotal: number | undefined, now = Date.now()): string | null {
  if (Date.parse(voucher.validFrom) > now) return i18nT("Chưa đến thời gian áp dụng");
  if (Date.parse(voucher.validTo) <= now) return i18nT("Ưu đãi đã hết hạn");
  if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) return i18nT("Đã hết lượt sử dụng");
  if (subtotal !== undefined && subtotal < voucher.minimumOrderAmount) return i18nT("Áp dụng từ {0}", {"0": money(voucher.minimumOrderAmount)});
  return null;
}
export function campaignClaimBlocked(campaign: CustomerVoucherCampaign, now = Date.now()): string | null {
  if (Date.parse(campaign.validTo) <= now) return i18nT("Ưu đãi đã hết hạn");
  if (campaign.claimedCount >= campaign.claimLimit) return i18nT("Đã hết lượt nhận");
  if (campaign.budgetRemaining <= 0) return i18nT("Đã hết ngân sách ưu đãi");
  return null;
}
export function minimumFareAdjustment(quote: RideEstimate): number {
  return Math.max(0, quote.estimatedFare - quote.baseFare - quote.distanceFare - quote.waitingFare - quote.nightSurcharge - quote.returnFee);
}

/** Khoảng cách ngắn trong danh sách địa điểm: dưới 1km hiển thị mét. */
export function formatDistanceMeters(meters?: number | null): string {
  if (meters == null || !Number.isFinite(meters) || meters < 0) return '';
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
}

/** Goong trả cả địa chỉ dài; dòng tiêu đề chỉ lấy phần trước dấu phẩy. */
export function placeTitle(address: string): string {
  const first = address.split(',')[0]?.trim();
  return first && first.length >= 2 ? first : address.trim();
}

export function distanceMetersBetween(a: RideCoordinates, b: RideCoordinates): number {
  const radians = Math.PI / 180;
  const haversine = Math.sin((b.lat - a.lat) * radians / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians)
    * Math.sin((b.lng - a.lng) * radians / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - Math.min(1, haversine)));
}

const paramText = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

/** Đọc địa điểm đã chọn từ params của Expo Router (dùng chung cho bản đồ và chi tiết). */
export function bookingPlaceFromParams(
  params: Record<string, string | string[] | undefined>,
): BookingPlace | null {
  const rawLat = paramText(params.lat)?.trim();
  const rawLng = paramText(params.lng)?.trim();
  if (!rawLat || !rawLng) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isCoordinate({ lat, lng })) return null;
  const address = (paramText(params.address) ?? '').trim();
  if (!address) return null;
  const name = (paramText(params.name) ?? '').trim() || placeTitle(address);
  return {
    id: (paramText(params.id) ?? '').trim() || `pin:${lng},${lat}`,
    name,
    address,
    coordinate: { lat, lng },
    provider: 'goong',
  };
}


export function selectBookingVehicle(vehicles: CustomerVehicle[] | undefined, selectedId?: number | null) {
  if (selectedId != null) return vehicles?.find(vehicle => vehicle.id === selectedId);
  return vehicles?.find(vehicle => vehicle.is_default) ?? vehicles?.[0];
}
