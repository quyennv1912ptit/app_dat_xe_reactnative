import { DriverPage } from "@/components/DriverPage";
import { DriverReceptionStatus } from "@/components/DriverReceptionStatus";
import { useDriverHealth } from "@/lib/driverHealth";
import { GroupedList, SettingsListItem, Typography as Text } from "@datxe/ui";
import { getPermissionsAsync, IosAuthorizationStatus } from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState, Linking } from "react-native";

const permissionLabel = (granted: boolean | null) => granted == null ? "Chưa xác định"
  : granted ? "Đã cấp quyền" : "Chưa cấp quyền";

export default function DriverReceptionScreen() {
  const location = useDriverHealth((state) => state.foregroundGranted);
  const background = useDriverHealth((state) => state.backgroundGranted);
  const services = useDriverHealth((state) => state.servicesEnabled);
  const [notifications, setNotifications] = useState<boolean | "quiet" | null>(null);
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = async () => {
      try {
        const settings = await getPermissionsAsync();
        const status = settings.ios?.status;
        const quiet = status === IosAuthorizationStatus.PROVISIONAL || status === IosAuthorizationStatus.EPHEMERAL;
        if (active) setNotifications(quiet ? "quiet" : settings.granted);
      } catch {
        if (active) setNotifications(null);
      }
    };
    void refresh();
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    return () => { active = false; listener.remove(); };
  }, []));

  const openSettings = () => {
    setError("");
    void Linking.openSettings().catch(() => setError("Chưa mở được cài đặt thiết bị."));
  };
  return (
    <DriverPage title="Kết nối và GPS" error={error}>
      <DriverReceptionStatus detailed />
      <Text>Vị trí giúp xác định điểm đón và chia sẻ hành trình. Khi đang có chuyến, quyền vị trí nền giúp cập nhật vị trí khi bạn chuyển sang ứng dụng khác.</Text>
      <Text>Trong cài đặt thiết bị, mở Quyền → Vị trí và chọn Luôn cho phép nếu có. Bật vị trí chính xác. Nếu chưa cấp quyền nền, hãy giữ PtitGo Tài Xế mở khi thực hiện chuyến.</Text>
      <Text>Bật quyền thông báo để nhận yêu cầu chuyến và cập nhật hỗ trợ. Kiểm tra thêm âm thanh thông báo nếu thiết bị đang để im lặng.</Text>
      <GroupedList title="Quyền trên thiết bị">
        <SettingsListItem title="Vị trí khi dùng ứng dụng" icon="gps-fixed"
          description={services === false ? "Dịch vụ vị trí đang tắt" : permissionLabel(location)} onPress={openSettings} />
        <SettingsListItem title="Vị trí nền" icon="my-location" description={permissionLabel(background)} onPress={openSettings} />
        <SettingsListItem title="Thông báo" icon="notifications-none"
          description={notifications === "quiet" ? "Cho phép gửi thông báo yên lặng" : permissionLabel(notifications)} onPress={openSettings} />
      </GroupedList>
    </DriverPage>
  );
}
