import { localizedAlert , ProfileScreenSERVICE_SECTION } from '@datxe/ui';
import { translate as i18nT , signOutFirebase } from '@datxe/shared';
import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { CustomerProfile } from '@datxe/shared';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { deleteCustomerAccount,getCustomerProfile,getCustomerRideCount,getCustomerVehicles,getCustomerVouchers,getUnreadNotificationCount,uploadCustomerProfileAvatar } from '../api';
import { countLabel,getApiErrorMessage,getPaymentMethodLabel } from '../components/ProfileScreenParts';
export function useProfile() {
const router = useRouter();
const [logoutVisible, setLogoutVisible] = useState(false);
const [deleteVisible, setDeleteVisible] = useState(false);
const [deletingAccount, setDeletingAccount] = useState(false);
const [deleteError, setDeleteError] = useState('');
const [uploadingAvatar, setUploadingAvatar] = useState(false);
const client=useQueryClient();
const profileQuery=useQuery({queryKey:['customer','getCustomerProfile'],queryFn:getCustomerProfile});
const ridesQuery=useQuery({queryKey:['customer','getCustomerRideCount'],queryFn:getCustomerRideCount});
const vehiclesQuery=useQuery({queryKey:['customer','getCustomerVehicles'],queryFn:getCustomerVehicles});
const vouchersQuery=useQuery({queryKey:['customer','getCustomerVouchers'],queryFn:getCustomerVouchers});
const unreadQuery=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount});
useRefreshOnFocus(profileQuery.refetch);useRefreshOnFocus(ridesQuery.refetch);useRefreshOnFocus(vehiclesQuery.refetch);useRefreshOnFocus(vouchersQuery.refetch);useRefreshOnFocus(unreadQuery.refetch);
const profile=profileQuery.data;
const rideCount=ridesQuery.data ?? null;
const vehicleCount=vehiclesQuery.data?.length ?? null;
const voucherCount=vouchersQuery.data?.length ?? null;
const unreadCount=unreadQuery.data ?? 0;
const loading=[profileQuery,ridesQuery,vehiclesQuery,vouchersQuery].some(query=>query.isLoading);
const loadError=[profileQuery,ridesQuery,vehiclesQuery,vouchersQuery].find(query=>query.error)?.error?.message ?? '';
const refresh=()=>client.invalidateQueries({queryKey:['customer']});
const setProfile=(value: CustomerProfile)=>client.setQueryData(['customer','getCustomerProfile'],value);
const openEdit=()=>router.push('/edit-profile');
const changeAvatar = async () => {
    if (uploadingAvatar || !profile) return;
    setUploadingAvatar(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setProfile(await uploadCustomerProfileAvatar({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType }));
      localizedAlert(i18nT("Đã cập nhật ảnh"), i18nT("Ảnh đại diện đã được lưu vào hồ sơ."));
    } catch (error) {
      localizedAlert(i18nT("Không thể cập nhật ảnh"), getApiErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
    }
  };
const confirmDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await deleteCustomerAccount();
      await signOutFirebase();
      router.replace('/(auth)/login' as never);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error));
    } finally {
      setDeletingAccount(false);
    }
  };
const profileStats = [
    { id: 'trips', value: countLabel(rideCount), label: 'Chuyến đi', tone: 'primary' as const },
    { id: 'vehicles', value: countLabel(vehicleCount), label: 'Xe đã lưu', tone: 'surface' as const },
    { id: 'vouchers', value: countLabel(voucherCount), label: 'Ưu đãi', tone: 'tertiary' as const },
  ];
const serviceItems = ProfileScreenSERVICE_SECTION.map((item) => {
    if (item.id === 'vehicles') {
      const count = vehicleCount;
      return {
        ...item,
        subtitle: count === null ? i18nT("Đang tải dữ liệu xe") : i18nT("{0} xe đã lưu", {"0": count}),
        badge: { label: count === null ? '…' : `${count} xe` },
      };
    }
    if (item.id === 'vouchers') {
      const count = voucherCount;
      return {
        ...item,
        subtitle: count === null
          ? i18nT("Đang tải ưu đãi")
          : count === 0 ? i18nT("Chưa có ưu đãi khả dụng") : i18nT("{0} ưu đãi đang khả dụng", {"0": count}),
        badge: {
          label: count === null ? '…' : i18nT("{0} ưu đãi", {"0": count}),
          highlighted: count !== null && count > 0,
        },
      };
    }
    if (item.id === 'payments') {
      return {
        ...item,
        route:'/payment-methods',
        subtitle: i18nT("Mặc định: {0}", {"0": getPaymentMethodLabel(profile?.default_payment_method ?? null)}),
      };
    }
    return item;
  });

return { router, profile, unreadCount, loading, loadError, refresh, logoutVisible, setLogoutVisible, deleteVisible, setDeleteVisible, deletingAccount, deleteError, setDeleteError, uploadingAvatar, openEdit, changeAvatar, confirmDeleteAccount, profileStats, serviceItems };
}
