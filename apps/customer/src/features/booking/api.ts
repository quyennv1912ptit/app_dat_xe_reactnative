import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import type { CreateCustomerRideRequest,CreateCustomerRideResponse,NearbyDriverMarker,RideCoordinates,RideEstimate,RideEstimateRequest } from '@datxe/shared';
import { parsePlaces } from './bookingUtils';
import type { BookingPlace } from './types';

export async function searchBookingPlaces(text: string, proximity?: RideCoordinates, signal?: AbortSignal): Promise<BookingPlace[]> {
  const query = new URLSearchParams({ address: text.trim() });
  if (proximity) { query.set('proximityLat', String(proximity.lat)); query.set('proximityLng', String(proximity.lng)); }
  const result = await request<string | null>(`/location/geocode?${query.toString()}`, { allowNull: true, signal });
  return result ? parsePlaces(result) : [];
}

export async function reverseBookingPlace(point: RideCoordinates, signal?: AbortSignal): Promise<BookingPlace> {
  const places = await searchBookingPlaces(`${point.lng},${point.lat}`, undefined, signal);
  if (!places.length) throw new Error('Chưa tìm được địa chỉ tại vị trí này. Hãy di chuyển ghim tới đường gần đó.');
  // Preserve the exact pin, not the geocoder's snapped feature center.
  return { ...places[0], id: `pin:${point.lng},${point.lat}`, coordinate: point };
}

export async function getBookingRoute(pickup: RideCoordinates, dropoff: RideCoordinates, signal?: AbortSignal): Promise<RideCoordinates[]> {
  const query = new URLSearchParams({ origin: `${pickup.lng},${pickup.lat}`, destination: `${dropoff.lng},${dropoff.lat}` });
  const result = await request<{ coordinates: RideCoordinates[] }>(`/location/directions?${query.toString()}`, { signal });
  return result?.coordinates ?? [];
}
export async function createCustomerRide(
  input: CreateCustomerRideRequest,
  idempotencyKey: string,
): Promise<CreateCustomerRideResponse> {
  return (await request<CreateCustomerRideResponse>('/customer/rides', {
    method: 'POST',
    body: input,
    headers: { 'Idempotency-Key': idempotencyKey },
  })) as CreateCustomerRideResponse;
}

export async function geocodeCustomerAddress(address: string): Promise<RideCoordinates | null> {
  const result = await request<string | null>(`/location/geocode?address=${encodeURIComponent(address)}`, {
    allowNull: true,
  });
  if (!result) return null;
  try {
    const parsed = JSON.parse(result) as {
      features?: { geometry?: { coordinates?: number[] } }[];
    };
    const [lng, lat] = parsed.features?.[0]?.geometry?.coordinates ?? [];
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

export const getCustomerVouchers = customerApi.getCustomerVouchers;

export async function getRideEstimate(input: RideEstimateRequest): Promise<RideEstimate> {
  return (await request<RideEstimate>('/customer/rides/estimate', {
    method: 'POST',
    body: input,
  })) as RideEstimate;
}

export const cancelCustomerRide = customerApi.cancelCustomerRide;

export const getCustomerRide = customerApi.getCustomerRide;

export const getActiveCustomerRide = customerApi.getActiveCustomerRide;

export const getCustomerProfile = customerApi.getCustomerProfile;

export const getCustomerRides = customerApi.getCustomerRides;

export async function getNearbyCustomerDrivers(center: RideCoordinates): Promise<NearbyDriverMarker[]> {
  const query = new URLSearchParams({
    latitude: String(center.lat),
    longitude: String(center.lng),
  });
  return (await request<NearbyDriverMarker[]>(`/location/customer/nearby-drivers?${query.toString()}`)) as NearbyDriverMarker[];
}

export const getUnreadNotificationCount = customerApi.getUnreadNotificationCount;

export const getCustomerVehicles = customerApi.getCustomerVehicles;
