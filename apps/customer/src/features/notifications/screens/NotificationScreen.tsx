import { NotificationListItem } from "../components/NotificationListItem";
import { CustomerNotice } from "@/components/CustomerRideUI";
import { ActivityIndicator } from "react-native-paper";
import { CustomerTabBar } from "@/components/CustomerTabBar";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  HEADER_SAFETY_ACTION_WIDTH,
  HeaderActionGroup,
  HeaderLabeledIconButton,
  ScreenHeader,
} from "@/components/ScreenHeader";
import { getLocale, translate as i18nT, type CustomerNotification } from "@datxe/shared";
import {
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { useCallback, useMemo } from "react";
import { FlatList, RefreshControl, View, type ListRenderItem } from "react-native";

import { styles as base_styles } from "../components/NotificationScreenParts";
import { useNotification } from "../hooks/useNotification";

type NotificationRow =
  | { type: "header"; key: string; day: string }
  | { type: "item"; key: string; item: CustomerNotification };

export default function NotificationScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    filter,
    setFilter,
    items,
    unreadCount,
    loading,
    error,
    refreshing,
    refresh,
    markAll,
    openNotification,
    visible,
  } = useNotification();

  const rows = useMemo<NotificationRow[]>(() => {
    const groups = new Map<string, CustomerNotification[]>();
    for (const item of visible) {
      const day = new Date(item.createdAt).toLocaleDateString(getLocale());
      const group = groups.get(day);
      if (group) group.push(item);
      else groups.set(day, [item]);
    }
    const flattened: NotificationRow[] = [];
    for (const [day, group] of groups) {
      flattened.push({ type: "header", key: `day:${day}`, day });
      for (const item of group) {
        flattened.push({ type: "item", key: `notif:${item.id}`, item });
      }
    }
    return flattened;
  }, [visible]);

  const renderRow = useCallback<ListRenderItem<NotificationRow>>(
    ({ item: row }) =>
      row.type === "header" ? (
        <Text accessibilityRole="header" style={styles.meta}>{row.day}</Text>
      ) : (
        <NotificationListItem item={row.item} onPress={() => void openNotification(row.item)} />
      ),
    [openNotification, styles.meta],
  );

  const listHeader = (
    <View style={styles.list}>
      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.heading}>{i18nT("Hộp thư thông báo")}</Text>
          <Text style={styles.meta}>
            {i18nT(unreadCount)} {i18nT("thông báo chưa đọc")}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            style={styles.markAllButton}
            disabled={unreadCount === 0}
            onPress={() => void markAll()}
          >
            <Text style={[styles.markAll, unreadCount === 0 && styles.dim]}>
              {i18nT("Đọc tất cả")}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.filters}>
        {(
          [
            ["all", i18nT("Tất cả")],
            ["trip", i18nT("Chuyến đi")],
            ["promo", i18nT("Ưu đãi")],
            ["vehicle", "Xe"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === key }}
            onPress={() => setFilter(key)}
            style={[styles.filter, filter === key && styles.filterActive]}
          >
            <Text
              textBreakStrategy="simple"
              style={[
                styles.filterText,
                filter === key && styles.filterTextActive,
              ]}
            >
              {i18nT(label)}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
      {!loading && !error && !visible.length ? (
        <EmptyStateCard
          icon="notifications-none"
          title={i18nT(
            items.length === 0
              ? "Chưa có thông báo"
              : "Không có thông báo trong mục này",
          )}
          description={i18nT(
            items.length === 0
              ? "Thông báo về chuyến đi và ưu đãi sẽ xuất hiện tại đây."
              : "Thử xem tất cả thông báo để tìm nội dung khác.",
          )}
          actionLabel={
            items.length === 0
              ? i18nT("Đặt chuyến đầu tiên")
              : i18nT("Xem tất cả thông báo")
          }
          onAction={() =>
            items.length === 0
              ? router.push("/ride/route-selection")
              : setFilter("all")
          }
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Thông báo")}
        largeTitle
        sideSlotWidth={HEADER_SAFETY_ACTION_WIDTH}
        rightContent={
          <HeaderActionGroup>
            <HeaderLabeledIconButton
              icon="shield"
              label={i18nT("An toàn")}
              accessibilityLabel={i18nT("An toàn chuyến đi")}
              onPress={() =>
                router.push({
                  pathname: "/support",
                  params: { topic: "safety" },
                })
              }
            />
          </HeaderActionGroup>
        }
      />
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refresh()}
            progressBackgroundColor={colors.cardSurface}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        style={styles.scroll}
      />
      <CustomerTabBar active="notifications" unreadCount={unreadCount} />
    </SafeAreaView>
  );
}
