import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
export function useCreateCustomerRide() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.createCustomerRide>)=>api.createCustomerRide(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
export function useGeocodeCustomerAddress(...args: Parameters<typeof api.geocodeCustomerAddress>) { return useQuery({queryKey:['customer','geocodeCustomerAddress',...args],queryFn:()=>api.geocodeCustomerAddress(...args)}); }
export function useGetCustomerVouchers(...args: Parameters<typeof api.getCustomerVouchers>) { return useQuery({queryKey:['customer','getCustomerVouchers',...args],queryFn:()=>api.getCustomerVouchers(...args)}); }
export function useGetRideEstimate(...args: Parameters<typeof api.getRideEstimate>) { return useQuery({queryKey:['customer','getRideEstimate',...args],queryFn:()=>api.getRideEstimate(...args)}); }
export function useCancelCustomerRide() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.cancelCustomerRide>)=>api.cancelCustomerRide(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
export function useGetCustomerRide(...args: Parameters<typeof api.getCustomerRide>) { return useQuery({queryKey:['customer','getCustomerRide',...args],queryFn:()=>api.getCustomerRide(...args)}); }
export function useGetActiveCustomerRide(...args: Parameters<typeof api.getActiveCustomerRide>) { return useQuery({queryKey:['customer','getActiveCustomerRide',...args],queryFn:()=>api.getActiveCustomerRide(...args)}); }
export function useGetCustomerProfile(...args: Parameters<typeof api.getCustomerProfile>) { return useQuery({queryKey:['customer','getCustomerProfile',...args],queryFn:()=>api.getCustomerProfile(...args)}); }
export function useGetCustomerRides(...args: Parameters<typeof api.getCustomerRides>) { return useQuery({queryKey:['customer','getCustomerRides',...args],queryFn:()=>api.getCustomerRides(...args)}); }
export function useGetNearbyCustomerDrivers(...args: Parameters<typeof api.getNearbyCustomerDrivers>) { return useQuery({queryKey:['customer','getNearbyCustomerDrivers',...args],queryFn:()=>api.getNearbyCustomerDrivers(...args)}); }
export function useGetUnreadNotificationCount(...args: Parameters<typeof api.getUnreadNotificationCount>) { return useQuery({queryKey:['customer','getUnreadNotificationCount',...args],queryFn:()=>api.getUnreadNotificationCount(...args)}); }
export function useGetCustomerVehicles(...args: Parameters<typeof api.getCustomerVehicles>) { return useQuery({queryKey:['customer','getCustomerVehicles',...args],queryFn:()=>api.getCustomerVehicles(...args)}); }
