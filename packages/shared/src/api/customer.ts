import type { CustomerProfile,CustomerProfileUpdate,CustomerRideDetail,CustomerRidePage,CustomerVehicle,CustomerVoucher,CustomerVoucherCampaign,RideStatusResponse } from '../types';
import type { createApiClient } from './client';
export function createCustomerApi(request: ReturnType<typeof createApiClient>) {
async function getCustomerProfile(): Promise<CustomerProfile> {
  return (await request<CustomerProfile>('/customer/profile')) as CustomerProfile;
}

async function updateCustomerProfile(
  profile: CustomerProfileUpdate,
): Promise<CustomerProfile> {
  return (await request<CustomerProfile>('/customer/profile', {
    method: 'PUT',
    body: profile,
  })) as CustomerProfile;
}

async function getCustomerVouchers(): Promise<CustomerVoucher[]> {
  return (await request<CustomerVoucher[]>('/customer/vouchers')) as CustomerVoucher[];
}

async function getVoucherCampaigns(): Promise<CustomerVoucherCampaign[]> {
  return (await request<CustomerVoucherCampaign[]>('/customer/vouchers/campaigns')) as CustomerVoucherCampaign[];
}

async function claimVoucherCampaign(id: number): Promise<CustomerVoucher> {
  return (await request<CustomerVoucher>(`/customer/vouchers/campaigns/${id}/claim`, { method: 'POST' })) as CustomerVoucher;
}

async function cancelCustomerRide(id: number, reason?: string): Promise<RideStatusResponse> {
  return (await request<RideStatusResponse>(`/customer/rides/${id}/cancel`, {
    method: 'POST',
    body: reason === undefined ? {} : { reason },
  })) as RideStatusResponse;
}

async function getCustomerRide(id: number): Promise<CustomerRideDetail> {
  return (await request<CustomerRideDetail>(`/customer/rides/${id}`)) as CustomerRideDetail;
}

async function getActiveCustomerRide(): Promise<CustomerRideDetail | null> {
  return (await request<CustomerRideDetail>('/customer/rides/active', { allowNull: true })) ?? null;
}

async function getCustomerRides(page = 0, size = 20, status?: string): Promise<CustomerRidePage> {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) query.set('status', status);
  return (await request<CustomerRidePage>(`/customer/rides?${query.toString()}`)) as CustomerRidePage;
}

async function getUnreadNotificationCount(): Promise<number> {
  const result = (await request<{ unread_count: number }>('/notifications/unread-count')) as {
    unread_count: number;
  };
  return result.unread_count;
}

async function getCustomerVehicles(): Promise<CustomerVehicle[]> {
  return (await request<CustomerVehicle[]>('/customer/vehicles')) as CustomerVehicle[];
}
return {getCustomerProfile, updateCustomerProfile, getCustomerVouchers, getVoucherCampaigns, claimVoucherCampaign, cancelCustomerRide, getCustomerRide, getActiveCustomerRide, getCustomerRides, getUnreadNotificationCount, getCustomerVehicles};
}
