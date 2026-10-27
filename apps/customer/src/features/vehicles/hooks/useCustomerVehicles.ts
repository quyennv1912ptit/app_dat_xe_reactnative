import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { CustomerVehicle } from '@datxe/shared';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { deleteCustomerVehicle,getCustomerVehicles } from '../api';
export function useCustomerVehicles() {
const router = useRouter();
const client=useQueryClient();
const query=useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles});
useRefreshOnFocus(query.refetch);
const vehicles=query.data ?? [];
const loading=query.isLoading;
const error=query.error?.message ?? '';
const [deletingId,setDeletingId]=useState<number|null>(null);
const remove = (vehicle: CustomerVehicle) => Alert.alert('Xóa phương tiện', `Bạn muốn xóa ${vehicle.plate_number || `xe #${vehicle.id}`} khỏi tài khoản?`, [
    { text: 'Giữ lại', style: 'cancel' },
    { text: 'Xóa xe', style: 'destructive', onPress: () => { void (async () => {
      setDeletingId(vehicle.id);
      try { await deleteCustomerVehicle(vehicle.id); await client.invalidateQueries({queryKey:['customer']}); }
      catch (err) { Alert.alert('Không thể xóa xe', err instanceof Error ? err.message : 'Vui lòng thử lại.'); }
      finally { setDeletingId(null); }
    })(); } },
  ]);
return { router, vehicles, loading, error, deletingId, remove };
}
