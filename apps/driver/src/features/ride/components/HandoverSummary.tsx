import { DriverPhoto } from "@/components/DriverPhoto";
import { StatusBadge } from "@/components/StatusBadge";
import type { CustomerRideDetail } from "@datxe/shared";
import { Button, Card, Typography as Text, spacing, typography, useThemeColors } from "@datxe/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { PHOTO_ANGLES, photoAngleLabel } from "../photoAngles";

type Report = CustomerRideDetail["handoverReports"][number];
const angleOrder: readonly string[] = PHOTO_ANGLES.map(([angle]) => angle);

export function HandoverSummary({
  report,
  status,
  collapsiblePhotos = false,
  children,
}: {
  report: Report;
  status?: CustomerRideDetail["status"];
  collapsiblePhotos?: boolean;
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  const [photosOpen, setPhotosOpen] = useState(!collapsiblePhotos);
  const photos = [...report.photos].sort((a, b) => {
    const rank = (angle: string) => {
      const index = angleOrder.indexOf(angle);
      return index < 0 ? angleOrder.length : index;
    };
    return rank(a.angle) - rank(b.angle);
  });

  return (
    <Card style={[styles.card, { backgroundColor: colors.rideSurface }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          {report.phase === "PICKUP" ? "Biên bản nhận xe" : "Biên bản trả xe"}
        </Text>
        {status ? <StatusBadge kind="ride" value={status} contextLabel="Trạng thái chuyến" /> : null}
      </View>
      <Text style={{ color: report.confirmedByCustomer ? colors.successStrong : colors.onSurfaceVariant }}>
        {report.confirmedByCustomer ? "Khách đã xác nhận" : "Chờ khách xác nhận"}
        {report.revision && report.revision > 1 ? ` · Phiên bản ${report.revision}` : ""}
      </Text>
      <View style={styles.stats}>
        {([
          { icon: "speed", label: "Số km đồng hồ", value: `${report.odometer.toLocaleString("vi-VN")} km` },
          { icon: "local-gas-station", label: "Nhiên liệu", value: report.fuelLevel != null ? `${report.fuelLevel}%` : "Chưa ghi" },
        ] as const).map(({ icon, label, value }) => (
          <View key={label} style={[styles.stat, { backgroundColor: colors.rideInset }]}>
            <View style={styles.statValue}>
              <MaterialIcons name={icon} size={20} color={colors.primary} />
              <Text style={styles.value}>{value}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
          </View>
        ))}
      </View>
      {report.notes ? (
        <View style={styles.notes}>
          <Text style={{ color: colors.onSurfaceVariant }}>Ghi chú</Text>
          <Text>{report.notes}</Text>
        </View>
      ) : null}
      {photos.length ? (
        <View style={styles.gallery}>
          <View style={styles.galleryHeader}>
            <Text accessibilityRole="header" style={styles.heading}>
              Ảnh bàn giao ({photos.length})
            </Text>
            {collapsiblePhotos ? (
              <Button
                variant="secondary"
                label={photosOpen ? "Thu gọn ảnh" : `Xem ${photos.length} ảnh`}
                onPress={() => setPhotosOpen((current) => !current)}
                style={styles.togglePhotos}
              />
            ) : null}
          </View>
          {photosOpen ? (
            <View style={styles.grid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.cell}>
                  <DriverPhoto uri={photo.fileUrl} label={photoAngleLabel(photo.angle)} tile />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceLg, gap: spacing.spaceMd },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.spaceSm },
  heading: { ...typography.cardTitle },
  stats: { flexDirection: "row", gap: spacing.spaceSm },
  stat: { flex: 1, padding: spacing.px3, borderRadius: spacing.spaceMd, gap: spacing.spaceXs },
  statValue: { flexDirection: "row", alignItems: "center", gap: spacing.spaceSm - spacing.xxs },
  value: { ...typography.cardTitle, flexShrink: 1, fontVariant: ["tabular-nums"] },
  statLabel: { ...typography.caption },
  notes: { gap: spacing.spaceXs },
  gallery: { gap: spacing.px3 },
  galleryHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.spaceSm },
  togglePhotos: { width: "auto" },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "4%", rowGap: spacing.spaceSm },
  cell: { width: "48%" },
});
