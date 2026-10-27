import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import type { CustomerNotification } from '@datxe/shared';
export async function getCustomerNotifications(): Promise<CustomerNotification[]> {
  return (await request<CustomerNotification[]>('/notifications')) as CustomerNotification[];
}

export const getUnreadNotificationCount = customerApi.getUnreadNotificationCount;

export async function markAllCustomerNotificationsRead(): Promise<void> {
  await request('/notifications/read-all', { method: 'PUT', allowNull: true });
}

export async function markCustomerNotificationRead(id: number): Promise<void> {
  await request(`/notifications/${id}/read`, { method: 'PUT', allowNull: true });
}
