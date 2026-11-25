import { useDriverHealth } from "@/lib/driverHealth";
import { useSessionStore } from "@/lib/store";
import {
  Button,
  Card,
  KeyValueRow,
  SharedStatusBadge,
  Typography as Text,
  typography,
  useThemeColors,
  useThemedStyles,
  type SharedStatusTone,
  type ThemeColors,
} from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AppState, Linking, StyleSheet, View } from "react-native";

export function DriverReceptionStatus({
  detailed = false,
  onDetails,
}: { detailed?: boolean; onDetails?: () => void } = {}) {
  const health = useDriverHealth();
  const user = useSessionStore((state) => state.user);
  const active = useSessionStore((state) => state.activeRide);
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [now, setNow] = useState(Date.now);
  const [appActive, setAppActive] = useState(
    () => !AppState?.currentState || AppState.currentState === "active",
  );
  const [settingsError, setSettingsError] = useState("");
  const needsTiming =
    Boolean(user) &&
    (user?.status === "ONLINE" ||
      Boolean(active) ||
      (detailed && health.lastSampleAt != null));

  useEffect(() => {
    const subscription = AppState?.addEventListener?.("change", (state) => {
      const next = state === "active";
      setAppActive(next);
      if (next) setNow(Date.now());
    });
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!needsTiming || !appActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [appActive, needsTiming]);

  if (!user) return null;

  const online = user.status === "ONLINE";
  const gpsFresh =
    health.lastSampleAt != null && now - health.lastSampleAt <= 30000;
  const sent = health.lastSentAt != null && now - health.lastSentAt <= 30000;
  const locationReady =
    health.foregroundGranted && health.servicesEnabled && gpsFresh && sent;
  const problem =
    !health.connected && !sent
      ? "Đang kết nối lại với máy chủ."
      : health.servicesEnabled === false
        ? "Bật dịch vụ vị trí để tiếp tục."
        : health.foregroundGranted === false
          ? "Cấp quyền vị trí để tiếp tục."
          : "Đang chờ vị trí mới được gửi.";
  const status = active
    ? "Đang thực hiện chuyến"
    : !online
      ? "Đang tạm ngừng nhận chuyến"
      : locationReady
        ? "Đã bật nhận chuyến · Kết nối và GPS sẵn sàng"
        : "Đã bật nhận chuyến · Chưa đủ điều kiện nhận chuyến";
  const badge: { label: string; tone: SharedStatusTone } = active
    ? { label: "Đang thực hiện chuyến", tone: "active" }
    : !online
      ? { label: "Đang tạm ngừng", tone: "neutral" }
      : locationReady
        ? { label: "Kết nối và GPS sẵn sàng", tone: "success" }
        : { label: "Chưa đủ điều kiện", tone: "danger" };
  const needsLocation = online || Boolean(active);
  const permissionsMissing =
    health.servicesEnabled === false || health.foregroundGranted === false;
  const openSettings = () => {
    setSettingsError("");
    void Linking.openSettings().catch(() =>
      setSettingsError("Chưa mở được cài đặt quyền vị trí."),
    );
  };

  const connectionValue = health.connected
    ? "Đã kết nối"
    : sent
      ? "Kết nối dự phòng"
      : "Đang kết nối lại";
  const connectionColor = health.connected
    ? colors.success
    : sent
      ? colors.onSurface
      : colors.error;

  const gpsValue =
    health.servicesEnabled === false
      ? "Dịch vụ vị trí đang tắt"
      : health.foregroundGranted === false
        ? "Chưa cấp quyền"
        : gpsFresh
          ? "Có vị trí mới"
          : "Đang chờ vị trí mới";
  const gpsColor =
    health.servicesEnabled === false || health.foregroundGranted === false
      ? colors.error
      : gpsFresh
        ? colors.success
        : colors.onSurface;

  const backgroundValue = health.backgroundRunning
    ? "Đang hoạt động"
    : health.backgroundGranted === false
      ? "Chưa cấp quyền"
      : "Chưa hoạt động";
  const backgroundColor = health.backgroundRunning
    ? colors.success
    : health.backgroundGranted === false
      ? colors.error
      : colors.onSurfaceVariant;

  const lastMeasuredValue = health.lastSampleAt
    ? `${new Date(health.lastSampleAt).toLocaleTimeString("vi-VN")} · ${Math.max(0, Math.floor((now - health.lastSampleAt) / 1000))} giây trước`
    : null;

  return (
    <Card radius={20} style={styles.card}>
      <View style={styles.headerBlock}>
        <Text accessibilityRole="header" style={styles.title}>
          {active ? "Tình trạng chia sẻ vị trí chuyến" : "Tình trạng nhận chuyến"}
        </Text>
        <SharedStatusBadge label={badge.label} tone={badge.tone} />
        <Text accessibilityLiveRegion="polite" style={styles.summary}>
          {status}
        </Text>
      </View>

      {needsLocation && !locationReady ? (
        <View style={styles.dangerNotice} accessibilityRole="alert">
          <MaterialIcons
            name="warning-amber"
            size={20}
            color={colors.onErrorContainer}
          />
          <Text style={styles.dangerNoticeText}>{problem}</Text>
        </View>
      ) : null}

      {detailed ? (
        <View style={styles.metricsBox}>
          <KeyValueRow
            label="Kết nối"
            value={connectionValue}
            valueColor={connectionColor}
            strong
          />
          <KeyValueRow
            label="GPS"
            value={gpsValue}
            valueColor={gpsColor}
            strong
          />
          {lastMeasuredValue ? (
            <KeyValueRow label="Cập nhật gần nhất" value={lastMeasuredValue} />
          ) : null}
          <KeyValueRow
            label="Vị trí nền"
            value={backgroundValue}
            valueColor={backgroundColor}
            strong
          />
        </View>
      ) : null}

      {needsLocation && !health.backgroundRunning ? (
        <View style={styles.warningNotice}>
          <MaterialIcons
            name="info-outline"
            size={20}
            color={colors.onWarningContainer}
          />
          <Text style={styles.warningNoticeText}>
            Giữ app mở để chia sẻ vị trí. Bật quyền vị trí nền nếu cần chuyển
            ứng dụng.
          </Text>
        </View>
      ) : null}

      {detailed && health.error ? (
        <View style={styles.dangerNotice} accessibilityRole="alert">
          <MaterialIcons
            name="error-outline"
            size={20}
            color={colors.onErrorContainer}
          />
          <Text style={styles.dangerNoticeText}>{health.error}</Text>
        </View>
      ) : null}

      {settingsError ? (
        <View style={styles.dangerNotice} accessibilityRole="alert">
          <MaterialIcons
            name="error-outline"
            size={20}
            color={colors.onErrorContainer}
          />
          <Text style={styles.dangerNoticeText}>{settingsError}</Text>
        </View>
      ) : null}

      {detailed && needsLocation && (!locationReady || !health.backgroundRunning) ? (
        <View style={styles.actions}>
          <Button
            label="Kiểm tra lại kết nối và GPS"
            variant="secondary"
            icon="refresh"
            iconPosition="leading"
            onPress={health.retry}
          />
          <Button
            label="Mở cài đặt quyền vị trí"
            variant="ghost"
            icon="settings"
            iconPosition="leading"
            onPress={openSettings}
          />
        </View>
      ) : null}

      {!detailed && needsLocation && !locationReady ? (
        <View style={styles.actions}>
          <Button
            variant="secondary"
            icon={permissionsMissing ? "settings" : "refresh"}
            iconPosition="leading"
            label={
              permissionsMissing
                ? "Kiểm tra quyền vị trí"
                : "Kiểm tra lại kết nối và GPS"
            }
            onPress={permissionsMissing ? (onDetails ?? openSettings) : health.retry}
          />
        </View>
      ) : null}

      {onDetails && !(needsLocation && permissionsMissing && !locationReady) ? (
        <Button
          variant="ghost"
          icon="info-outline"
          iconPosition="leading"
          label="Chi tiết kết nối và GPS"
          onPress={onDetails}
        />
      ) : null}
    </Card>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: { gap: 14, padding: 16 },
    headerBlock: { gap: 8 },
    title: { ...typography.sectionTitle, color: c.onSurface },
    summary: { ...typography.bodySecondary, color: c.onSurfaceVariant },
    metricsBox: {
      backgroundColor: c.surfaceContainerLow,
      borderRadius: 14,
      padding: 12,
      gap: 10,
    },
    warningNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.warningContainer,
      borderRadius: 12,
      padding: 12,
    },
    warningNoticeText: {
      ...typography.bodySecondary,
      color: c.onWarningContainer,
      flex: 1,
    },
    dangerNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.errorContainer,
      borderRadius: 12,
      padding: 12,
    },
    dangerNoticeText: {
      ...typography.bodySecondary,
      color: c.onErrorContainer,
      flex: 1,
    },
    actions: { gap: 8, marginTop: 2 },
  });
