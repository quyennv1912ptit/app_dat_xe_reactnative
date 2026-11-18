import type { createApiClient } from './client';
import type { DriverSkill } from '../types/driver';

export type BookingVehicleType = DriverSkill['vehicle_type'];
export type VehicleTransmission = DriverSkill['transmission'];
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
