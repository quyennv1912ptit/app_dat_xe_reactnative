import {
  getLocale,
  translate as i18nT,
  type CustomerRideSummary,
} from "@datxe/shared";
import {
  Button,
  MoneyText,
  MotionPressable as Pressable,
  SharedStatusBadge,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import {
  styles as createStyles,
  labelForStatus,
} from "./TripHistoryScreenParts";

export function HistoryRideListItem({
  ride,
  onPress,
  onRate,
}: {
  ride: CustomerRideSummary;
  onPress: () => void;
  onRate?: () => void;
}) {
  useLanguage();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const statusTone =
    ride.status === "CANCELLED" ||
    ride.status === "FAILED_SYSTEM" ||
    ride.status === "NO_DRIVER_FOUND" ||
    ride.status === "EXPIRED"
      ? "danger"
      : ride.status === "COMPLETED"
        ? "success"
        : "active";

  return (
    <View style={{ gap: 8 }}>
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.ride}>
      <View style={styles.rideHeader}>
        <View style={styles.rideTitleRow}>
          <Text style={styles.rideTitle}>
            {i18nT("Chuyến #{0}", { 0: ride.id })}
          </Text>
        </View>
        <SharedStatusBadge
          label={i18nT(labelForStatus[ride.status] ?? "Đang cập nhật trạng thái")}
          tone={statusTone}
        />
      </View>
      <View style={styles.addressRow}>
        <Text style={styles.pin}>{i18nT("Đón:")}</Text>
        <Text style={styles.address}>
          {ride.pickupAddress || i18nT("Chưa có địa chỉ")}
        </Text>
      </View>
      <View style={styles.addressRow}>
        <Text style={styles.pin}>{i18nT("Đến:")}</Text>
        <Text style={styles.address}>
          {ride.dropoffAddress || i18nT("Chưa có địa chỉ")}
        </Text>
      </View>
      <Text style={styles.meta}>
        {i18nT(new Date(ride.createdAt).toLocaleString(getLocale()))} ·{" "}
        {i18nT(
          ride.type === "INSTANT"
            ? "Đặt ngay"
            : i18nT("Đón lúc {0}", {
                "0": ride.scheduledAt
                  ? new Date(ride.scheduledAt).toLocaleString(getLocale())
                  : "theo lịch",
              }),
        )}
      </Text>
      <View style={styles.rideFooter}>
        {!["CANCELLED", "NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"].includes(ride.status) || ride.finalFare != null ? (
          <View style={styles.fareCopy}>
            <Text style={styles.meta}>
              {i18nT(ride.finalFare == null ? "Giá dự kiến" : "Cước chuyến đi")}
              {ride.status === "COMPLETED" && ride.hasRated && ride.myRatingStars
                ? ` · ${i18nT("Đã đánh giá {0} ★", { 0: ride.myRatingStars })}`
                : ""}
            </Text>
            <MoneyText value={ride.finalFare ?? ride.payableFare ?? ride.estimatedFare} style={styles.fare} />
          </View>
        ) : (
          <View style={styles.fareCopy}>
            <Text style={styles.meta}>
              {i18nT(ride.status === "CANCELLED" ? "Chuyến đã hủy · Không thu cước" : "Chuyến chưa thực hiện · Không thu cước")}
            </Text>
          </View>
        )}
        <MaterialIcons
          name="chevron-right"
          size={23}
          color={colors.onSurfaceVariant}
        />
      </View>
    </Pressable>
    {ride.status === "COMPLETED" && onRate ? (
      ride.hasRated ? (
        <Button
          label={
            ride.myRatingStars
              ? i18nT("Đã đánh giá ({0}/5 sao)", { 0: ride.myRatingStars })
              : i18nT("Đã đánh giá chuyến đi")
          }
          icon="check-circle"
          variant="ghost"
          onPress={onRate}
        />
      ) : (
        <Button label={i18nT("Đánh giá chuyến đi")} icon="star" variant="secondary" onPress={onRate} />
      )
    ) : null}
    </View>
  );
}
