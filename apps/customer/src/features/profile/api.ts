import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import { uploadCustomerImage } from '@/lib/uploadImage';
import type { ReceivedRatingsPage } from '@datxe/ui';
import type { CustomerImageFile,CustomerProfile,CustomerRidePage } from '@datxe/shared';
export const getCustomerProfile = customerApi.getCustomerProfile;

export async function getCustomerRideCount(): Promise<number> {
  const page = (await request<CustomerRidePage>('/customer/rides?page=0&size=1')) as CustomerRidePage;
  return page.totalElements;
}

/**
 * Đánh giá tài xế dành cho khách: cùng hợp đồng `/ratings/received` mà app tài xế dùng,
 * nên điểm trung bình và danh sách nhận xét luôn khớp dữ liệu máy chủ.
 */
export async function getReceivedRatings(page = 0, size = 20): Promise<ReceivedRatingsPage> {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  const data = await request<ReceivedRatingsPage>(`/customer/ratings/received?${query.toString()}`);
  if (!data) throw new Error('Chưa tải được đánh giá. Vui lòng thử lại.');
  return data;
}

export const getCustomerVehicles = customerApi.getCustomerVehicles;

export const getCustomerVouchers = customerApi.getCustomerVouchers;

export async function deleteCustomerAccount(): Promise<void> {
  await request('/auth/account', { method: 'DELETE' });
}

export const getUnreadNotificationCount = customerApi.getUnreadNotificationCount;

export const updateCustomerProfile = customerApi.updateCustomerProfile;

export async function uploadCustomerProfileAvatar(file: CustomerImageFile): Promise<CustomerProfile> {
  const uploaded = await uploadCustomerImage(file);
  return (await request<CustomerProfile>('/customer/profile/avatar', {
    method: 'POST',
    body: { secure_url: uploaded.secureUrl, public_id: uploaded.publicId },
  })) as CustomerProfile;
}
