import { request } from '@/lib/api';
import type { CustomerRideDetail } from '@datxe/shared';
export const getDriverActiveRide = () => request<CustomerRideDetail>('/driver/rides/active', { allowNull: true });
export const progressDriverRide = (id: number, action: string) => request(`/driver/rides/${id}/${action}`, { method: 'POST', body: {} });
export const submitDriverHandover = (id: number, phase: 'pickup' | 'dropoff', body: { odometer: number; fuelLevel: number | null; notes: string | null; photos: { angle: string; fileUrl: string; publicId: string }[] }) => request(`/driver/rides/${id}/handover/${phase}`, { method: 'POST', body });
