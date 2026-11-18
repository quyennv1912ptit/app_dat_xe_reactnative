import { DriverPage } from "@/components/DriverPage";
import { StatusBadge } from "@/components/StatusBadge";
import { statusLabel } from "@/lib/displayLabels";
import { rideStyles } from "@/components/rideStyles";
import { formatMoney } from "@datxe/shared";
import {
  Button,
  Card,
  FilterChip,
  Input,
  MoneyText,
  SectionHeading,
  Typography as Text,
  borderRadius,
  spacing,
  typography,
  useDebouncedTextChange,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { useHistory } from "../hooks/useHistory";

type DriverHistoryTrip = NonNullable<
  NonNullable<ReturnType<typeof useHistory>["data"]>["pages"][number]
>["content"][number];

const statusFilters = [
  { value: "all", label: "Tất cả" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
] as const;

const TripHistoryRow = memo(function TripHistoryRow({
  trip,
  onOpen,
}: {
  trip: DriverHistoryTrip;
  onOpen: (id: number) => void;
}) {
  const colors = useThemeColors();
  const pickup = trip.pickupAddress ?? "Chưa có địa chỉ";
  const dropoff = trip.dropoffAddress ?? "Chưa có địa chỉ";
  const fare = formatMoney(trip.finalFare ?? trip.estimatedFare);
  const date = new Date(trip.createdAt).toLocaleString("vi-VN");
  const statusText = statusLabel("ride", trip.status).label;

  return (
    <Card style={styles.tripCard}>
      <TouchableRipple
        onPress={() => onOpen(trip.id)}
        accessibilityRole="button"
        accessibilityLabel={`Chuyến ${trip.id}, ${statusText}. ${date}. Đón tại ${pickup}. Trả tại ${dropoff}.${trip.status === "CANCELLED" ? "" : ` Cước ${fare}.`}`}
        style={styles.trip}
      >
        <View style={styles.tripContent}>
          <View style={styles.tripHeader}>
            <Text style={[typography.labelLg, styles.tripId]}>Chuyến #{trip.id}</Text>
            <View style={styles.tripStatus}><StatusBadge kind="ride" value={trip.status} /></View>
          </View>
          <View style={[styles.stop, styles.pickup]}>
            <View style={styles.dashedRail}>
              {[0, 1, 2, 3].map((dash) => (
                <View key={dash} style={[styles.dash, { backgroundColor: colors.outlineVariant }]} />
              ))}
            </View>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[typography.bodyMd, styles.address]}>{pickup}</Text>
          </View>
          <View style={styles.stop}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={[typography.bodyMd, styles.address]}>{dropoff}</Text>
          </View>
          <View style={styles.tripFooter}>
            <Text style={[typography.labelMd, styles.tripDate, { color: colors.onSurfaceVariant }]}>{date}</Text>
            {trip.status !== "CANCELLED" ? (
              <MoneyText value={trip.finalFare ?? trip.estimatedFare} variant="title" color={colors.primary} style={styles.fare} />
            ) : null}
          </View>
        </View>
      </TouchableRipple>
    </Card>
  );
});

export default function HistoryScreen() {
  const s = useThemedStyles(rideStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInputKey, setSearchInputKey] = useState(0);
  const searchInput = useDebouncedTextChange(setSearch);
  const weekCreatedFrom = useMemo(() => {
    if (period !== "week") return undefined;
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() - 6);
    return value.toISOString();
  }, [period]);
  const queryFilters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      q: search.trim() || undefined,
      createdFrom: weekCreatedFrom,
    }),
    [search, status, weekCreatedFrom],
  );
  const q = useHistory(queryFilters);
  const trips = useMemo(
    () => q.data?.pages.flatMap((page) => page?.content ?? []) ?? [],
    [q.data],
  );
  const filtered = status !== "all" || period !== "all" || search.trim().length > 0;
  const hasMore = Boolean(q.hasNextPage);
  const clearFilters = useCallback(() => {
    setStatus("all");
    setPeriod("all");
    setSearch("");
    setSearchInputKey((current) => current + 1);
  }, []);
  const open = useCallback(
    (id: number) => router.push({ pathname: "/ride/complete", params: { rideId: String(id) } }),
    [router],
  );
  const renderItem = useCallback(
    ({ item }: { item: DriverHistoryTrip }) => <TripHistoryRow trip={item} onOpen={open} />,
    [open],
  );

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.chips}>
        {statusFilters.map((item) => (
          <FilterChip
            key={item.value}
            label={item.label}
            selected={status === item.value}
            onPress={() => setStatus(item.value)}
          />
        ))}
        <FilterChip
          label="7 ngày gần nhất"
          selected={period === "week"}
          onPress={() => setPeriod((current) => (current === "week" ? "all" : "week"))}
        />
      </View>
      {period === "week" ? (
        <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
          Hiển thị các chuyến trong 7 ngày qua.
        </Text>
      ) : null}
      <View style={styles.filters}>
        <Input
          key={searchInputKey}
          label="Tìm chuyến"
          defaultValue={search}
          onChangeText={searchInput.onChangeText}
          maxLength={200}
          placeholder="Địa chỉ đón/trả, biển số hoặc #mã chuyến"
        />
      </View>
      {trips.length ? <SectionHeading title="Danh sách chuyến" /> : null}
    </View>
  );

  const empty = !q.isLoading && !q.error ? (
    <Card style={s.card}>
      <Text>
        {filtered
          ? "Không có chuyến phù hợp với bộ lọc."
          : "Bạn chưa có chuyến đi."}
      </Text>
      {filtered ? (
        <Button variant="ghost" label="Xóa bộ lọc" onPress={clearFilters} />
      ) : (
        <Button variant="ghost" label="Về trang chủ" onPress={() => router.navigate("/(tabs)/home")} />
      )}
    </Card>
  ) : null;

  const footer = hasMore ? (
    <Button
      variant="secondary"
      label="Tải thêm chuyến"
      loading={q.isFetchingNextPage}
      onPress={() => void q.fetchNextPage()}
    />
  ) : null;

  return (
    <DriverPage title="Lịch sử chuyến" tabs scroll={false} loading={q.isLoading} error={q.error?.message} retry={q.refetch}>
      <FlatList
        data={trips}
        keyExtractor={(trip) => String(trip.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty ?? undefined}
        ListFooterComponent={footer ?? undefined}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching && !q.isFetchingNextPage}
            onRefresh={() => void q.refetch()}
          />
        }
      />
    </DriverPage>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.spaceMd, gap: spacing.px3, paddingBottom: spacing.spaceXl },
  headerBlock: { gap: spacing.px3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.spaceSm },
  chip: { minHeight: 48, justifyContent: "center" },
  target: { minHeight: 48 },
  filters: { gap: spacing.spaceSm, paddingVertical: spacing.spaceSm },
  tripCard: { padding: 0 },
  trip: { borderRadius: borderRadius.default, overflow: "hidden" },
  tripContent: { padding: spacing.spaceMd, gap: spacing.spaceSm },
  tripHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  tripId: { ...typography.cardTitle, flexShrink: 0 },
  tripStatus: { flexShrink: 0, maxWidth: "100%" },
  stop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.spaceSm },
  pickup: { paddingBottom: spacing.spaceXs },
  address: { flex: 1, minWidth: 0 },
  tripFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.spaceSm,
    paddingTop: spacing.spaceXs,
  },
  tripDate: { flexShrink: 1 },
  fare: { ...typography.cardTitle, fontVariant: ["tabular-nums"] },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  dashedRail: { position: "absolute", left: 3, top: 16, bottom: -8, justifyContent: "space-evenly" },
  dash: { width: 2, height: 2 },
});
