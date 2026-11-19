import { useRef, useState, type ReactNode } from "react";
import { Image } from "expo-image";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getLocale,
  translate as i18nT,
  type CustomerRideDriver,
} from "@datxe/shared";
import {
  Button,
  Card,
  localizedAlert,
  MotionPressable as Pressable,
  typography,
  ScreenWrapper,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import {
  driverExperience,
  driverInitials,
  driverPhoneUrl,
  driverRating,
} from "../driverProfile";

export function DriverProfileCard({
  driver,
  contactEnabled,
  unreadCount,
  onMessage,
  reviews,
}: {
  driver: CustomerRideDriver;
  contactEnabled: boolean;
  unreadCount: number;
  onMessage: () => void;
  reviews?: ReactNode;
}) {
  useLanguage();
  const s = useThemedStyles(profileStyles);
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [calling, setCalling] = useState(false);
  const callInFlight = useRef(false);
  const phoneUrl = driverPhoneUrl(driver.phoneNumber);
  const name = driver.fullName?.trim() || i18nT("Tài xế chưa cập nhật tên");
  const rating = driverRating(driver.averageRating);
  const experience = driverExperience(driver.yearsOfExperience);
  const ratingText =
    rating === null
      ? i18nT("Chưa có đánh giá")
      : `${rating.toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5`;
  const experienceText =
    experience === null
      ? i18nT("Chưa cập nhật kinh nghiệm")
      : i18nT("{0} năm kinh nghiệm", { 0: experience });
  const call = async () => {
    if (!contactEnabled || !phoneUrl || callInFlight.current) return;
    callInFlight.current = true;
    setCalling(true);
    try {
      await Linking.openURL(phoneUrl);
    } catch {
      localizedAlert(
        i18nT("Chưa mở được ứng dụng điện thoại"),
        i18nT(
          "Bạn có thể dùng số điện thoại hiển thị trong hồ sơ để liên hệ tài xế.",
        ),
      );
    } finally {
      callInFlight.current = false;
      setCalling(false);
    }
  };
  const identity = (large = false) => (
    <View style={[s.identity, large && s.identityLarge]}>
      <DriverAvatar
        key={driver.avatarUrl ?? "no-avatar"}
        driver={driver}
        large={large}
      />
      <View style={s.copy}>
        <Text style={s.name}>{name}</Text>
        <View style={s.rating}>
          <MaterialIcons name="star" size={18} color={colors.onSurface} />
          <Text style={s.body}>{ratingText}</Text>
        </View>
        <Text style={s.meta}>{experienceText}</Text>
      </View>
      {!large ? (
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.onSurfaceVariant}
        />
      ) : null}
    </View>
  );
  return (
    <>
      <Card
        onPress={() => setVisible(true)}
        accessibilityLabel={i18nT("Xem hồ sơ tài xế {0}", { 0: name })}
        style={s.card}
      >
        <Text style={s.eyebrow}>{i18nT("Tài xế của bạn")}</Text>
        {identity()}
        <Text style={s.link}>{i18nT("Nhấn để xem hồ sơ và liên hệ")}</Text>
      </Card>
      {contactEnabled ? (
        <View style={s.quickActions}>
          <Button variant="secondary" style={s.quickAction} icon="chat" iconPosition="leading"
            label={unreadCount > 0 ? i18nT("Nhắn tin với tài xế · {0} tin chưa đọc", { "0": unreadCount }) : i18nT("Nhắn tin với tài xế")}
            onPress={onMessage} />
          {phoneUrl ? <Button variant="secondary" style={s.quickAction} icon="call" iconPosition="leading"
            label="Gọi điện" loading={calling} onPress={() => void call()} /> : null}
        </View>
      ) : null}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={s.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18nT("Đóng hồ sơ tài xế")}
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
          />
          <ScreenWrapper edges={["bottom"]} style={s.sheet}>
            <View accessibilityViewIsModal style={s.modalContent}>
              <View style={s.header}>
                <Text accessibilityRole="header" style={s.title}>
                  {i18nT("Hồ sơ tài xế")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={i18nT("Đóng hồ sơ tài xế")}
                  style={s.close}
                  onPress={() => setVisible(false)}
                >
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={colors.onSurface}
                  />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={s.details}>
                {identity(true)}
                <View style={s.detailRow}>
                  <MaterialIcons
                    name="verified-user"
                    size={22}
                    color={colors.onSurface}
                  />
                  <Text style={s.body}>
                    {i18nT(
                      driver.profileVerified === true
                        ? "Hồ sơ đã được xét duyệt"
                        : "Chưa có thông tin xác minh hồ sơ",
                    )}
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <MaterialIcons
                    name="badge"
                    size={22}
                    color={colors.onSurface}
                  />
                  <View style={s.copy}>
                    <Text style={s.body}>
                      {driver.licenseClass
                        ? i18nT("Giấy phép lái xe hạng {0}", {
                            0: driver.licenseClass,
                          })
                        : i18nT("Chưa cập nhật hạng giấy phép")}
                    </Text>
                    <Text style={s.meta}>
                      {i18nT(
                        driver.licenseVerified === true
                          ? "Giấy phép đã được xác minh"
                          : "Chưa có thông tin xác minh giấy phép",
                      )}
                    </Text>
                  </View>
                </View>
                <View style={s.detailRow}>
                  <MaterialIcons
                    name="phone"
                    size={22}
                    color={colors.onSurface}
                  />
                  <View style={s.copy}>
                    <Text style={s.meta}>{i18nT("Số điện thoại tài xế")}</Text>
                    <Text selectable style={s.body}>
                      {driver.phoneNumber?.trim() ||
                        i18nT("Chưa có số điện thoại liên hệ")}
                    </Text>
                  </View>
                </View>
                {!contactEnabled ? (
                  <Text style={s.meta}>
                    {i18nT(
                      "Liên hệ trong ứng dụng đã đóng theo trạng thái chuyến.",
                    )}
                  </Text>
                ) : !phoneUrl ? (
                  <Text style={s.meta}>
                    {i18nT("Chưa có số điện thoại hợp lệ để gọi tài xế.")}
                  </Text>
                ) : null}
                {visible ? reviews : null}
              </ScrollView>
              <View style={s.actions}>
                <Button
                  label={i18nT("Gọi điện")}
                  icon="call"
                  loading={calling}
                  disabled={!contactEnabled || !phoneUrl}
                  onPress={() => void call()}
                />
                <Button
                  label={
                    unreadCount > 0
                      ? i18nT("Nhắn tin · {0} chưa đọc", { 0: unreadCount })
                      : i18nT("Nhắn tin")
                  }
                  icon="chat-bubble-outline"
                  variant="secondary"
                  disabled={!contactEnabled}
                  onPress={() => {
                    if (contactEnabled) {
                      setVisible(false);
                      onMessage();
                    }
                  }}
                />
                <Text style={s.hint}>
                  {i18nT("Bạn có thể gửi tin nhắn văn bản và hình ảnh.")}
                </Text>
              </View>
            </View>
          </ScreenWrapper>
        </View>
      </Modal>
    </>
  );
}

function DriverAvatar({
  driver,
  large,
}: {
  driver: CustomerRideDriver;
  large: boolean;
}) {
  const s = useThemedStyles(profileStyles);
  const colors = useThemeColors();
  const [failed, setFailed] = useState(false);
  const style = [s.avatar, large && s.avatarLarge];
  return driver.avatarUrl?.trim() && !failed ? (
    <Image
      source={{ uri: driver.avatarUrl }}
      cachePolicy="memory"
      contentFit="cover"
      style={style}
      onError={() => setFailed(true)}
      accessibilityLabel={i18nT("Ảnh đại diện tài xế")}
    />
  ) : (
    <View style={[...style, s.avatarFallback]}>
      {driverInitials(driver.fullName) ? (
        <Text style={s.initials}>{driverInitials(driver.fullName)}</Text>
      ) : (
        <MaterialIcons name="person" size={30} color={colors.onPrimaryFixed} />
      )}
    </View>
  );
}

const profileStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: { padding: 16, gap: 16 },
    quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickAction: { flexGrow: 1, flexBasis: 135, width: "auto" },
    eyebrow: { ...typography.label, color: c.onSurfaceVariant },
    identity: { flexDirection: "row", alignItems: "center", gap: 16 },
    identityLarge: { alignItems: "flex-start" },
    copy: { flex: 1, minWidth: 0, gap: 8 },
    avatar: { width: 64, height: 64, borderRadius: 999 },
    avatarLarge: { width: 80, height: 80, borderRadius: 999 },
    avatarFallback: {
      backgroundColor: c.primaryFixed,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { ...typography.sectionTitle, color: c.onPrimaryFixed },
    name: {
      ...typography.sectionTitle,
      color: c.onSurface,
      flexShrink: 1,
    },
    rating: { flexDirection: "row", alignItems: "center", gap: 8 },
    body: { ...typography.body, color: c.onSurface, flexShrink: 1 },
    meta: { ...typography.bodySecondary, color: c.onSurfaceVariant },
    link: { ...typography.label, color: c.primary },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: c.inverseSurface40,
      paddingTop: 32,
    },
    sheet: {
      flex: 0,
      maxHeight: "92%",
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
      backgroundColor: c.surfaceContainerLowest,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
    },
    modalContent: { flexShrink: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 12,
    },
    title: { ...typography.screenTitle, flex: 1, color: c.onSurface },
    close: {
      minWidth: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    details: { padding: 16, gap: 16 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    actions: { padding: 16, gap: 8 },
    hint: { ...typography.bodySecondary, color: c.onSurfaceVariant, textAlign: "center" },
  });
