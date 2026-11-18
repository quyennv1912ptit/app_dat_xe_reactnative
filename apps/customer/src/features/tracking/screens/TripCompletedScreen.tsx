import { CustomerPaymentSummary } from "@/components/CustomerPaymentSummary";
import { CustomerNotice, customerType, RideEndpoints } from "@/components/CustomerRideUI";
import { ScreenHeader } from "@/components/ScreenHeader";
import { translate as i18nT } from "@datxe/shared";
import {
  Card,
  MotionPressable as Pressable,
  ScreenWrapper as SafeAreaView,
  Typography as Text,
  ThemedTextInput as TextInput,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRef, type ComponentRef } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { styles as base_styles } from "../components/TripCompletedScreenParts";
import { useTripCompleted } from "../hooks/useTripCompleted";

export default function TripCompletedScreen() {
  useLanguage();
  const colors = useThemeColors();
  const styles = useThemedStyles(base_styles);

  const {
    ride,
    stars,
    setStars,
    comment,
    setComment,
    saving,
    alreadyRated,
    hasRatingDetail,
    checkingRating,
    error,
    canGoBack,
    leave,
    refresh,
    finish,
  } = useTripCompleted();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={i18nT("Hoàn thành chuyến")}
        backIcon={canGoBack ? undefined : "home"}
        backAccessibilityLabel={i18nT(canGoBack ? "Quay lại" : "Về trang chủ")}
        onBack={leave}
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {ride?.status === "COMPLETED" ? (
            <View style={styles.success}>
              <MaterialIcons name="check-circle" size={54} color={colors.successStrong} />
              <Text style={styles.heading}>{i18nT("Chuyến đi đã hoàn thành")}</Text>
            </View>
          ) : null}

          {ride ? (
            <>
              <CustomerPaymentSummary ride={ride} />
              <Card style={styles.card}>
                <RideEndpoints pickup={ride.pickupAddress} dropoff={ride.dropoffAddress} />
              </Card>
            </>
          ) : !error ? (
            <ActivityIndicator color={colors.primary} />
          ) : null}

          {error ? (
            <CustomerNotice onRetry={() => void refresh()}>{i18nT(error)}</CustomerNotice>
          ) : null}

          {ride?.status === "COMPLETED" && ride.driverId ? (
            <Card style={styles.card}>
              <Text style={styles.section}>
                {alreadyRated
                  ? i18nT("Đánh giá của bạn (Đã khóa)")
                  : i18nT("Đánh giá tài xế (Ẩn danh)")}
              </Text>
              <Text style={styles.meta}>
                {alreadyRated
                  ? i18nT("Mỗi chuyến đi chỉ được đánh giá 1 lần. Đánh giá của bạn được lưu ẩn danh.")
                  : i18nT("Đánh giá của bạn hoàn toàn ẩn danh và chỉ được gửi 1 lần cho chuyến đi này.")}
              </Text>

              {checkingRating ? (
                <ActivityIndicator color={colors.primary} />
              ) : alreadyRated && !hasRatingDetail ? (
                <View style={styles.success}>
                  <MaterialIcons name="verified" size={24} color={colors.successStrong} />
                  <Text style={styles.section}>{i18nT("Bạn đã đánh giá tài xế cho chuyến đi này.")}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Pressable
                        key={value}
                        disabled={alreadyRated || saving}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: value === stars, checked: value === stars, disabled: alreadyRated }}
                        accessibilityLabel={i18nT("{0} sao", { 0: value })}
                        style={[customerType.target, styles.star]}
                        onPress={() => {
                          if (!alreadyRated) setStars(value);
                        }}
                      >
                        <MaterialIcons
                          name={value <= stars ? "star" : "star-border"}
                          size={34}
                          color={value <= stars ? colors.onWarningContainer : colors.outline}
                        />
                      </Pressable>
                    ))}
                  </View>

                  {alreadyRated ? (
                    comment.trim() ? (
                      <Text style={styles.body}>{comment.trim()}</Text>
                    ) : null
                  ) : (
                    <>
                      <TextInput
                        multiline
                        accessibilityLabel={i18nT("Nhận xét (không bắt buộc)")}
                        draftValue={comment}
                        onChangeText={setComment}
                        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
                        placeholder={i18nT("Nhận xét (không bắt buộc)")}
                        style={styles.input}
                        maxLength={2000}
                      />
                      <Text style={styles.counter}>{comment.length}/2000</Text>
                      <Pressable
                        accessibilityRole="button"
                        disabled={saving || !ride || ride.status !== "COMPLETED" || !ride.driverId}
                        onPress={() => void finish()}
                        style={[
                          styles.primary,
                          { marginTop: 12 },
                          (saving || !ride || ride.status !== "COMPLETED" || !ride.driverId) && styles.disabled,
                        ]}
                      >
                        {saving ? (
                          <ActivityIndicator color={colors.onPrimary} />
                        ) : (
                          <Text style={styles.primaryText}>{i18nT("Gửi đánh giá")}</Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </Card>
          ) : null}

          {ride && ride.status !== "COMPLETED" ? (
            <Text style={styles.error}>
              {i18nT("Chỉ có thể đánh giá chuyến đã hoàn thành.")}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void finish(true)}
            style={alreadyRated ? styles.primary : styles.skip}
          >
            <Text style={alreadyRated ? styles.primaryText : styles.skipText}>
              {i18nT(
                canGoBack
                  ? alreadyRated
                    ? "Quay lại"
                    : "Bỏ qua và quay lại"
                  : alreadyRated
                    ? "Về trang chủ"
                    : "Bỏ qua và về trang chủ",
              )}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}