import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
export function useGetCustomerProfile(...args: Parameters<typeof api.getCustomerProfile>) { return useQuery({queryKey:['customer','getCustomerProfile',...args],queryFn:()=>api.getCustomerProfile(...args)}); }
export function useUpdateCustomerProfile() { const client=useQueryClient(); return useMutation({mutationFn:(args:Parameters<typeof api.updateCustomerProfile>)=>api.updateCustomerProfile(...args),onSuccess:()=>client.invalidateQueries({queryKey:['customer']})}); }
