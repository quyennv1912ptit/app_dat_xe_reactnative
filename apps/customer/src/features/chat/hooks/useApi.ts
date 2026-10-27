import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
export function useGetCustomerChatMessages(...args: Parameters<typeof api.getCustomerChatMessages>) { return useQuery({queryKey:['customer','getCustomerChatMessages',...args],queryFn:()=>api.getCustomerChatMessages(...args)}); }
export function useGetCustomerRide(...args: Parameters<typeof api.getCustomerRide>) { return useQuery({queryKey:['customer','getCustomerRide',...args],queryFn:()=>api.getCustomerRide(...args)}); }
export function useMarkCustomerChatRead() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.markCustomerChatRead>)=>api.markCustomerChatRead(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
export function useSendCustomerChatMessage() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.sendCustomerChatMessage>)=>api.sendCustomerChatMessage(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
export function useUploadCustomerChatImage() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.uploadCustomerChatImage>)=>api.uploadCustomerChatImage(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
