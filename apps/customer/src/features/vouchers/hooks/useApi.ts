import { useQuery } from '@tanstack/react-query';
import * as api from '../api';
export function useGetCustomerVouchers(...args: Parameters<typeof api.getCustomerVouchers>) { return useQuery({queryKey:['customer','getCustomerVouchers',...args],queryFn:()=>api.getCustomerVouchers(...args)}); }
