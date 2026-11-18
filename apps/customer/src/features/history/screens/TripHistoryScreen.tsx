import { HistoryRideListItem } from "../components/HistoryRideListItem";
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
import { translate as i18nT } from "@datxe/shared";
import {
  FilterChip,
  MotionPressable as Pressable,
  PaperTextInput,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { useCallback } from "react";
import { FlatList, RefreshControl, View, type ListRenderItem } from "react-native";
import type { CustomerRideSummary } from "@datxe/shared";

import { styles as base_styles } from "../components/TripHistoryScreenParts";
import { useTripHistory } from "../hooks/useTripHistory";
export default function TripHistoryScreen() {
  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const {
    router,
    filter,
    setFilter,
    search,
    setSearch,
    days,
    setPeriod,
    filtered,
    rides,
    total,
    page,
    hasNext,
    loading,
    loadingMore,
    refreshing,
    refresh,
    error,
    unreadCount,
    load,
  } = useTripHistory();

  const renderRide = useCallback<ListRenderItem<CustomerRideSummary>>(
    ({ item: ride }) => (
      <HistoryRideListItem
        ride={ride}
        onPress={() =>
          router.push({
            pathname: "/ride/[id]",
            params: {
              id: String(ride.id),
              rideId: String(ride.id),
              returnTo: "history",
            },
          })
        }
      />
    ),
    [router],
  );

  const listHeader = (
    <View style={styles.list}>
      <View style={styles.summary}>
        <Text style={styles.summaryCount}>{i18nT(total)}</Text>
        <Text style={styles.summaryText}>
          {i18nT(filtered ? "chuyến phù hợp" : "chuyến trong tài khoản")}
        </Text>
      </View>
      <View style={styles.filters}>
        {(
          [
            ["all", i18nT("Tất cả")],
            ["completed", i18nT("Hoàn thành")],
            ["cancelled", i18nT("Đã hủy")],
          ] as const
        ).map(([key, label]) => (
          <FilterChip
            key={key}
            label={i18nT(label)}
            selected={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </View>
      <PaperTextInput
        label={i18nT("Tìm mã chuyến hoặc địa chỉ")}
        draftValue={search}
        onChangeText={setSearch}
        maxLength={100}
        returnKeyType="search"
      />
      <View style={styles.filters}>
        {([[0, "Mọi thời điểm"], [7, "7 ngày qua"], [30, "30 ngày qua"]] as const).map(([period, label]) => (
          <FilterChip
            key={period}
            label={i18nT(label)}
            selected={days === period}
            onPress={() => setPeriod(period)}
          />
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice> : null}
      {!loading && !error && rides.length === 0 ? (
        <EmptyStateCard
          icon="history"
          title={i18nT(
            !filtered
              ? "Chưa có chuyến đi nào"
              : "Chưa có chuyến phù hợp",
          )}
          description={i18nT(
            !filtered
              ? "Các chuyến đi của bạn sẽ xuất hiện ở đây."
              : "Thử xem tất cả chuyến đi để tìm chuyến bạn cần.",
          )}
          actionLabel={
            !filtered
              ? i18nT("Đặt chuyến đầu tiên")
              : i18nT("Xem tất cả chuyến")
          }
          onAction={() => {
            if (!filtered) {
              router.push("/ride/route-selection");
              return;
            }
            setFilter("all");
            setSearch("");
            setPeriod(0);
          }}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Lịch sử")}
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
        data={rides}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRide}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          hasNext ? (
            <Pressable
              accessibilityRole="button"
              disabled={loadingMore}
              onPress={() => void load(page + 1, true)}
              style={styles.more}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.moreText}>{i18nT("Tải thêm chuyến")}</Text>
              )}
            </Pressable>
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNext && !loadingMore && !loading) void load(page + 1, true);
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
      <CustomerTabBar active="history" unreadCount={unreadCount} />
    </SafeAreaView>
  );
}
