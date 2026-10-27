import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
export const cancelCustomerRide = customerApi.cancelCustomerRide;

export const getCustomerRide = customerApi.getCustomerRide;

export const getCustomerVehicles = customerApi.getCustomerVehicles;

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
