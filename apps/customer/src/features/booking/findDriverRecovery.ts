import type { CustomerRideDetail } from "@datxe/shared";
import { isCoordinate, placeTitle } from "./bookingUtils";
import type { BookedDraftSnapshot, PaymentChoice } from "./store";
import type { BookingPlace } from "./types";

function placeFromRideEndpoint(
  address: string | null | undefined,
  point: { lat: number | null; lng: number | null },
  fallbackName: string,
): BookingPlace | null {
  if (point.lat == null || point.lng == null) return null;
  const coordinate = { lat: point.lat, lng: point.lng };
  if (!isCoordinate(coordinate)) return null;
  const cleanAddress = address?.trim() || fallbackName;
  return {
    id: `ride:${coordinate.lng},${coordinate.lat}`,
    name: placeTitle(cleanAddress) || fallbackName,
    address: cleanAddress,
    coordinate,
    provider: "goong",
  };
}

export type RestoredRetryDraft = {
  snapshot: BookedDraftSnapshot;
  scheduleExpired: boolean;
  previousPayableFare: number;
};

/**
 * Khôi phục thông tin chuyến đã đặt từ draft gần nhất hoặc dữ liệu ride từ backend,
 * tuyệt đối không tái sử dụng routeQuoteId hay giá báo cũ.
 */
export function buildRestoredDraftFromRide(
  ride: CustomerRideDetail,
  lastBookedDraft: BookedDraftSnapshot | null,
  now = Date.now(),
): RestoredRetryDraft | null {
  const sameContext = Boolean(lastBookedDraft && lastBookedDraft.vehicleId === ride.vehicleId);
  const pickup =
    (sameContext ? lastBookedDraft?.pickup : null) ??
    placeFromRideEndpoint(ride.pickupAddress, ride.pickup, "Điểm đón");
  const dropoff =
    (sameContext ? lastBookedDraft?.dropoff : null) ??
    placeFromRideEndpoint(ride.dropoffAddress, ride.dropoff, "Điểm đến");
  if (!pickup || !dropoff || !ride.vehicleId) return null;

  const rawSchedule = ride.scheduledAt ?? (sameContext ? lastBookedDraft?.scheduledAt : null) ?? null;
  const scheduleMs = rawSchedule ? Date.parse(rawSchedule) : NaN;
  const scheduleExpired = Boolean(rawSchedule && (!Number.isFinite(scheduleMs) || scheduleMs <= now));
  const scheduledAt = scheduleExpired ? null : rawSchedule;

  const paymentMethod: PaymentChoice =
    ride.paymentMethod === "WALLET" || ride.paymentMethod === "CASH"
      ? ride.paymentMethod
      : sameContext && lastBookedDraft?.paymentMethod
        ? lastBookedDraft.paymentMethod
        : "CASH";

  const previousPayableFare =
    sameContext && lastBookedDraft?.payableFare != null
      ? lastBookedDraft.payableFare
      : ride.payment?.amount ?? Math.max(0, ride.estimatedFare - (ride.discountAmount ?? 0));

  return {
    snapshot: {
      pickup,
      dropoff,
      vehicleId: ride.vehicleId,
      voucherCode: sameContext ? lastBookedDraft?.voucherCode ?? "" : "",
      voucherId: sameContext ? lastBookedDraft?.voucherId ?? null : null,
      note: sameContext ? lastBookedDraft?.note ?? "" : "",
      pickupNote: ride.pickupNote?.trim() || (sameContext ? lastBookedDraft?.pickupNote ?? "" : ""),
      scheduledAt,
      paymentMethod,
      payableFare: previousPayableFare,
    },
    scheduleExpired,
    previousPayableFare,
  };
}
