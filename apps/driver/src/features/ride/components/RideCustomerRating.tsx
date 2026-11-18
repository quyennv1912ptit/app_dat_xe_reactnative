import { AuthApiError } from "@datxe/shared";
import { Button, Card, FilterChip, MotionPressable, PaperTextInput, Typography, spacing, typography, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { rateRideCustomer, type DriverMyRating } from "../api";

const QUICK_TAGS = [
  "Khách lịch sự",
  "Đúng giờ hẹn",
  "Dễ tìm điểm đón",
  "Giao tiếp thân thiện",
];

export function RideCustomerRating({
  rideId,
  rated,
  existingRating,
}: {
  rideId: number;
  rated: boolean;
  existingRating?: DriverMyRating | null;
}) {
  const client = useQueryClient();
  const colors = useThemeColors();
  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [skipped, setSkipped] = useState(false);
  const submitting = useRef(false);
  const rating = useMutation({
    mutationFn: async () => {
      try {
        await rateRideCustomer(rideId, stars, comment, selectedTags);
      } catch (error) {
        if (!(error instanceof AuthApiError && error.code === "RATING_ALREADY_EXISTS")) throw error;
      }
    },
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["driver", "ride", rideId], exact: true }),
        client.invalidateQueries({ queryKey: ["driver", "ride", rideId, "my-rating"], exact: true }),
      ]),
    onSettled: () => { submitting.current = false; },
  });

  if (rated || rating.isSuccess) {
    const lockedStars = existingRating?.stars;
    const lockedTags = existingRating?.tags ?? [];
    const lockedComment = existingRating?.comment?.trim();
    return (
      <Card style={styles.card}>
        <Typography style={typography.cardTitle}>Đã đánh giá khách hàng</Typography>
        {lockedStars ? (
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(value => (
              <MaterialIcons
                key={value}
                name={value <= lockedStars ? "star" : "star-border"}
                size={24}
                color={value <= lockedStars ? colors.primary : colors.outline}
              />
            ))}
          </View>
        ) : null}
        {lockedTags.length ? (
          <Typography style={[typography.label, { color: colors.onSurfaceVariant }]}>
            {lockedTags.join(" · ")}
          </Typography>
        ) : null}
        {lockedComment ? (
          <Typography style={typography.bodySecondary}>{lockedComment}</Typography>
        ) : null}
      </Card>
    );
  }
  if (skipped) return null;

  const toggleTag = (tag: string) => {
    if (rating.isPending) return;
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  return (
    <Card style={styles.card}>
      <Typography accessibilityRole="header" style={typography.cardTitle}>Đánh giá khách hàng (Ẩn danh)</Typography>
      <Typography style={[typography.bodySecondary, { color: colors.onSurfaceVariant }]}>
        Nhận xét của bạn hoàn toàn ẩn danh và chỉ gửi 1 lần cho chuyến này.
      </Typography>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(value => (
          <MotionPressable key={value} style={styles.star} accessibilityRole="radio"
            accessibilityLabel={`${value} sao`} accessibilityState={{ checked: stars === value, disabled: rating.isPending }}
            disabled={rating.isPending} onPress={() => setStars(value)}>
            <MaterialIcons name={value <= stars ? "star" : "star-border"} size={26} color={colors.primary} />
          </MotionPressable>
        ))}
      </View>
      <View style={styles.tags}>
        {QUICK_TAGS.map(tag => (
          <FilterChip
            key={tag}
            label={tag}
            selected={selectedTags.includes(tag)}
            disabled={rating.isPending}
            onPress={() => toggleTag(tag)}
          />
        ))}
      </View>
      <PaperTextInput label="Nhận xét (tùy chọn)" draftValue={comment} onChangeText={setComment}
        multiline maxLength={2000} editable={!rating.isPending} />
      {!stars ? <Typography style={typography.bodySecondary}>Chọn số sao để gửi đánh giá.</Typography> : null}
      {rating.error ? <Typography accessibilityRole="alert" style={{ color: colors.error }}>{rating.error.message}</Typography> : null}
      <Button label="Gửi đánh giá" variant="secondary" disabled={!stars} loading={rating.isPending}
        onPress={() => {
          if (!stars || submitting.current) return;
          submitting.current = true;
          rating.mutate();
        }} />
      <Button label="Bỏ qua" variant="ghost" disabled={rating.isPending} onPress={() => setSkipped(true)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceMd, gap: spacing.spaceSm },
  stars: { flexDirection: "row", flexWrap: "wrap", gap: spacing.spaceSm },
  star: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.spaceSm },
});
