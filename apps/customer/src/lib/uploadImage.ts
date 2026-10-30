import { translate as i18nT , AuthApiError } from '@datxe/shared';
import { request } from '@/lib/api';
import type { CustomerImageFile } from '@datxe/shared';
import { Platform } from 'react-native';
export async function uploadCustomerImage(
  file: CustomerImageFile,
  purpose = 'DEFAULT',
  rideId?: number,
): Promise<{ secureUrl: string; publicId: string }> {
  const query = new URLSearchParams({ purpose });
  if (rideId !== undefined) query.set('rideId', String(rideId));
  const signature = (await request<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    allowedFormats: string[] | null;
  }>(`/uploads/signature?${query.toString()}`))!;
  const form = new FormData();
  const fileName = file.fileName || `customer-image-${Date.now()}.jpg`;
  if (Platform.OS === 'web') {
    const localImage = await fetch(file.uri);
    form.append('file', await localImage.blob(), fileName);
  } else {
    form.append('file', {
      uri: file.uri,
      name: fileName,
      type: file.mimeType || 'image/jpeg',
    } as unknown as Blob);
  }
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);
  if (signature.allowedFormats?.length) form.append('allowed_formats', signature.allowedFormats.join(','));

  let result: Response;
  try {
    result = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new AuthApiError(i18nT("Không kết nối được máy chủ tải ảnh."), 'UPLOAD_NETWORK_ERROR');
  }
  const uploaded = await result.json() as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!result.ok || !uploaded.secure_url || !uploaded.public_id) {
    throw new AuthApiError(uploaded.error?.message ?? 'Cloudinary không nhận được ảnh.', 'UPLOAD_FAILED');
  }
  return { secureUrl: uploaded.secure_url, publicId: uploaded.public_id };
}
