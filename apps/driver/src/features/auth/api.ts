import { request } from '@/lib/api';
import { driverApi } from '@/lib/driverApi';
import { uploadDriverImage } from '@/lib/uploadImage';
import type { DriverDocument,DriverProfile,DriverSkill } from '@datxe/shared';
export { authenticateWithBackend,registerWithBackend } from '@datxe/shared';
export const getDriverDocuments=driverApi.documents;
export const getDriverProfile=driverApi.profile;
export const getDriverVerification=driverApi.verification;
export const getDriverSkills=driverApi.skills;
export const uploadDocumentImage=(uri:string)=>uploadDriverImage({uri},'DRIVER_DOCUMENT');
export const submitDocument=(body:{document_type:string;document_number:string|null;secure_url:string;public_id:string;expires_at:string|null})=>request<DriverDocument>('/driver/documents',{method:'POST',body});
export const updateDriverLicense=(body:{license_number:string;license_class:string;years_of_experience:number;license_image_url:string|null})=>request<DriverProfile>('/driver/profile',{method:'PUT',body});
export const updateDriverSkills=(skills:Pick<DriverSkill,'vehicle_type'|'transmission'|'license_class'>[])=>request<DriverSkill[]>('/driver/skills',{method:'PUT',body:{skills}});

export type EkycCandidate = {
  fieldKey: string;
  candidateValue: unknown;
  source: string;
  sourceDocument: string;
  sourceSide: string;
  parseStatus: string;
  validationStatus: string;
  warnings?: string[];
};

export type EkycExtractData = {
  slot: string;
  qrStatus: string;
  ocrStatus: string;
  candidates: EkycCandidate[];
  warnings: string[];
};

export async function extractDocumentEkyc(
  slot: 'cccd_front' | 'cccd_back' | 'gplx_front' | 'gplx_back',
  uri: string,
): Promise<EkycExtractData> {
  const { fetch: expoFetch } = await import('expo/fetch');
  const { getFirebaseUser } = await import('@datxe/shared');
  const { env } = await import('@/config/env');
  const user = getFirebaseUser();
  if (!user) throw new Error('Phiên đăng nhập đã hết hạn.');
  const token = await user.getIdToken();
  const fileRes = await expoFetch(uri);
  const blob = await fileRes.blob();
  const mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const url = `${env.apiUrl}/driver/ekyc/documents/${slot}/extract`;
  const response = await expoFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
      'X-Role': 'DRIVER',
    },
    body: blob,
  });
  const json = (await response.json()) as {
    success: boolean;
    data?: EkycExtractData;
    message?: string;
    error?: { message?: string };
  };
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || json.error?.message || 'Không thể trích xuất thông tin từ ảnh.');
  }
  return json.data;
}
