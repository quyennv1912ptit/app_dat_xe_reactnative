import type { createApiClient } from './client';

export type BookingVehicleType = 'CAR' | 'MOTORCYCLE';
export type VehicleTransmission = 'AUTO' | 'MANUAL';
export type VehicleCatalog = {
  version: string;
  bookingTypes: Partial<Record<BookingVehicleType, string>>;
  transmissions: Partial<Record<VehicleTransmission, string>>;
  models?: { vehicleType: BookingVehicleType; brand: string; model: string }[];
  groups: { id: string; label: string; vehicleType?: BookingVehicleType | null; active: boolean; supported: boolean }[];
};

export const getVehicleCatalog = (request: ReturnType<typeof createApiClient>, signal?: AbortSignal) =>
  request<VehicleCatalog>('/vehicle-catalog', { signal });

export const vehicleCatalogQueryKey = ['vehicleCatalog'] as const;
