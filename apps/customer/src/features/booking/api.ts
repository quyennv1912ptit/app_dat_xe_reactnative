import { translate as i18nT } from '@datxe/shared';
import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import type { CreateCustomerRideRequest,CreateCustomerRideResponse,NearbyDriverMarker,RideCoordinates,RideEstimate,RideEstimateRequest } from '@datxe/shared';
import { isCoordinate } from './bookingUtils';
import type { BookingPlace, CustomerPlace, NearbyPlacesResult, PlaceSuggestion, PlaceSearchResult, ReportPlaceInput } from './types';

export async function searchBookingPlaces(text: string, proximity?: RideCoordinates, signal?: AbortSignal): Promise<PlaceSearchResult> {
  const query = new URLSearchParams({ query: text.trim() });
  if (proximity) { query.set('proximityLat', String(proximity.lat)); query.set('proximityLng', String(proximity.lng)); }
  return (await request<PlaceSearchResult>(`/location/places/search?${query.toString()}`, { signal }))!;
}

export async function getNearbyBookingPlaces(
  point: RideCoordinates,
  signal?: AbortSignal,
  radiusMeters = 100,
  limit = 8,
): Promise<NearbyPlacesResult> {
  const query = new URLSearchParams({
    lat: String(point.lat),
    lng: String(point.lng),
    radius: String(radiusMeters),
    limit: String(limit),
  });
  return (await request<NearbyPlacesResult>(`/location/places/nearby?${query.toString()}`, { signal }))!;
}

export async function getRecentBookingPlaces(
  kind: 'pickup' | 'dropoff',
  proximity?: RideCoordinates,
  signal?: AbortSignal,
  limit = 5,
): Promise<CustomerPlace[]> {
  const query = new URLSearchParams({ kind, limit: String(limit) });
  if (proximity) { query.set('proximityLat', String(proximity.lat)); query.set('proximityLng', String(proximity.lng)); }
  return (await request<CustomerPlace[]>(`/customer/places/recent?${query.toString()}`, { signal })) ?? [];
}

export async function getPopularBookingPlaces(
  proximity?: RideCoordinates,
  signal?: AbortSignal,
  limit = 6,
): Promise<CustomerPlace[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (proximity) { query.set('proximityLat', String(proximity.lat)); query.set('proximityLng', String(proximity.lng)); }
  return (await request<CustomerPlace[]>(`/customer/places/popular?${query.toString()}`, { signal })) ?? [];
}

export async function reportBookingPlace(
  input: ReportPlaceInput,
  signal?: AbortSignal,
): Promise<{ ticketId: number; code: string }> {
  return (await request<{ ticketId: number; code: string }>('/customer/places/report', {
    method: 'POST',
    body: input,
    signal,
  }))!;
}

export async function resolveBookingPlace(suggestion: PlaceSuggestion, signal?: AbortSignal): Promise<BookingPlace> {
  if (suggestion.coordinate && isCoordinate(suggestion.coordinate)) return { ...suggestion, coordinate: suggestion.coordinate };
  if (suggestion.provider !== 'goong') throw new Error(i18nT("Chưa có tọa độ chính xác. Hãy chọn vị trí trên bản đồ."));
  const query = new URLSearchParams({ id: suggestion.id });
  const place = (await request<PlaceSuggestion>(`/location/places/detail?${query.toString()}`, { signal }))!;
  if (!place.coordinate || !isCoordinate(place.coordinate)) throw new Error(i18nT("Chưa lấy được vị trí của địa chỉ này. Hãy thử lại hoặc chọn ghim trên bản đồ."));
  // Keep the exact suggestion address the user chose; details supplies verified coordinates.
  return {
    ...place,
    name: suggestion.name?.trim() || place.name,
    address: suggestion.address?.trim() || place.address,
    secondaryAddress: suggestion.secondaryAddress ?? place.secondaryAddress,
    coordinate: place.coordinate,
  };
}

export async function reverseBookingPlace(point: RideCoordinates, signal?: AbortSignal): Promise<BookingPlace> {
  const query = new URLSearchParams({ lat: String(point.lat), lng: String(point.lng) });
  try {
    const place = (await request<BookingPlace>(`/location/places/reverse?${query.toString()}`, { signal }))!;
    // Preserve the exact pin, not the geocoder's snapped feature center.
    return { ...place, id: `pin:${point.lng},${point.lat}`, coordinate: point };
  } catch (error) {
    if (signal?.aborted) throw error;
    // Reverse geocoding is optional for a dropped pin; coordinates still identify the test location.
    const coordinates = `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
    return {
      id: `pin:${point.lng},${point.lat}`,
      name: i18nT('Vị trí đã ghim'),
      address: `${i18nT('Tọa độ')}: ${coordinates}`,
      provider: 'goong',
      coordinate: point,
    };
  }
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
  const result = await searchBookingPlaces(address);
  return result.places[0] ? (await resolveBookingPlace(result.places[0])).coordinate : null;
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
