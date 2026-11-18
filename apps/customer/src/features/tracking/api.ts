import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
export const cancelCustomerRide = customerApi.cancelCustomerRide;

export const getCustomerRide = customerApi.getCustomerRide;

export const getCustomerVehicles = customerApi.getCustomerVehicles;

export type MyRideRating = {
  rideId: number;
  direction: string;
  driverId: number | null;
  customerId: number | null;
  stars: number;
  comment: string | null;
  tip: number;
  tags: string[];
};

export async function getMyCustomerRideRating(id: number): Promise<MyRideRating | null> {
  return request<MyRideRating | null>(`/customer/rides/${id}/rating/me`, {
    method: 'GET',
    allowNull: true,
  });
}

export async function rateCustomerRide(
  id: number,
  rating: { stars: number; comment?: string | null; tags?: string[] | null; tip?: number },
): Promise<void> {
  await request(`/customer/rides/${id}/rating`, {
    method: 'POST',
    body: rating,
    allowNull: true,
  });
}