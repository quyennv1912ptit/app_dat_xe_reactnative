import { request } from "@/lib/api";
import type { DriverProfile } from "@datxe/shared";
export { driverApi as profileApi } from '@/lib/driverApi';

export const updateDriverIdentity = (body: { fullName: string; email: string | null; bankName?: string; bankAccountNumber?: string }) =>
  request<{ fullName: string | null; email: string | null; bankName: string | null; bankAccountNumber: string | null }>("/driver/profile/identity", { method: "PUT", body });

export const updateDriverAvatar = (body: { secure_url: string; public_id: string }) =>
  request<DriverProfile>("/driver/profile/avatar", { method: "POST", body });

export const deleteDriverAccount = () => request("/auth/account", { method: "DELETE", allowNull: true });
