import { useDriverHealth } from "@/lib/driverHealth";
import { Button, Card, GroupedList, MotionPressable, Typography as Text, borderRadius, spacing, typography, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import { AppState, StyleSheet, View } from "react-native";

export type OperationalVehicleType = "CAR" | "MOTORCYCLE";

type Props = {
  online: boolean;
  active: boolean;
  loading: boolean;
  onlineVehicle?: OperationalVehicleType | null;
  acceptedVehicleTypes?: readonly OperationalVehicleType[];
  selectedVehicle?: OperationalVehicleType | null;
  onSelectVehicle?: (value: OperationalVehicleType) => void;
  vehicleDetail?: string | null;
  blocker?: { title: string; action?: string; onPress?: () => void };
  onDiagnostics: () => void;
  children?: ReactNode;
};

const freshnessMs = 30_000;

const defaultVehicleLabel = (type: OperationalVehicleType) =>
  type === "CAR" ? "Ô tô" : "Xe máy";

export function HomeOperationalStatus({
  online,
  active,
  loading,
  onlineVehicle,
  acceptedVehicleTypes,
  selectedVehicle,
  onSelectVehicle,
  vehicleDetail,
  blocker,
  onDiagnostics,
  children,
}: Props) {
  const colors = useThemeColors();
  const health = useDriverHealth();
  const [now, setNow] = useState(Date.now);
  const [appActive, setAppActive] = useState(() => !AppState?.currentState || AppState.currentState === "active");
  const tracking = online || active;

  useEffect(() => {
    const subscription = AppState?.addEventListener?.("change", (state) => {
      const next = state === "active";
      setAppActive(next);
      if (next) setNow(Date.now());
    });
    return () => { subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (!tracking || !appActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [appActive, tracking]);

  const locationBlocked = tracking && (health.servicesEnabled === false || health.foregroundGranted === false);
  const fresh = health.servicesEnabled === true && health.foregroundGranted === true
    && health.lastSampleAt != null && now - health.lastSampleAt <= freshnessMs
    && health.lastSentAt != null && now - health.lastSentAt <= freshnessMs;
  const disconnected = tracking && !fresh && !health.connected;
  const waitingGps = tracking && !fresh;
  const reason = !active && blocker ? blocker.title
    : locationBlocked ? (health.servicesEnabled === false ? "Dịch vụ vị trí đang tắt" : "Cần cấp quyền vị trí")
    : disconnected ? "Đang kết nối lại"
    : waitingGps ? "Đang chờ vị trí GPS mới"
    : undefined;
  const title = loading ? "Đang kiểm tra trạng thái"
    : reason ?? (active ? "Đang thực hiện chuyến" : online ? "Sẵn sàng nhận chuyến" : "Đang tạm ngừng nhận chuyến");
  const connectionStateLabel = active
    ? "Trạng thái: Đang trong chuyến"
    : online
      ? "Trạng thái: Trực tuyến"
      : "Trạng thái: Ngoại tuyến";
  const warning = !loading && Boolean(reason);
  const ready = !loading && !reason && online && !active;
  const vehicleList = acceptedVehicleTypes ?? (online && onlineVehicle ? [onlineVehicle] : []);
  const showVehicleGroup = !loading && !active && vehicleList.length > 0 && (online || !blocker);
  const gpsStatusLabel = locationBlocked
    ? "Cần cấp quyền"
    : disconnected
      ? "Chưa kết nối"
      : waitingGps
        ? "Đang chờ GPS"
        : ready
          ? "Ổn định"
          : "Kiểm tra";
  const action = !active && blocker?.action
    ? { label: blocker.action, onPress: blocker.onPress }
    : locationBlocked ? { label: "Kiểm tra quyền vị trí", onPress: onDiagnostics }
    : disconnected || waitingGps ? { label: "Kiểm tra kết nối và GPS", onPress: health.retry }
    : undefined;

  return (
    <Card style={[styles.card, { backgroundColor: warning ? colors.warningContainer : colors.cardSurface }]}>
      <View style={styles.heading}>
        <MaterialIcons
          name={warning ? "warning-amber" : ready ? "check-circle" : "pause-circle-outline"}
          color={warning ? colors.onWarningContainer : ready ? colors.successStrong : colors.onSurfaceVariant}
          size={26}
          importantForAccessibility="no"
        />
        <View style={styles.headingCopy}>
          <Text
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            style={[
              styles.title,
              { color: warning ? colors.onWarningContainer : ready ? colors.primary : colors.onSurface },
            ]}
          >
            {title}
          </Text>
          {!loading ? (
            <Text style={[styles.statusLine, { color: warning ? colors.onWarningContainer : colors.onSurfaceVariant }]}>
              {connectionStateLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {showVehicleGroup ? (
        <GroupedList
          title="Loại xe nhận chuyến"
          variant="muted"
          style={styles.vehicleGroup}
          cardStyle={styles.vehicleGroupCard}
        >
          {vehicleList.map((type) => {
            const label = defaultVehicleLabel(type);
            if (online) {
              const receiving = onlineVehicle === type;
              const statusText = onlineVehicle == null
                ? "Chưa xác định"
                : receiving
                  ? "Đang nhận"
                  : "Không nhận";
              return (
                <View
                  key={type}
                  accessible
                  accessibilityLabel={`${label}, ${statusText}`}
                  style={styles.vehicleRow}
                >
                  <Text style={[styles.vehicleName, { color: colors.onSurface }]}>{label}</Text>
                  <Text
                    style={[
                      styles.vehicleState,
                      { color: receiving ? colors.primary : colors.onSurfaceVariant },
                    ]}
                  >
                    {statusText}
                  </Text>
                </View>
              );
            }

            const multiChoice = vehicleList.length > 1;
            const selected = selectedVehicle === type;
            const stateText = multiChoice
              ? (selected ? "Đang chọn" : "Chưa chọn")
              : "Sẵn sàng nhận";

            if (multiChoice && onSelectVehicle) {
              return (
                <MotionPressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${label}, ${stateText}`}
                  onPress={() => onSelectVehicle(type)}
                  style={[
                    styles.vehicleRow,
                    selected && { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <View style={styles.vehicleMeta}>
                    <Text style={[styles.vehicleName, { color: selected ? colors.onPrimaryContainer : colors.onSurface }]}>
                      {label}
                    </Text>
                    {selected && vehicleDetail ? (
                      <Text style={[styles.vehicleDetail, { color: colors.onPrimaryContainer }]}>
                        {vehicleDetail}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.vehicleState,
                      { color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                    ]}
                  >
                    {stateText}
                  </Text>
                </MotionPressable>
              );
            }

            return (
              <View
                key={type}
                accessible
                accessibilityLabel={`${label}, ${stateText}`}
                style={styles.vehicleRow}
              >
                <View style={styles.vehicleMeta}>
                  <Text style={[styles.vehicleName, { color: colors.onSurface }]}>{label}</Text>
                  {vehicleDetail ? (
                    <Text style={[styles.vehicleDetail, { color: colors.onSurfaceVariant }]}>
                      {vehicleDetail}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.vehicleState, { color: colors.onSurfaceVariant }]}>
                  {stateText}
                </Text>
              </View>
            );
          })}
        </GroupedList>
      ) : null}

      {!loading && action ? (
        <Button variant={warning ? "primary" : "secondary"} label={action.label} onPress={action.onPress} />
      ) : null}

      {!locationBlocked || action?.onPress !== onDiagnostics ? (
        warning ? (
          <Button variant="ghost" label="Chi tiết kết nối và GPS" onPress={onDiagnostics} />
        ) : (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`Kết nối GPS: ${gpsStatusLabel}`}
            onPress={onDiagnostics}
            style={[styles.gpsSummaryRow, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <View style={styles.gpsLabelGroup}>
              <MaterialIcons
                name={ready ? "gps-fixed" : "gps-not-fixed"}
                size={18}
                color={ready ? colors.primary : colors.onSurfaceVariant}
                importantForAccessibility="no"
              />
              <Text style={[styles.gpsLabelText, { color: colors.onSurface }]}>
                Kết nối GPS
              </Text>
            </View>
            <View style={styles.gpsValueGroup}>
              <Text style={[styles.gpsStatusText, { color: ready ? colors.primary : colors.onSurfaceVariant }]}>
                {gpsStatusLabel}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.onSurfaceVariant}
                importantForAccessibility="no"
              />
            </View>
          </MotionPressable>
        )
      ) : null}

      {!loading ? children : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceLg, gap: spacing.px3 },
  heading: { flexDirection: "row", alignItems: "flex-start", gap: spacing.spaceSm + spacing.xxs },
  headingCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  title: { ...typography.sectionTitle },
  statusLine: { ...typography.caption },
  vehicleGroup: { gap: 6 },
  vehicleGroupCard: { padding: spacing.spaceSm, borderRadius: borderRadius.default },
  vehicleRow: {
    minHeight: 48,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.spaceSm,
    paddingHorizontal: spacing.spaceSm + spacing.xxs,
    paddingVertical: spacing.spaceSm,
    borderRadius: borderRadius.default,
  },
  vehicleMeta: { flex: 1, minWidth: 120, gap: spacing.xxs },
  vehicleName: { ...typography.cardTitle },
  vehicleDetail: { ...typography.bodySecondary },
  vehicleState: { ...typography.badge },
  gpsSummaryRow: {
    minHeight: 48,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.spaceSm,
    paddingHorizontal: spacing.spaceMd,
    paddingVertical: spacing.px3,
    borderRadius: borderRadius.default,
  },
  gpsLabelGroup: { flexDirection: "row", alignItems: "center", gap: spacing.spaceSm, flexShrink: 1 },
  gpsLabelText: { ...typography.label },
  gpsValueGroup: { flexDirection: "row", alignItems: "center", gap: spacing.xxs, flexShrink: 0 },
  gpsStatusText: { ...typography.badge },
});
