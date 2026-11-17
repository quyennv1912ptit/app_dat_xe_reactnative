import { request } from "@/lib/api";
import { AuthApiError, type Ride } from "@datxe/shared";
import {
  Button,
  Card,
  Input,
  MotionPressable as Pressable,
  Typography as Text,
  localizedAlert,
  useThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type DriverMyRating = {
  rideId: number;
  direction: string;
  driverId: number | null;
  customerId: number | null;
  stars: number;
  comment: string | null;
  tip: number;
  tags: string[];
};

const QUICK_TAGS = [
  "Khách lịch sự",
  "Đúng giờ hẹn",
  "Dễ tìm điểm đón",
  "Giao tiếp thân thiện",
];

export function DriverRateCustomerCard({ ride }: { ride: Ride }) {
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const myRatingQuery = useQuery({
    queryKey: ["driver", "ride", ride.id, "my-rating"],
    queryFn: () =>
      request<DriverMyRating | null>(`/driver/rides/${ride.id}/rating/me`, {
        method: "GET",
        allowNull: true,
      }),
    enabled: ride.status === "COMPLETED",
    retry: false,
  });

  const existing = myRatingQuery.data;
  const alreadyRated = Boolean(existing || ride.hasRated);

  const [draftStars, setStars] = useState(5);
  const [draftTags, setSelectedTags] = useState<string[]>([]);
  const [draftComment, setComment] = useState("");

  const fromRide = !existing && ride.hasRated && Boolean(ride.myRatingStars);
  const stars = existing?.stars ?? (fromRide ? ride.myRatingStars! : draftStars);
  const selectedTags = existing ? existing.tags ?? [] : draftTags;
  const comment = existing ? existing.comment ?? "" : fromRide ? ride.myRatingComment ?? "" : draftComment;

  const submitMutation = useMutation({
    mutationFn: () =>
      request(`/driver/rides/${ride.id}/rating`, {
        method: "POST",
        body: {
          stars,
          tags: selectedTags.length ? selectedTags : null,
          comment: comment.trim() || null,
          tip: 0,
        },
        allowNull: true,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["driver", "ride", ride.id] }),
        queryClient.invalidateQueries({ queryKey: ["driver", "ride", ride.id, "my-rating"] }),
        queryClient.invalidateQueries({ queryKey: ["driver", "history"] }),
      ]);
      localizedAlert("Đã gửi đánh giá", "Cảm ơn bạn! Đánh giá ẩn danh về khách hàng đã được ghi nhận.");
    },
    onError: async (err) => {
      if (err instanceof AuthApiError && err.code === "RATING_ALREADY_EXISTS") {
        await myRatingQuery.refetch();
        localizedAlert("Đánh giá khách hàng", "Bạn đã đánh giá khách hàng cho chuyến đi này rồi.");
        return;
      }
      localizedAlert(
        "Chưa gửi được đánh giá",
        err instanceof Error ? err.message : "Vui lòng thử lại sau.",
      );
    },
  });

  if (ride.status !== "COMPLETED") return null;

  const toggleTag = (tag: string) => {
    if (alreadyRated || submitMutation.isPending) return;
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.title}>
          {alreadyRated ? "Đánh giá khách hàng (Đã khóa)" : "Đánh giá khách hàng (Ẩn danh)"}
        </Text>
      </View>
      <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
        {alreadyRated
          ? "Mỗi chuyến đi chỉ được đánh giá 1 lần. Nội dung đánh giá hiển thị ẩn danh."
          : "Nhận xét của bạn hoàn toàn ẩn danh, giúp nâng cao chất lượng cộng đồng khách hàng."}
      </Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            disabled={alreadyRated || submitMutation.isPending}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === stars, disabled: alreadyRated }}
            accessibilityLabel={`${value} sao`}
            onPress={() => { if (!alreadyRated) setStars(value); }}
            style={styles.starBtn}
          >
            <MaterialIcons
              name={value <= stars ? "star" : "star-border"}
              size={34}
              color={value <= stars ? colors.onWarningContainer : colors.outline}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.tagsWrap}>
        {(alreadyRated ? selectedTags : QUICK_TAGS).map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <Pressable
              key={tag}
              disabled={alreadyRated || submitMutation.isPending}
              onPress={() => toggleTag(tag)}
              style={[
                styles.tagChip,
                {
                  backgroundColor: active ? colors.primaryContainer : colors.surfaceContainerLow,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: active ? colors.onPrimaryContainer : colors.onSurface },
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {alreadyRated ? (
        comment.trim() ? (
          <Text style={styles.readonlyComment}>{comment.trim()}</Text>
        ) : null
      ) : (
        <>
          <Input
            label="Nhận xét thêm (không bắt buộc)"
            value={comment}
            onChangeText={setComment}
            placeholder="Ví dụ: Khách thân thiện, hợp tác tốt..."
            maxLength={500}
          />
          <Button
            label="Gửi đánh giá khách hàng"
            icon="star"
            iconPosition="leading"
            loading={submitMutation.isPending}
            loadingLabel="Đang gửi..."
            onPress={() => submitMutation.mutate()}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 17, fontWeight: "700" },
  hint: { fontSize: 13, lineHeight: 18 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 4 },
  starBtn: { padding: 4 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagText: { fontSize: 13, fontWeight: "600" },
  readonlyComment: { fontSize: 14, lineHeight: 20, fontStyle: "italic" },
});