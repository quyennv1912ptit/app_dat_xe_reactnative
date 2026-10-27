import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import type { CreateCustomerRideRequest,CreateCustomerRideResponse,NearbyDriverMarker,RideCoordinates,RideEstimate,RideEstimateRequest } from '@datxe/shared';
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
