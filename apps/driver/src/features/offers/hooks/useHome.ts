import { capabilitiesKey, getCapabilities } from '@/lib/driverCapabilities';
import { useDriverCredit } from '@/lib/useDriverCredit';
import { usePendingOffer } from '@/lib/driverOffer';
import { driverApi } from '@/lib/driverApi';
import { useSessionStore } from '@/lib/store';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { getHomeDailySummary,getHomeActiveRide,getHomeSession,getHomeVerification,setDriverAvailability } from '../api';
const skipRefreshCapabilities = () => undefined;
export function useHome() {
  const router = useRouter();
  const client = useQueryClient();
  const session = useQuery({ queryKey: ['driver', 'session'], queryFn: getHomeSession });
  const verification = useQuery({ queryKey: ['driver', 'verification'], queryFn: getHomeVerification });
  const active = useQuery({ queryKey: ['driver', 'activeRide'], queryFn: getHomeActiveRide });
  const summary = useQuery({ queryKey: ['driver', 'dailySummary'], queryFn: getHomeDailySummary, refetchInterval: 60000 });
  useRefreshOnFocus(summary.refetch);
  const credit = useDriverCredit();
  const offer = usePendingOffer(credit.allowed);
  const capabilityMode = verification.data?.verification_workflow === 'EKYC';
  const capabilities = useQuery({ queryKey: capabilitiesKey, queryFn: getCapabilities, enabled: capabilityMode });
  // Giấy tờ/kỹ năng chỉ dùng cho luồng hồ sơ cũ. Tài khoản eKYC không gọi
  // endpoint này (máy chủ có thể đã bỏ) để trang chủ không hiện lỗi giả.
  const legacyProfileMode = verification.isSuccess && !capabilityMode;
  const skills = useQuery({ queryKey: ['driver', 'skills'], queryFn: driverApi.skills, enabled: legacyProfileMode });
  const documents = useQuery({ queryKey: ['driver', 'documents'], queryFn: driverApi.documents, enabled: legacyProfileMode });
  useRefreshOnFocus(session.refetch);
  useRefreshOnFocus(verification.refetch);
  useRefreshOnFocus(active.refetch);
  useRefreshOnFocus(offer.refetch);
  useRefreshOnFocus(legacyProfileMode ? skills.refetch : skipRefreshCapabilities);
  const refreshCapabilities = capabilityMode ? capabilities.refetch : undefined;
  useRefreshOnFocus(refreshCapabilities ?? skipRefreshCapabilities);
  useRefreshOnFocus(legacyProfileMode ? documents.refetch : skipRefreshCapabilities);
  const availability = useMutation({
    mutationFn: async (body: Parameters<typeof setDriverAvailability>[0]) => {
      if (body.online) {
        const result = await credit.refetch();
        if (result.error || !result.data?.canReceive) throw new Error(result.error?.message || 'Số dư ví tín dụng không đủ để nhận chuyến.');
      }
      return setDriverAvailability(body);
    },
    onSuccess: async (result) => {
      const store = useSessionStore.getState();
      const user = store.user;
      const confirmedVehicle = result?.onlineVehicleType ?? null;
      if (user && result) {
        store.setUser({ ...user, status: result.status, onlineVehicleType: confirmedVehicle });
      } else {
        store.setOnlineVehicleType(confirmedVehicle);
      }
      await client.invalidateQueries({ queryKey: ['driver'] });
    },
  });
  return { router, credit, capabilities, summary, session, verification, active, offer, skills, documents, availability };
}
