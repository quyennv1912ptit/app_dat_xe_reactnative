import { DriverPage } from "@/components/DriverPage";
import { DriverReceptionStatus } from "@/components/DriverReceptionStatus";
import { useDriverHealth } from "@/lib/driverHealth";
import {
  Card,
  GroupedList,
  SettingsListItem,
  Typography as Text,
  typography,
  useThemeColors,
  useThemedStyles,
  type ThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getPermissionsAsync, IosAuthorizationStatus } from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState, Linking, StyleSheet, View } from "react-native";

const permissionLabel = (granted: boolean | null) =>
  granted == null ? "Chưa xác định" : granted ? "Đã cấp quyền" : "Chưa cấp quyền";

const guidanceItems: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: "location-on",
    title: "Vị trí chính xác",
    body: "Bật định vị chính xác để xác định điểm đón và chia sẻ hành trình.",
  },
  {
    icon: "my-location",
    title: "Vị trí nền",
    body: "Trong Cài đặt thiết bị, vào mục Vị trí và chọn \"Luôn cho phép\". Nếu chưa bật, hãy giữ PtitGo Tài Xế mở khi chạy chuyến.",
  },
  {
    icon: "notifications-active",
    title: "Thông báo & âm thanh",
    body: "Bật thông báo và kiểm tra âm lượng để không bỏ lỡ yêu cầu chuyến.",
  },
];

export default function DriverReceptionScreen() {
  const location = useDriverHealth((state) => state.foregroundGranted);
  const background = useDriverHealth((state) => state.backgroundGranted);
  const services = useDriverHealth((state) => state.servicesEnabled);
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [notifications, setNotifications] = useState<boolean | "quiet" | null>(
    null,
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = async () => {
        try {
          const [fg, bg, servicesEnabled] = await Promise.all([
            Location.getForegroundPermissionsAsync().catch(() => null),
            Location.getBackgroundPermissionsAsync().catch(() => null),
            Location.hasServicesEnabledAsync().catch(() => null),
          ]);
          if (active) {
            useDriverHealth.getState().update({
              ...(fg ? { foregroundGranted: fg.granted } : {}),
              ...(bg ? { backgroundGranted: bg.granted } : {}),
              ...(servicesEnabled !== null ? { servicesEnabled } : {}),
            });
          }
        } catch {
          // Giữ trạng thái hiện tại nếu thiết bị không trả về quyền vị trí.
        }
        try {
          const settings = await getPermissionsAsync();
          const status = settings.ios?.status;
          const quiet =
            status === IosAuthorizationStatus.PROVISIONAL ||
            status === IosAuthorizationStatus.EPHEMERAL;
          if (active) setNotifications(quiet ? "quiet" : settings.granted);
        } catch {
          if (active) setNotifications(null);
        }
      };
      void refresh();
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void refresh();
      });
      return () => {
        active = false;
        listener.remove();
      };
    }, []),
  );

  const openSettings = () => {
    setError("");
    void Linking.openSettings().catch(() =>
      setError("Chưa mở được cài đặt thiết bị."),
    );
  };

  return (
    <DriverPage title="Kết nối và GPS" error={error}>
      <DriverReceptionStatus detailed />
      <GroupedList title="Quyền trên thiết bị">
        <SettingsListItem
          title="Vị trí khi dùng ứng dụng"
          icon="gps-fixed"
          description={
            services === false
              ? "Dịch vụ vị trí đang tắt"
              : permissionLabel(location)
          }
          onPress={openSettings}
        />
        <SettingsListItem
          title="Vị trí nền"
          icon="my-location"
          description={permissionLabel(background)}
          onPress={openSettings}
        />
        <SettingsListItem
          title="Thông báo"
          icon="notifications-none"
          description={
            notifications === "quiet"
              ? "Cho phép gửi thông báo yên lặng"
              : permissionLabel(notifications)
          }
          onPress={openSettings}
        />
      </GroupedList>
      <Card style={styles.guideCard}>
        <SettingsListItem
          title="Hướng dẫn bật quyền nhanh"
          description={
            guideOpen
              ? "Nhấn để thu gọn"
              : "Xem cách bật GPS, vị trí nền và thông báo"
          }
          icon="help-outline"
          onPress={() => setGuideOpen((open) => !open)}
          right={
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.onSurfaceVariant}
              style={guideOpen ? styles.chevronOpen : undefined}
            />
          }
        />
        {guideOpen ? (
          <View style={styles.guideList}>
            {guidanceItems.map((item) => (
              <View key={item.title} style={styles.guideRow}>
                <View style={styles.guideIcon}>
                  <MaterialIcons
                    name={item.icon}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.guideCopy}>
                  <Text style={styles.guideTitle}>{item.title}</Text>
                  <Text style={styles.guideBody}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </DriverPage>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    guideCard: { gap: 8 },
    chevronOpen: { transform: [{ rotate: "90deg" }] },
    guideList: {
      backgroundColor: c.surfaceContainerLow,
      borderRadius: 16,
      padding: 12,
      gap: 12,
    },
    guideRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    guideIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: c.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    guideCopy: { flex: 1, minWidth: 0, gap: 2 },
    guideTitle: { ...typography.label, color: c.onSurface },
    guideBody: { ...typography.bodySecondary, color: c.onSurfaceVariant },
  });
