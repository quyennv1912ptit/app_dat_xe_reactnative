import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
export function useGetCustomerNotifications(...args: Parameters<typeof api.getCustomerNotifications>) { return useQuery({queryKey:['customer','getCustomerNotifications',...args],queryFn:()=>api.getCustomerNotifications(...args)}); }
export function useGetUnreadNotificationCount(...args: Parameters<typeof api.getUnreadNotificationCount>) { return useQuery({queryKey:['customer','getUnreadNotificationCount',...args],queryFn:()=>api.getUnreadNotificationCount(...args)}); }
export function useMarkAllCustomerNotificationsRead() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.markAllCustomerNotificationsRead>)=>api.markAllCustomerNotificationsRead(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
export function useMarkCustomerNotificationRead() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.markCustomerNotificationRead>)=>api.markCustomerNotificationRead(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
