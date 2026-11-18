import { AuthApiError } from "@datxe/shared";
import { Button, Card, MotionPressable, PaperTextInput, Typography, spacing, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { rateRideCustomer } from "../api";

export function RideCustomerRating({ rideId, rated }: { rideId: number; rated: boolean }) {
  const client = useQueryClient();
  const colors = useThemeColors();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [skipped, setSkipped] = useState(false);
  const submitting = useRef(false);
  const rating = useMutation({
    mutationFn: async () => {
      try {
        await rateRideCustomer(rideId, stars, comment);
      } catch (error) {
        if (!(error instanceof AuthApiError && error.code === "RATING_ALREADY_EXISTS")) throw error;
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["driver", "ride", rideId], exact: true }),
    onSettled: () => { submitting.current = false; },
  });

  if (rated || rating.isSuccess) return <Card style={styles.card}><Typography>Đã đánh giá khách hàng</Typography></Card>;
  if (skipped) return null;

  return (
    <Card style={styles.card}>
      <Typography accessibilityRole="header">Đánh giá khách hàng</Typography>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(value => (
          <MotionPressable key={value} style={styles.star} accessibilityRole="radio"
            accessibilityLabel={`${value} sao`} accessibilityState={{ checked: stars === value, disabled: rating.isPending }}
            disabled={rating.isPending} onPress={() => setStars(value)}>
            <MaterialIcons name={value <= stars ? "star" : "star-border"} size={26} color={colors.primary} />
          </MotionPressable>
        ))}
      </View>
      <PaperTextInput label="Nhận xét (tùy chọn)" draftValue={comment} onChangeText={setComment}
        multiline maxLength={2000} editable={!rating.isPending} />
      {!stars ? <Typography>Chọn số sao để gửi đánh giá.</Typography> : null}
      {rating.error ? <Typography accessibilityRole="alert">{rating.error.message}</Typography> : null}
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
});
