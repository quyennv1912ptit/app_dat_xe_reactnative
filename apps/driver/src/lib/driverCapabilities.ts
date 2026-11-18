import { request } from '@/lib/api';
import type { BookingVehicleType } from '@datxe/shared';

export const capabilitiesKey = ['driver', 'capabilities'] as const;

export type Capability = {
  groupId: string;
  label: string;
  approved: boolean;
  enabled: boolean;
  effective: boolean;
  reasonCode?: string | null;
  expiresOn?: string | null;
};
export type CapabilityState = {
  enabled: boolean;
  approvalRevision?: number | null;
  preferenceVersion: number;
  acceptingVehicleTypes: BookingVehicleType[];
  groups: Capability[];
};

export const getCapabilities = () => request<CapabilityState>('/driver/capabilities');
export const updateCapability = (
  groupId: string, approvalRevision: number, preferenceVersion: number, enabled: boolean,
) => request<CapabilityState>('/driver/capabilities/' + encodeURIComponent(groupId) + '/preference', {
  method: 'PUT', body: { approvalRevision, preferenceVersion, enabled },
});
