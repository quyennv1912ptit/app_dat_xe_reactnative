import { useQuery } from '@tanstack/react-query';
import * as api from '../api';
export function useGetCustomerRides(...args: Parameters<typeof api.getCustomerRides>) { return useQuery({queryKey:['customer','getCustomerRides',...args],queryFn:()=>api.getCustomerRides(...args)}); }
export function useGetUnreadNotificationCount(...args: Parameters<typeof api.getUnreadNotificationCount>) { return useQuery({queryKey:['customer','getUnreadNotificationCount',...args],queryFn:()=>api.getUnreadNotificationCount(...args)}); }
