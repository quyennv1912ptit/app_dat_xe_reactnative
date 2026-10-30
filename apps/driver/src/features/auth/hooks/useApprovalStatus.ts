import { useQuery } from '@tanstack/react-query';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { getDriverDocuments,getDriverVerification } from '../api';
export function useApprovalStatus(){const verification=useQuery({queryKey:['driver','verification'],queryFn:getDriverVerification,refetchInterval:30000});const documents=useQuery({queryKey:['driver','documents'],queryFn:getDriverDocuments});useRefreshOnFocus(verification.refetch);useRefreshOnFocus(documents.refetch);return {verification,documents};}
