import { DriverPage } from "@/components/DriverPage";
import { resolveDriverNotification } from "@/lib/notificationDestination";
import { isVisibleDriverNotification, unreadDriverNotifications } from "@/lib/notificationVisibility";
import { useSessionStore } from "@/lib/store";
import { useMutation } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { getLocale, getNotificationText, type CustomerNotification } from "@datxe/shared";
import { rideStyles as s } from "@/components/rideStyles";
import {
  Button,
  Card,
  FilterChip,
  SectionHeading,
  SettingsListItem,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  useTranslation,
} from "@datxe/ui";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNotifications } from "../hooks/useNotifications";

type NotificationRow =
  | { key: string; kind: "header"; date: string }
  | { key: string; kind: "item"; item: CustomerNotification };

const NotificationCard = memo(function NotificationCard({
  item,
  disabled,
  onPress,
}: {
  item: CustomerNotification;
  disabled: boolean;
  onPress: (item: CustomerNotification) => void;
}) {
  const t = useTranslation();
  const colors = useThemeColors();
  const text = getNotificationText(item.type, item.payload, t);
  const timeText = new Date(item.createdAt).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
  const unread = !item.readAt;
  return (
    <Card style={styles.rowCard}>
      <SettingsListItem
        title={unread ? `${text.title} · Chưa đọc` : text.title}
        description={`${text.description}\n${timeText}`}
        icon={unread ? "notifications" : "notifications-none"}
        disabled={disabled}
        right={unread ? (
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.unreadDot, { backgroundColor: colors.primary }]}
          />
        ) : undefined}
        onPress={() => onPress(item)}
      />
    </Card>
  );
});

export default function NotificationsScreen() {
  const themed_s = useThemedStyles(s);
  const { query: q, mark } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const allItems = useMemo(
    () => (q.data ?? []).filter(isVisibleDriverNotification),
    [q.data],
  );
  const items = useMemo(
    () => (unreadOnly ? allItems.filter((item) => !item.readAt) : allItems),
    [allItems, unreadOnly],
  );
  const unread = unreadDriverNotifications(q.data);
  const rows = useMemo<NotificationRow[]>(() => {
    const groups = new Map<string, CustomerNotification[]>();
    for (const item of items) {
      const date = new Date(item.createdAt).toLocaleDateString(getLocale());
      const group = groups.get(date);
      if (group) group.push(item);
      else groups.set(date, [item]);
    }
    const flattened: NotificationRow[] = [];
    for (const [date, group] of groups) {
      flattened.push({ key: `header:${date}`, kind: "header", date });
      for (const item of group) {
        flattened.push({ key: `item:${item.id}`, kind: "item", item });
      }
    }
    return flattened;
  }, [items]);

  const router = useRouter();
  const [notice, setNotice] = useState("");
  const open = useMutation({
    mutationFn: async ({ item, userId }: { item: CustomerNotification; userId: number }) => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error("Phiên đăng nhập đã thay đổi.");
      return resolveDriverNotification({ type: item.type, payload: item.payload, messageId: item.messageId });
    },
  });
  const openItem = useCallback((item: CustomerNotification) => {
    setNotice("");
    const userId = useSessionStore.getState().user?.id;
    if (!userId) return;
    if (!item.readAt) mark.mutate(item.id);
    open.mutate({ item, userId }, { onSuccess: ({ notice: nextNotice, ...destination }) => {
      if (useSessionStore.getState().user?.id !== userId) return;
      if (nextNotice) setNotice(nextNotice);
      else if (destination.pathname !== "/(tabs)/notifications") router.push(destination as Href);
    } });
  }, [mark, open, router]);

  const renderItem = useCallback(({ item: row }: { item: NotificationRow }) => {
    if (row.kind === "header") return <SectionHeading title={row.date} />;
    return <NotificationCard item={row.item} disabled={open.isPending} onPress={openItem} />;
  }, [open.isPending, openItem]);

  const header = (
    <View style={styles.header}>
      <View style={styles.toolbar}>
        <View style={styles.chips}>
          <FilterChip
            label="Tất cả"
            selected={!unreadOnly}
            onPress={() => setUnreadOnly(false)}
            style={styles.chip}
          />
          <FilterChip
            label={unread ? `Chưa đọc (${unread})` : "Chưa đọc"}
            selected={unreadOnly}
            onPress={() => setUnreadOnly(true)}
            style={styles.chip}
          />
        </View>
        {unread ? (
          <Button
            variant="ghost"
            style={styles.markAll}
            disabled={mark.isPending}
            label="Đánh dấu đã đọc hết"
            onPress={() => mark.mutate(null)}
          />
        ) : null}
      </View>
      <Button variant="ghost" label="Kiểm tra quyền thông báo" onPress={() => router.push("/settings/reception")} />
      {notice ? <Card style={themed_s.card}><Text accessibilityRole="alert" style={typography.bodySecondary}>{notice}</Text></Card> : null}
    </View>
  );

  const empty = !q.isLoading && !q.error ? (
    <Card style={themed_s.card}>
      <Text style={themed_s.text}>{unreadOnly ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."}</Text>
    </Card>
  ) : null;

  return (
    <DriverPage
      title="Thông báo"
      tabs
      scroll={false}
      loading={q.isLoading}
      error={q.error?.message || mark.error?.message || open.error?.message}
      retry={q.error ? q.refetch : undefined}
    >
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ?? undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />
        }
      />
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.spaceMd, gap: spacing.spaceSm + spacing.xxs, paddingBottom: spacing.spaceXl },
  header: { gap: spacing.spaceSm },
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.spaceSm },
  chip: { minHeight: 48, justifyContent: "center" },
  markAll: { width: "auto" },
  rowCard: { padding: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: 999 },
});
