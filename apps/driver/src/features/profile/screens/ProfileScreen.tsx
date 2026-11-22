import { DriverConfirmationDialog } from "@/components/DriverConfirmationDialog";
import { logError } from "@/lib/logger";
import { DriverPage } from "@/components/DriverPage";
import { MyDriverReviews } from "@/components/MyDriverReviews";
import { StatusBadge } from "@/components/StatusBadge";
import { rideStyles as s } from "@/components/rideStyles";
import { useSessionStore } from "@/lib/store";
import { formatMoney, getAvatarInitials, signOutFirebase } from "@datxe/shared";
import {
  Card,
  GroupedList,
  SettingsListItem,
  Typography as Text,
  fontSize,
  spacing,
  typography,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Divider, IconButton } from "react-native-paper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteDriverAccount } from "../api";
import { useProfile } from "../hooks/useProfile";
export default function DriverProfileScreen() {
  const themed_s = useThemedStyles(s);
  const { profile: p, verification: v, wallet: w } = useProfile();
  const user = useSessionStore((state) => state.user);
  const activeRide = useSessionStore((state) => state.activeRide);
  const router = useRouter();
  const client = useQueryClient();
  const colors = useThemeColors();
  const [confirmation, setConfirmation] = useState<{ type: "logout" | "delete"; userId: number } | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const accountAction = useMutation({
    mutationFn: async ({ type, userId }: NonNullable<typeof confirmation>) => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error("Phiên đăng nhập đã thay đổi.");
      if (type === "delete") {
        await deleteDriverAccount();
        if (useSessionStore.getState().user?.id === userId) await signOutFirebase().catch(logError);
      } else await signOutFirebase();
    },
    onSuccess: (_, { userId }) => {
      const current = useSessionStore.getState().user;
      if (current && current.id !== userId) return;
      useSessionStore.getState().reset();
      client.clear();
      router.replace("/(auth)/login");
    },
  });
  const openConfirmation = (type: "logout" | "delete") => {
    if (!user) return;
    accountAction.reset();
    setConfirmation({ type, userId: user.id });
  };
  const initials = getAvatarInitials(user?.fullName, "TX");
  const deleting = confirmation?.type === "delete";
  return (
    <DriverPage
      title="Hồ sơ tài xế"
      tabs
      loading={p.isLoading || v.isLoading || w.isLoading}
      error={p.error?.message || v.error?.message || w.error?.message}
      retry={() => Promise.all([p.refetch(), v.refetch(), w.refetch()])}
    >
      <Card style={themed_s.card}>
        <View style={layout.identity}>
          <Pressable
            style={layout.avatarWrap}
            accessibilityRole="button"
            accessibilityLabel="Chụp ảnh chân dung làm ảnh đại diện"
            accessibilityHint="Chạm để chụp ảnh chân dung mới"
            onPress={() => router.push("/profile/avatar-capture")}
          >
            {p.data?.avatar_url && failedAvatar !== p.data.avatar_url ? (
              <Image
                source={{ uri: p.data.avatar_url }}
                style={layout.avatarImage}
                contentFit="cover"
                cachePolicy="memory"
                accessibilityIgnoresInvertColors
                onError={() => setFailedAvatar(p.data?.avatar_url ?? null)}
              />
            ) : (
              <View accessible={false} style={[layout.avatarCircle, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[layout.avatarInitials, { color: colors.onPrimaryContainer }]}>{initials}</Text>
              </View>
            )}
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[layout.cameraBadge, { backgroundColor: colors.primary }]}
            >
              <MaterialIcons name="photo-camera" size={fontSize.iconSm} color={colors.onPrimary} />
            </View>
          </Pressable>
          <Text style={[themed_s.title, layout.name]}>{user?.fullName ?? "Tài xế"}</Text>
          <IconButton
            icon="pencil"
            iconColor={colors.primary}
            style={layout.edit}
            accessibilityLabel="Xem và sửa thông tin cá nhân"
            onPress={() => router.push("/profile/edit")}
          />
        </View>
        <View style={layout.contactRow}>
          <MaterialIcons name="call" size={18} color={colors.onSurfaceVariant} importantForAccessibility="no" />
          <Text selectable style={[themed_s.text, layout.contact]}>{user?.phoneNumber ?? "Chưa có số điện thoại"}</Text>
        </View>
        {user?.email ? (
          <View style={layout.contactRow}>
            <MaterialIcons name="mail-outline" size={18} color={colors.onSurfaceVariant} importantForAccessibility="no" />
            <Text
              selectable
              style={[themed_s.text, layout.contact]}
              accessibilityLabel={`Email: ${user.email}`}
            >
              {user.email}
            </Text>
          </View>
        ) : null}
        {p.data || v.data ? <Divider style={{ backgroundColor: colors.outlineVariant }} /> : null}
        {p.data ? (
          <View style={layout.statsRow}>
            <View style={[layout.statTile, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={[typography.label, { color: colors.onSurfaceVariant }]}>Hạng GPLX</Text>
              <Text style={[typography.cardTitle, { color: colors.onSurface }]}>
                {p.data.license_class ?? "Chưa cập nhật"}
              </Text>
            </View>
            <View style={[layout.statTile, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={[typography.label, { color: colors.onSurfaceVariant }]}>Kinh nghiệm</Text>
              <Text style={[typography.cardTitle, { color: colors.onSurface, fontVariant: ["tabular-nums"] }]}>
                {p.data.years_of_experience === null ? "Chưa cập nhật" : `${p.data.years_of_experience} năm`}
              </Text>
            </View>
          </View>
        ) : null}
        {v.data ? (
          <StatusBadge
            kind="approval"
            value={v.data.verification_status}
            contextLabel="Xét duyệt hồ sơ"
          />
        ) : null}
      </Card>
      <MyDriverReviews />
      <GroupedList title="Hồ sơ tài xế">
        <SettingsListItem
          title="Xác minh tài xế"
          icon="person"
          description={
            v.data?.verification_status === "APPROVED"
              ? "Đã xác minh · Xem hoặc cập nhật giấy tờ"
              : v.data?.verification_status === "REJECTED"
                ? "Chưa đạt · Mở để cập nhật và gửi lại"
                : v.data?.verification_status === "PENDING"
                  ? "Xem tiến độ hoặc hoàn tất hồ sơ"
                  : "Chụp CCCD, GPLX và ảnh chân dung"
          }
          onPress={() => router.push("/profile/verification")}
        />
        <SettingsListItem title="Loại xe nhận lái hộ" icon="tune" onPress={() => router.push("/profile/capabilities")} />
      </GroupedList>
      <GroupedList title="Cài đặt & hỗ trợ">
        <SettingsListItem title="Kết nối, GPS & thông báo" icon="gps-fixed" description="Kiểm tra quyền vị trí nền và nhận thông báo" onPress={() => router.push("/settings/reception")} />
        <SettingsListItem title="Cài đặt" icon="settings" onPress={() => router.push("/settings")} />
        <SettingsListItem
          title="Trung tâm hỗ trợ"
          icon="help-outline"
          onPress={() => router.push("/support")}
        />
        <SettingsListItem title="An toàn chuyến đi" icon="health-and-safety" onPress={() => router.push("/safety")} />
      </GroupedList>
      <GroupedList title="Thu nhập">
        <SettingsListItem title="Ví thu nhập" icon="account-balance-wallet"
          description={w.data ? `Số dư · ${formatMoney(w.data.income_balance)}` : "Xem số dư và giao dịch"}
          onPress={() => router.push("/profile/wallet")} />
      </GroupedList>
      <GroupedList title="Tài khoản">
        <SettingsListItem title="Đăng xuất" icon="logout" disabled={!user} onPress={() => openConfirmation("logout")} />
        <SettingsListItem title="Xóa tài khoản" icon="delete-outline" destructive disabled={!user} onPress={() => openConfirmation("delete")} />
      </GroupedList>
      <DriverConfirmationDialog
        visible={Boolean(confirmation)} busy={accountAction.isPending}
        title={deleting ? "Xóa tài khoản?" : "Đăng xuất?"}
        description={deleting
          ? "Hồ sơ và giấy tờ sẽ được xóa hoặc ẩn danh. Lịch sử chuyến được giữ lại. Bạn cần kết thúc chuyến đang hoạt động trước khi xóa tài khoản."
          : "Bạn sẽ cần đăng nhập lại để tiếp tục nhận chuyến."}
        confirmLabel={deleting ? "Xóa tài khoản" : "Đăng xuất"}
        dismissLabel={deleting ? "Giữ tài khoản" : "Ở lại"}
        disabled={deleting && Boolean(activeRide)}
        error={accountAction.error?.message}
        onDismiss={() => setConfirmation(null)}
        onConfirm={() => { if (confirmation) accountAction.mutate(confirmation); }}
      />
    </DriverPage>
  );
}

const layout = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "flex-start", gap: spacing.spaceSm },
  // Toàn bộ avatar là vùng chạm (>= 48dp); badge chỉ là chỉ thị nhỏ góc dưới bên phải.
  avatarWrap: { position: "relative", flexShrink: 0, minWidth: 48, minHeight: 48 },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: { minWidth: 52, minHeight: 52, paddingHorizontal: 10, paddingVertical: 10, aspectRatio: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarImage: { width: 52, height: 52, borderRadius: 999, flexShrink: 0 },
  avatarInitials: { ...typography.cardTitle },
  name: { ...typography.cardTitle, flex: 1, alignSelf: "center" },
  edit: { margin: 0, width: 48, height: 48 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: spacing.spaceSm },
  contact: { ...typography.label, flex: 1 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.spaceSm },
  statTile: { flex: 1, minWidth: 130, padding: spacing.px3, borderRadius: spacing.spaceMd, gap: spacing.xxs },
});
