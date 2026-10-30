import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import { notificationsApi as api } from '../api';
export function useNotifications(){const client=useQueryClient();const query=useQuery({queryKey:['driver','notifications'],queryFn:api.notifications});useRefreshOnFocus(query.refetch);const mark=useMutation({mutationFn:(id:number|null)=>id===null?api.readAllNotifications():api.readNotification(id),onSuccess:()=>client.invalidateQueries({queryKey:['driver','notifications']})});return {query,mark};}
