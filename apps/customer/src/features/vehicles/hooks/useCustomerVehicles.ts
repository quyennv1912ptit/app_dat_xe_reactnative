import { localizedAlert } from '@datxe/ui';
import { translate as i18nT } from '@datxe/shared';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { CustomerVehicle } from '@datxe/shared';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { deleteCustomerVehicle,getCustomerVehicles,setDefaultCustomerVehicle } from '../api';
export function useCustomerVehicles() {
const router = useRouter();
const client=useQueryClient();
const query=useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles});
useRefreshOnFocus(query.refetch);
const vehicles=query.data ?? [];
const loading=query.isLoading;
const error=query.error?.message ?? '';
const [deletingId,setDeletingId]=useState<number|null>(null);
const [defaultId, setDefaultId] = useState<number | null>(null);
const setDefault = async (id: number) => {
  if (defaultId !== null) return;
  setDefaultId(id);
  try { await setDefaultCustomerVehicle(id); await query.refetch(); }
  catch (err) { localizedAlert(i18nT("Không đặt được xe mặc định"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại.")); }
  finally { setDefaultId(null); }
};
const remove = (vehicle: CustomerVehicle) => localizedAlert(i18nT("Lưu trữ phương tiện"), i18nT("Ẩn {0} khỏi danh sách đặt chuyến? Lịch sử chuyến vẫn được giữ.", {"0": vehicle.plate_number || `xe #${vehicle.id}`}), [
    { text: 'Giữ lại', style: 'cancel' },
    { text: 'Lưu trữ xe', style: 'destructive', onPress: () => { void (async () => {
      setDeletingId(vehicle.id);
      try { await deleteCustomerVehicle(vehicle.id); await client.invalidateQueries({queryKey:['customer']}); }
      catch (err) { localizedAlert(i18nT("Không thể lưu trữ xe"), err instanceof Error ? err.message : i18nT("Vui lòng thử lại.")); }
      finally { setDeletingId(null); }
    })(); } },
  ]);
return { router, vehicles, loading, error, deletingId, remove, defaultId, setDefault, refresh: query.refetch };
}
