import { useQuery } from '@tanstack/react-query';
import * as api from '../api';
export function useGetActiveCustomerRide(...args: Parameters<typeof api.getActiveCustomerRide>) { return useQuery({queryKey:['customer','getActiveCustomerRide',...args],queryFn:()=>api.getActiveCustomerRide(...args)}); }
