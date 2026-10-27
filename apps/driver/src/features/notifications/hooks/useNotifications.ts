import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ITEMS,NotificationFilter } from '../components/NotificationsScreenParts';
export function useNotifications() {
const router = useRouter();
const insets = useSafeAreaInsets();
const [filter, setFilter] = useState<NotificationFilter>('all');
const [readIds, setReadIds] = useState<string[]>([]);
const filteredItems = ITEMS.filter((item) => filter === 'all' || item.category === filter);
const unreadCount = ITEMS.filter((item) => item.unread && !readIds.includes(item.id)).length;
const markAllRead = () => {
    setReadIds(ITEMS.map((item) => item.id));
  };
const markOneRead = (id: string) => {
    setReadIds((current) => (current.includes(id) ? current : [...current, id]));
  };
return { router, insets, filter, setFilter, readIds, filteredItems, unreadCount, markAllRead, markOneRead };
}
