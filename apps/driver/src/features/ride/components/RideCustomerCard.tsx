import { DriverChatButton } from "@/components/DriverChatButton";
import { canDriverChat } from "@/lib/chatAvailability";
import type { CustomerRideDetail } from "@datxe/shared";
import {
  Button,
  Card,
  MotionPressable,
  ScreenWrapper,
  Typography as Text,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Modal, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Divider } from "react-native-paper";
import { CustomerReviews } from "./CustomerReviews";

export function RideCustomerCard({ ride }: { ride: CustomerRideDetail }) {
  const colors = useThemeColors();
  const s = useThemedStyles(makeStyles);
  const [visible, setVisible] = useState(false);
  const [callError, setCallError] = useState("");
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const customer = ride.customer;
  const name = customer?.fullName?.trim() || "Khách hàng";
  const rating = customer?.averageRating;
  const ratingText = rating == null
    ? null
    : `${rating.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5`;
  const phone = customer?.phoneNumber?.trim();
  const dialNumber = phone?.replace(/[\s().-]/g, "") ?? "";
  const canCall = /^\+?\d{3,15}$/.test(dialNumber);
  const canChat = canDriverChat(ride);
  const avatarUrl = customer?.avatarUrl;
  const hasAvatar = Boolean(avatarUrl && avatarUrl !== failedAvatar);

  const avatar = (size: number) => hasAvatar && avatarUrl ? (
    <Avatar.Image size={size} source={{ uri: avatarUrl }} onError={() => setFailedAvatar(avatarUrl)} />
  ) : (
    <Avatar.Icon size={size} icon="account" color={colors.onPrimaryContainer} style={{ backgroundColor: colors.primaryContainer }} />
  );

  const close = () => {
    setCallError("");
    setVisible(false);
  };

  const call = async () => {
    if (!canCall) return;
    setCallError("");
    try {
      await Linking.openURL(`tel:${dialNumber}`);
    } catch {
      setCallError("Chưa mở được ứng dụng điện thoại. Bạn có thể nhắn tin cho khách.");
    }
  };

  return (
    <>
      <Card style={[s.card, { backgroundColor: colors.rideSurface }]}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`Xem thông tin khách hàng, ${name}`}
          onPress={() => setVisible(true)}
          style={s.summary}
        >
          {avatar(48)}
          <View style={s.identity}>
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>Khách hàng</Text>
            <Text style={[s.name, { color: colors.onSurface }]}>{name}</Text>
            {ratingText ? (
              <View style={s.ratingRow}>
                <MaterialIcons name="star" size={16} color={colors.onSurfaceVariant} importantForAccessibility="no" />
                <Text style={[typography.label, { color: colors.onSurfaceVariant }]}>{ratingText}</Text>
              </View>
            ) : null}
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} importantForAccessibility="no" />
        </MotionPressable>
        {canChat || canCall ? (
          <>
            <Divider style={{ backgroundColor: colors.outlineVariant }} />
            <View style={s.actions}>
              {canChat ? <DriverChatButton ride={ride} labelText="Nhắn tin" style={s.actionButton} /> : null}
              {canCall ? (
                <Button
                  label="Gọi khách"
                  variant="secondary"
                  icon="call"
                  iconPosition="leading"
                  style={s.actionButton}
                  onPress={() => void call()}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </Card>
      {!visible && callError ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{callError}</Text> : null}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={[s.overlay, { backgroundColor: colors.inverseSurface40 }]}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Đóng hồ sơ khách hàng"
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <ScreenWrapper edges={["bottom"]} style={s.sheet}>
            <View accessibilityViewIsModal style={s.modalContent}>
              <View style={s.header}>
                <Text accessibilityRole="header" style={s.title}>Hồ sơ khách hàng</Text>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel="Đóng hồ sơ khách hàng"
                  style={s.close}
                  onPress={close}
                >
                  <MaterialIcons name="close" size={24} color={colors.onSurface} />
                </MotionPressable>
              </View>
              <ScrollView contentContainerStyle={s.details}>
                <View style={[s.sheetIdentity, s.sheetIdentityLarge]}>
                  {avatar(80)}
                  <View style={s.copy}>
                    <Text style={s.sheetName}>{name}</Text>
                    <View style={s.rating}>
                      <MaterialIcons name="star" size={18} color={colors.onSurface} importantForAccessibility="no" />
                      <Text style={s.body}>{ratingText ?? "Chưa có đánh giá"}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.detailRow}>
                  <MaterialIcons name="badge" size={22} color={colors.onSurface} importantForAccessibility="no" />
                  <Text style={s.body}>{`Mã khách hàng #${ride.customerId}`}</Text>
                </View>
                <View style={s.detailRow}>
                  <MaterialIcons name="phone" size={22} color={colors.onSurface} importantForAccessibility="no" />
                  <View style={s.copy}>
                    <Text style={s.meta}>Số điện thoại khách hàng</Text>
                    <Text selectable style={s.body}>{phone || "Chưa có số điện thoại"}</Text>
                  </View>
                </View>
                <View style={s.detailRow}>
                  <MaterialIcons name="email" size={22} color={colors.onSurface} importantForAccessibility="no" />
                  <View style={s.copy}>
                    <Text style={s.meta}>Email</Text>
                    <Text selectable style={s.body}>{customer?.email?.trim() || "Chưa có email"}</Text>
                  </View>
                </View>
                <Divider style={{ backgroundColor: colors.outlineVariant }} />
                <CustomerReviews enabled={visible} />
                {callError ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{callError}</Text> : null}
              </ScrollView>
              <View style={s.sheetActions}>
                <Button label="Gọi điện" icon="call" iconPosition="leading" disabled={!canCall} onPress={() => void call()} />
                <DriverChatButton ride={ride} onOpen={close} />
                <Text style={s.hint}>Bạn có thể gửi tin nhắn văn bản và hình ảnh.</Text>
              </View>
            </View>
          </ScreenWrapper>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { padding: spacing.spaceMd, gap: spacing.px3 },
  summary: { flexDirection: "row", alignItems: "center", gap: spacing.px3, minHeight: 48 },
  identity: { flex: 1, minWidth: 0, gap: spacing.xxs },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.spaceXs },
  name: { ...typography.cardTitle },
  actions: { flexDirection: "row", gap: spacing.spaceSm },
  actionButton: { flex: 1, flexBasis: 0, minWidth: 0 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 32,
  },
  sheet: {
    flex: 0,
    maxHeight: "92%",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalContent: { flexShrink: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.spaceMd,
    paddingTop: spacing.px3,
    gap: spacing.px3,
  },
  title: { ...typography.screenTitle, flex: 1, color: colors.onSurface },
  close: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  sheetIdentity: { flexDirection: "row", alignItems: "center", gap: spacing.spaceMd },
  sheetIdentityLarge: { alignItems: "flex-start" },
  copy: { flex: 1, minWidth: 0, gap: spacing.spaceSm },
  sheetName: { ...typography.sectionTitle, color: colors.onSurface, flexShrink: 1 },
  rating: { flexDirection: "row", alignItems: "center", gap: spacing.spaceSm },
  body: { ...typography.body, color: colors.onSurface, flexShrink: 1 },
  meta: { ...typography.bodySecondary, color: colors.onSurfaceVariant },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.px3 },
  details: { padding: spacing.spaceMd, gap: spacing.spaceMd },
  sheetActions: { padding: spacing.spaceMd, gap: spacing.spaceSm },
  hint: { ...typography.bodySecondary, color: colors.onSurfaceVariant, textAlign: "center" },
});
