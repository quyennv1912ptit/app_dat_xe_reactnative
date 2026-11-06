import { request } from "@/lib/api";
export { driverApi as profileApi } from '@/lib/driverApi';

export const updateDriverIdentity = (body: { fullName: string; email: string | null }) =>
  request<{ fullName: string | null; email: string | null }>("/driver/profile/identity", { method: "PUT", body });

export const deleteDriverAccount = () => request("/auth/account", { method: "DELETE", allowNull: true });
