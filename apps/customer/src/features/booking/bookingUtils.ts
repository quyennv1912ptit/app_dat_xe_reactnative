import type { CustomerVoucher, RideCoordinates, RideEstimate, RideEstimateRequest } from '@datxe/shared';
import type { BookingPlace } from './types';

export const DEFAULT_MAP_CENTER: RideCoordinates = { lat: 10.7769, lng: 106.7009 };
export const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
export function isCoordinate(point: RideCoordinates): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
}
export function parsePlaces(raw: unknown): BookingPlace[] {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const features = (data as { features?: unknown[] } | null)?.features ?? [];
  return features.flatMap(value => {
    const feature = value as { id?: string; text?: string; place_name?: string; geometry?: { coordinates?: number[] } };
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    const address = feature.place_name?.trim();
    if (!address || !isCoordinate({ lat, lng })) return [];
    return [{ id: feature.id ?? `${lng},${lat}`, name: feature.text?.trim() || address.split(',')[0], address, coordinate: { lat, lng } }];
  });
}
export function estimateRequest(pickup: BookingPlace | null, dropoff: BookingPlace | null, vehicleId: number | null, scheduledAt: string | null, voucherCode = ''): RideEstimateRequest {
  if (!pickup || !dropoff || !vehicleId || !isCoordinate(pickup.coordinate) || !isCoordinate(dropoff.coordinate)) throw new Error('Hãy chọn đủ điểm đón, điểm đến và phương tiện.');
  if (pickup.address.length > 255 || dropoff.address.length > 255) throw new Error('Địa chỉ quá dài. Hãy chọn địa chỉ cụ thể ngắn hơn.');
  if (Math.abs(pickup.coordinate.lat - dropoff.coordinate.lat) < 0.00001 && Math.abs(pickup.coordinate.lng - dropoff.coordinate.lng) < 0.00001) throw new Error('Điểm đón và điểm đến cần khác nhau.');
  return { vehicleId, pickupAddress: pickup.address, pickupLat: pickup.coordinate.lat, pickupLng: pickup.coordinate.lng, dropoffAddress: dropoff.address, dropoffLat: dropoff.coordinate.lat, dropoffLng: dropoff.coordinate.lng, scheduledAt, voucher_code: voucherCode || null };
}
export function voucherUnavailable(voucher: CustomerVoucher, subtotal: number | undefined, now = Date.now()): string | null {
  if (Date.parse(voucher.validFrom) > now) return 'Chưa đến thời gian áp dụng';
  if (Date.parse(voucher.validTo) <= now) return 'Ưu đãi đã hết hạn';
  if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) return 'Đã hết lượt sử dụng';
  if (subtotal !== undefined && subtotal < voucher.minimumOrderAmount) return `Áp dụng từ ${money(voucher.minimumOrderAmount)}`;
  return null;
}
export function minimumFareAdjustment(quote: RideEstimate): number {
  return Math.max(0, quote.estimatedFare - quote.baseFare - quote.distanceFare - quote.waitingFare - quote.nightSurcharge - quote.returnFee);
}
