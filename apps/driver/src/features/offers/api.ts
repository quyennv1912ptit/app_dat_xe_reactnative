import { request } from '@/lib/api';
export type DriverOffer = { rideId: number; expiresAt: number; pickup: { lat: number; lng: number; address: string }; dropoff: { lat: number; lng: number; address: string }; pickupNote?: string | null; note?: string | null; tripDistanceKm: number; estDurationMin: number; fareEstimate: number; driverEarning: number; customer: { displayName: string }; vehicle: { type: string; transmission: string } };
export const getPendingOffer = () => request<DriverOffer>('/driver/offers/pending', { allowNull: true });
export const acceptDriverOffer = (rideId: number) => request<string>(`/driver/offers/${rideId}/accept`, { method: 'POST' });
export const rejectDriverOffer = (rideId: number) => request(`/driver/offers/${rideId}/reject`, { method: 'POST', allowNull: true });
