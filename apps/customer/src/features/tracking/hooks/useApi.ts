import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
export function useCancelCustomerRide() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.cancelCustomerRide>)=>api.cancelCustomerRide(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
export function useGetCustomerRide(...args: Parameters<typeof api.getCustomerRide>) { return useQuery({queryKey:['customer','getCustomerRide',...args],queryFn:()=>api.getCustomerRide(...args)}); }
export function useGetCustomerVehicles(...args: Parameters<typeof api.getCustomerVehicles>) { return useQuery({queryKey:['customer','getCustomerVehicles',...args],queryFn:()=>api.getCustomerVehicles(...args)}); }
export function useRateCustomerRide() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.rateCustomerRide>)=>api.rateCustomerRide(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
