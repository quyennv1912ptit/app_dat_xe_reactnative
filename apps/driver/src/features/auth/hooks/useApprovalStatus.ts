import { useQuery } from '@tanstack/react-query';
import { getDriverDocuments, getDriverVerification } from '../api';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';

const skipRefresh = () => undefined;

export function useApprovalStatus() {
  const verification = useQuery({
    queryKey: ['driver', 'verification'],
    queryFn: getDriverVerification,
    refetchInterval: 30000,
  });
  const managed = verification.data?.verification_workflow === 'EKYC';
  // Hồ sơ eKYC do backend quản lý: không gọi endpoint giấy tờ cũ, vốn có thể đã bị bỏ.
  const documents = useQuery({
    queryKey: ['driver', 'documents'],
    queryFn: getDriverDocuments,
    enabled: verification.isSuccess && !managed,
  });
  useRefreshOnFocus(verification.refetch);
  useRefreshOnFocus(verification.isSuccess && !managed ? documents.refetch : skipRefresh);
  return { verification, documents };
}
