import { useRefreshOnFocus } from '@/lib/useRefreshOnFocus';
import type { CustomerNotification } from '@datxe/shared';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { getCustomerNotifications,getUnreadNotificationCount,markAllCustomerNotificationsRead,markCustomerNotificationRead } from '../api';
import { NotificationFilter,category } from '../components/NotificationScreenParts';
export function useNotification() {
const router = useRouter();
const [filter, setFilter] = useState<NotificationFilter>('all');
const client=useQueryClient();
const query=useQuery({queryKey:['customer','getCustomerNotifications'],queryFn:getCustomerNotifications});
const unread=useQuery({queryKey:['customer','getUnreadNotificationCount'],queryFn:getUnreadNotificationCount});
useRefreshOnFocus(query.refetch);useRefreshOnFocus(unread.refetch);
const items=query.data ?? [];
const unreadCount=unread.data ?? 0;
const loading=query.isLoading || unread.isLoading;
const error=query.error?.message ?? unread.error?.message ?? '';
const refresh=()=>Promise.all([query.refetch(),unread.refetch()]);
const markRead = async (item: CustomerNotification) => {
    if (item.readAt) return;
    try {
      await markCustomerNotificationRead(item.id);
      await client.invalidateQueries({queryKey:['customer']});
    } catch (err) {
      Alert.alert('Không thể đánh dấu đã đọc', err instanceof Error ? err.message : 'Vui lòng thử lại.');
    }
  };
const markAll = async () => {
    try {
      await markAllCustomerNotificationsRead();
      await client.invalidateQueries({queryKey:['customer']});
    } catch (err) {
      Alert.alert('Không thể cập nhật thông báo', err instanceof Error ? err.message : 'Vui lòng thử lại.');
    }
  };
const openNotification = async (item: CustomerNotification) => {
    await markRead(item);
    const payload = item.payload && typeof item.payload === 'object' ? item.payload as Record<string, unknown> : {};
    const rawRideId = payload.rideId ?? payload.ride_id;
    const rideId = typeof rawRideId === 'number' ? rawRideId : typeof rawRideId === 'string' ? Number(rawRideId) : NaN;
    if (Number.isSafeInteger(rideId) && rideId > 0) {
      router.push({ pathname: '/ride/[id]', params: { id: String(rideId), rideId: String(rideId), returnTo: 'notifications' } });
    }
  };
const visible = items.filter((item) => filter === 'all' || category(item.type) === filter);
return { router, filter, setFilter, items, unreadCount, loading, error, refresh, markAll, openNotification, visible };
}
