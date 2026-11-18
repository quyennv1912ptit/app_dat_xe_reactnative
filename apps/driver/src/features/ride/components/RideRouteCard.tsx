import { openRideDirections } from "@/lib/navigation";
import type { CustomerRideDetail } from "@datxe/shared";
import { Card, Typography as Text, spacing, typography, useThemeColors } from "@datxe/ui";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton } from "react-native-paper";
import type { RideStop, RouteMode } from "../ridePresentation";

export function RideRouteCard({
  ride,
  navigationStop,
  routeMode,
  children,
}: {
  ride: CustomerRideDetail;
  navigationStop?: RideStop;
  routeMode?: RouteMode;
  children?: ReactNode;
}) {
  const colors = useThemeColors();
  const dropoffFirst = routeMode === "to_dropoff" || routeMode === "at_dropoff";
  const stops: readonly RideStop[] = dropoffFirst ? ["dropoff", "pickup"] : ["pickup", "dropoff"];

  return (
    <Card style={[styles.card, { backgroundColor: colors.rideSurface }]}>
      <Text accessibilityRole="header" style={styles.heading}>Lộ trình</Text>
      {stops.map((stop, index) => {
        const pickup = stop === "pickup";
        const completedPickup = pickup && dropoffFirst;
        const label = completedPickup
          ? "Điểm đón đã qua"
          : pickup && routeMode === "at_pickup"
            ? "Tại điểm đón"
            : !pickup && routeMode === "at_dropoff"
              ? "Tại điểm trả"
              : pickup
                ? "Điểm đón"
                : "Điểm trả";
        const point = ride[stop];
        const address = pickup ? ride.pickupAddress : ride.dropoffAddress;
        const highlighted = navigationStop === stop || (pickup && routeMode === "at_pickup") || (!pickup && routeMode === "at_dropoff");

        return (
          <View key={stop} style={styles.stop}>
            {index === 0 ? <View style={[styles.connector, { borderColor: colors.outline }]} /> : null}
            <View style={[styles.dot, { backgroundColor: pickup ? colors.successStrong : colors.error }]} />
            <View style={styles.address}>
              <Text style={[styles.label, { color: highlighted ? colors.onSurface : colors.onSurfaceVariant }]}>
                {label}
              </Text>
              <Text
                style={[styles.addressText, completedPickup && [styles.addressCompleted, { color: colors.onSurfaceVariant }]]}
              >
                {address || "Chưa có địa chỉ"}
              </Text>
              {pickup && !dropoffFirst && ride.pickupNote ? (
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Ghi chú: {ride.pickupNote}</Text>
              ) : null}
            </View>
            {navigationStop === stop ? (
              <IconButton
                icon="navigation-variant"
                mode="contained-tonal"
                size={24}
                style={styles.navigation}
                containerColor={colors.secondaryContainer}
                iconColor={colors.onSecondaryContainer}
                accessibilityLabel={pickup ? "Mở chỉ đường tới điểm đón" : "Mở chỉ đường tới điểm trả"}
                disabled={point.lat == null || point.lng == null}
                onPress={() => openRideDirections(ride, stop)}
              />
            ) : null}
          </View>
        );
      })}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.spaceLg, gap: spacing.px3 },
  heading: { ...typography.sectionTitle },
  stop: { flexDirection: "row", gap: spacing.px3, minHeight: 48 },
  connector: {
    position: "absolute", top: 17, bottom: -25, left: 4,
    borderLeftWidth: 1, borderStyle: "dashed",
  },
  dot: { width: 9, height: 9, marginTop: 8, borderRadius: 999 },
  address: { flex: 1, minWidth: 0, gap: spacing.xxs },
  label: { ...typography.label },
  addressText: { ...typography.cardTitle },
  addressCompleted: { ...typography.body },
  navigation: { width: 48, height: 48, borderRadius: 24, margin: 0, alignSelf: "center" },
});
