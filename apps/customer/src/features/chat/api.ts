import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import { uploadCustomerImage } from '@/lib/uploadImage';
import type { CustomerChatMessage,CustomerChatPage,CustomerChatPageOptions,CustomerChatSendRequest,CustomerImageFile } from '@datxe/shared';
export async function getCustomerChatMessages(
  rideId: number,
  options: CustomerChatPageOptions = {},
): Promise<CustomerChatPage> {
  const query = new URLSearchParams();
  if (options.beforeId !== undefined) query.set('beforeId', String(options.beforeId));
  if (options.afterId !== undefined) query.set('afterId', String(options.afterId));
  if (options.size !== undefined) query.set('size', String(options.size));
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : '';
  return (await request<CustomerChatPage>(`/chat/rides/${rideId}/messages${suffix}`)) as CustomerChatPage;
}

export const getCustomerRide = customerApi.getCustomerRide;

export async function markCustomerChatRead(rideId: number, upToMessageId: number): Promise<void> {
  await request(`/chat/rides/${rideId}/read`, {
    method: 'PUT',
    body: { upToMessageId },
  });
}

export async function sendCustomerChatMessage(
  rideId: number,
  input: CustomerChatSendRequest,
): Promise<CustomerChatMessage> {
  return (await request<CustomerChatMessage>(`/chat/rides/${rideId}/messages`, {
    method: 'POST',
    body: input,
  })) as CustomerChatMessage;
}

export async function uploadCustomerChatImage(
  rideId: number,
  file: CustomerImageFile,
): Promise<{ secureUrl: string; publicId: string }> {
  return uploadCustomerImage(file, 'CHAT', rideId);
}
