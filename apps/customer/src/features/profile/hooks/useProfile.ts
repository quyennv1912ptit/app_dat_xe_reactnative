import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { CustomerProfile,PaymentMethod } from '@datxe/shared';
import { signOutFirebase } from '@datxe/shared';
import { ProfileScreenSERVICE_SECTION } from '@datxe/ui';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { deleteCustomerAccount,getCustomerProfile,getCustomerRideCount,getCustomerVehicles,getCustomerVouchers,getUnreadNotificationCount,updateCustomerProfile,uploadCustomerProfileAvatar } from '../api';
import { countLabel,getApiErrorMessage,getPaymentMethodLabel,isPastIsoDate } from '../components/ProfileScreenParts';
export function useProfile() {
const router = useRouter();
const [logoutVisible, setLogoutVisible] = useState(false);
const [deleteVisible, setDeleteVisible] = useState(false);
const [deletingAccount, setDeletingAccount] = useState(false);
const [deleteError, setDeleteError] = useState('');
const [editVisible, setEditVisible] = useState(false);
const [saving, setSaving] = useState(false);
const [uploadingAvatar, setUploadingAvatar] = useState(false);
const [editError, setEditError] = useState('');
const [draftName, setDraftName] = useState('');
const [draftEmail, setDraftEmail] = useState('');
const [draftDateOfBirth, setDraftDateOfBirth] = useState('');
const [draftGender, setDraftGender] = useState('');
const [draftPaymentMethod, setDraftPaymentMethod] = useState<PaymentMethod | null>(null);
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
const openEdit = () => {
    if (!profile) return;
    setDraftName(profile.full_name ?? '');
    setDraftEmail(profile.email ?? '');
    setDraftDateOfBirth(profile.date_of_birth ?? '');
    setDraftGender(profile.gender ?? '');
    setDraftPaymentMethod(profile.default_payment_method === 'CASH' ? 'CASH' : null);
    setEditError('');
    setEditVisible(true);
  };
const changeAvatar = async () => {
    if (uploadingAvatar || !profile) return;
    setUploadingAvatar(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setProfile(await uploadCustomerProfileAvatar({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType }));
      Alert.alert('Đã cập nhật ảnh', 'Ảnh đại diện đã được lưu vào hồ sơ.');
    } catch (error) {
      Alert.alert('Không thể cập nhật ảnh', getApiErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
    }
  };
const saveProfile = async () => {
    const fullName = draftName.trim();
    const email = draftEmail.trim();
    const dateOfBirth = draftDateOfBirth.trim();
    if (!fullName) {
      setEditError('Họ và tên không được để trống.');
      return;
    }
    if (fullName.length > 255) {
      setEditError('Họ và tên không được dài quá 255 ký tự.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEditError('Email không đúng định dạng.');
      return;
    }
    if (email.length > 255) {
      setEditError('Email không được dài quá 255 ký tự.');
      return;
    }
    if (dateOfBirth && !isPastIsoDate(dateOfBirth)) {
      setEditError('Ngày sinh phải theo định dạng YYYY-MM-DD và nằm trong quá khứ.');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      const updated = await updateCustomerProfile({
        full_name: fullName,
        email: email || null,
        date_of_birth: dateOfBirth || null,
        gender: draftGender || null,
        default_payment_method: draftPaymentMethod,
      });
      setProfile(updated);
      setEditVisible(false);
      Alert.alert('Đã cập nhật', 'Thông tin tài khoản đã được lưu.');
    } catch (error) {
      setEditError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
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
        subtitle: count === null ? 'Đang tải dữ liệu xe' : `${count} xe đã lưu`,
        badge: { label: count === null ? '…' : `${count} xe` },
      };
    }
    if (item.id === 'vouchers') {
      const count = voucherCount;
      return {
        ...item,
        subtitle: count === null
          ? 'Đang tải ưu đãi'
          : count === 0 ? 'Chưa có ưu đãi khả dụng' : `${count} ưu đãi đang khả dụng`,
        badge: {
          label: count === null ? '…' : `${count} ưu đãi`,
          highlighted: count !== null && count > 0,
        },
      };
    }
    if (item.id === 'payments') {
      return {
        ...item,
        subtitle: `Mặc định: ${getPaymentMethodLabel(profile?.default_payment_method ?? null)}`,
      };
    }
    return item;
  });

return { router, profile, unreadCount, loading, loadError, refresh, logoutVisible, setLogoutVisible, deleteVisible, setDeleteVisible, deletingAccount, deleteError, setDeleteError, editVisible, setEditVisible, saving, uploadingAvatar, editError, draftName, setDraftName, draftEmail, setDraftEmail, draftDateOfBirth, setDraftDateOfBirth, draftGender, setDraftGender, draftPaymentMethod, setDraftPaymentMethod, openEdit, changeAvatar, saveProfile, confirmDeleteAccount, profileStats, serviceItems };
}
