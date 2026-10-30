import { useQuery } from '@tanstack/react-query';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { getActiveCustomerRide } from '../api';
export function useCustomerSupport(){const router=useRouter();const params=useLocalSearchParams<{topic?:string}>();const query=useQuery({queryKey:['customer','getActiveCustomerRide'],queryFn:getActiveCustomerRide});useRefreshOnFocus(query.refetch);return {router,params,isSafety:params.topic==='safety',ride:query.data,loading:query.isLoading,error:query.error?.message,retry:query.refetch};}
