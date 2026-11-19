import { DriverChatButton } from "@/components/DriverChatButton";
import { canDriverChat } from "@/lib/chatAvailability";
import {
  getLocale,
  translate as i18nT,
  type CustomerRideDetail,
} from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable as Pressable,
  ScreenWrapper,
  Typography as Text,
  useLanguage,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Image, Linking, Modal, ScrollView, StyleSheet, View } from "react-native";

export function RideCustomerCard({ ride }: { ride: CustomerRideDetail }) {
  useLanguage();
  const s = useThemedStyles(customerStyles);
  const colors = useThemeColors();
  const locale = getLocale();
  const [visible, setVisible] = useState(false);
  const [callError, setCallError] = useState("");
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const callInFlight = useRef(false);
  const customer = ride.customer;
  const name = customer?.fullName?.trim() || i18nT("Khách hàng");
  const phone = customer?.phoneNumber?.trim();
  const normalizedPhone = phone?.replace(/[\s().-]/g, "") ?? "";
  const canCall = /^\+?\d{8,15}$/.test(normalizedPhone);
  const canChat = canDriverChat(ride);
  const avatarUrl = customer?.avatarUrl;
  const rating =
    typeof customer?.averageRating === "number" &&
    Number.isFinite(customer.averageRating) &&
    customer.averageRating >= 1 &&
    customer.averageRating <= 5
      ? customer.averageRating
      : null;
  const ratingText =
    rating === null
      ? i18nT("Chưa có đánh giá")
      : `${rating.toLocaleString(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} / 5`;
  const avatar = (large = false) => (
    <CustomerAvatar
      avatarUrl={avatarUrl}
      failedAvatar={failedAvatar}
      large={large}
      onError={setFailedAvatar}
    />
  );

  const close = () => {
    setCallError("");
    setVisible(false);
  };

  const call = async () => {
    if (!canCall || callInFlight.current) return;
    callInFlight.current = true;
    setCalling(true);
    setCallError("");
    try {
      await Linking.openURL(`tel:${normalizedPhone}`);
    } catch {
      setCallError(
        i18nT("Chưa mở được ứng dụng điện thoại. Bạn có thể nhắn tin cho khách."),
      );
    } finally {
      callInFlight.current = false;
      setCalling(false);
    }
  };

  return (
    <>
      <Card
        onPress={() => setVisible(true)}
        accessibilityLabel={i18nT("Xem thông tin khách hàng, {0}", {
          0: name,
        })}
        style={s.card}
      >
        <Text style={s.eyebrow}>{i18nT("Khách hàng của bạn")}</Text>
        <View style={s.identity}>
          {avatar()}
          <View style={s.copy}>
            <Text style={s.name} numberOfLines={2}>{name}</Text>
            <View style={s.rating}>
              <MaterialIcons name="star" size={18} color={colors.onSurface} />
              <Text style={s.body}>{ratingText}</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
        </View>
        <Text style={s.link}>
          {i18nT("Nhấn để xem hồ sơ và liên hệ")}
        </Text>
      </Card>
      {canChat || canCall ? (
        <View style={s.quickActions}>
          {canChat ? (
            <View style={s.quickAction}>
              <DriverChatButton ride={ride} />
            </View>
          ) : null}
          {canCall ? (
            <Button
              label={i18nT("Gọi khách")}
              variant="secondary"
              icon="call"
              iconPosition="leading"
              loading={calling}
              style={s.quickAction}
              onPress={() => void call()}
            />
          ) : null}
        </View>
      ) : null}
      {!visible && callError ? (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {callError}
        </Text>
      ) : null}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={s.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18nT("Đóng hồ sơ khách hàng")}
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <ScreenWrapper edges={["bottom"]} style={s.sheet}>
            <View accessibilityViewIsModal style={s.modalContent}>
              <View style={s.header}>
                <Text accessibilityRole="header" style={s.title}>
                  {i18nT("Hồ sơ khách hàng")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={i18nT("Đóng hồ sơ khách hàng")}
                  style={s.close}
                  onPress={close}
                >
                  <MaterialIcons name="close" size={24} color={colors.onSurface} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={s.details}>
                <View style={[s.identity, s.identityLarge]}>
                  {avatar(true)}
                  <View style={s.copy}>
                    <Text style={s.name}>{name}</Text>
                    <View style={s.rating}>
                      <MaterialIcons name="star" size={18} color={colors.onSurface} />
                      <Text style={s.body}>{ratingText}</Text>
                    </View>
                  </View>
                </View>
                <Text selectable style={s.meta}>
                  {i18nT("Mã khách hàng #{0}", { 0: ride.customerId })}
                </Text>
                <View style={s.detailRow}>
                  <MaterialIcons name="phone" size={22} color={colors.onSurface} />
                  <View style={s.copy}>
                    <Text style={s.meta}>
                      {i18nT("Số điện thoại khách hàng")}
                    </Text>
                    <Text selectable style={s.body}>
                      {phone || i18nT("Chưa có số điện thoại")}
                    </Text>
                  </View>
                </View>
                <View style={s.detailRow}>
                  <MaterialIcons name="mail-outline" size={22} color={colors.onSurface} />
                  <View style={s.copy}>
                    <Text style={s.meta}>{i18nT("Email")}</Text>
                    <Text selectable style={s.body}>
                      {customer?.email?.trim() || i18nT("Chưa có email")}
                    </Text>
                  </View>
                </View>
                {callError ? (
                  <Text accessibilityRole="alert" style={{ color: colors.error }}>
                    {callError}
                  </Text>
                ) : null}
              </ScrollView>
              <View style={s.actions}>
                <Button
                  label={i18nT("Gọi điện")}
                  icon="call"
                  loading={calling}
                  disabled={!canCall}
                  onPress={() => void call()}
                />
                <DriverChatButton ride={ride} onOpen={close} />
              </View>
            </View>
          </ScreenWrapper>
        </View>
      </Modal>
    </>
  );
}

function CustomerAvatar({
  avatarUrl,
  failedAvatar,
  large,
  onError,
}: {
  avatarUrl?: string | null;
  failedAvatar: string | null;
  large: boolean;
  onError: (url: string) => void;
}) {
  const s = useThemedStyles(customerStyles);
  const colors = useThemeColors();
  const style = [s.avatar, large && s.avatarLarge];
  return avatarUrl?.trim() && avatarUrl !== failedAvatar ? (
    <Image
      source={{ uri: avatarUrl }}
      style={style}
      onError={() => onError(avatarUrl)}
      accessibilityLabel={i18nT("Ảnh đại diện khách hàng")}
    />
  ) : (
    <View style={[...style, s.avatarFallback]}>
      <MaterialIcons name="person" size={30} color={colors.onPrimaryContainer} />
    </View>
  );
}

const customerStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: { padding: 16, gap: 16 },
    quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickAction: { flexGrow: 1, flexBasis: 135, width: "auto", minWidth: 0 },
    eyebrow: { color: c.onSurfaceVariant, fontSize: 13, fontWeight: "600" },
    identity: { flexDirection: "row", alignItems: "center", gap: 16 },
    identityLarge: { alignItems: "flex-start" },
    copy: { flex: 1, minWidth: 0, gap: 8 },
    avatar: { width: 64, height: 64, borderRadius: 999 },
    avatarLarge: { width: 80, height: 80, borderRadius: 999 },
    avatarFallback: {
      backgroundColor: c.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { color: c.onSurface, fontSize: 19, fontWeight: "700", flexShrink: 1 },
    rating: { flexDirection: "row", alignItems: "center", gap: 8 },
    body: { color: c.onSurface, fontSize: 16, lineHeight: 23, flexShrink: 1 },
    meta: { color: c.onSurfaceVariant, fontSize: 14, lineHeight: 21 },
    link: { color: c.primary, fontSize: 14, fontWeight: "600" },
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
    title: { flex: 1, color: c.onSurface, fontSize: 22, fontWeight: "500" },
    close: {
      minWidth: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    details: { padding: 16, gap: 16 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    actions: { padding: 16, gap: 8 },
  });
