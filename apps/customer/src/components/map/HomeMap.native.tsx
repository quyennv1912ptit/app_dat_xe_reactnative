import { ActivityIndicator } from "react-native-paper";
import { env } from "@/config/env";
import { initializeMapbox } from "@/lib/initializeMapbox";
import { translate as i18nT } from "@datxe/shared";
import type { ThemeColors } from "@datxe/ui";
import {
  spacing,
  Typography as Text,
  typography,
  useLanguage,
  useThemeColors,
  useThemedStyles,
} from "@datxe/ui";
import Mapbox, {
  Camera,
  Images,
  MapView,
  PointAnnotation,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { NearbyDriverMarker, RideCoordinates } from "@datxe/shared";
import { homeMapBounds } from "./homeMapViewport";

/** Logo PtitGo dùng làm thẻ vị trí của người dùng trên bản đồ. */
const brandMark = require("../../../assets/images/brand-mark.png");

type HomeMapProps = {
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
  /** Bản đồ phủ toàn màn hình (trang chủ), ẩn tiêu đề và chú thích. */
  fullscreen?: boolean;
  /** Tăng giá trị này để camera quay lại vị trí người dùng. */
  recenterToken?: number;
};

const mapboxToken = env.mapboxToken;

export function HomeMap({
  coordinate,
  drivers,
  fullscreen = false,
  recenterToken = 0,
}: HomeMapProps) {
  const extra = useThemedStyles(extraStyles);

  useLanguage();

  const colors = useThemeColors();

  const styles = useThemedStyles(base_styles);

  const camera = useRef<Camera>(null);
  const lastRecenter = useRef(0);
  const bounds = useMemo(() => coordinate ? homeMapBounds(coordinate) : null, [coordinate]);

  const [mapStatus, setMapStatus] = useState<
    "loading" | "ready" | "unavailable"
  >(mapboxToken ? "loading" : "unavailable");

  useEffect(() => {
    if (recenterToken === lastRecenter.current || !bounds || !camera.current) return;
    lastRecenter.current = recenterToken;
    camera.current.setCamera({
      bounds,
      padding: { paddingTop: 72, paddingBottom: 56, paddingLeft: 24, paddingRight: 24 },
      animationMode: "easeTo",
      animationDuration: 500,
    });
  }, [bounds, recenterToken, mapStatus]);

  const passengerShape = useMemo(() => {
    if (!coordinate) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "passenger-location",
          geometry: {
            type: "Point" as const,
            coordinates: [coordinate.lng, coordinate.lat],
          },
          properties: {},
        },
      ],
    };
  }, [coordinate]);

  useEffect(() => {
    let mounted = true;
    void initializeMapbox(Mapbox, mapboxToken).then(
      (ready) => {
        if (mounted) setMapStatus(ready ? "ready" : "unavailable");
      },
      () => {
        if (mounted) setMapStatus("unavailable");
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  const fallbackMessage = !coordinate
    ? i18nT("Cho phép truy cập vị trí để xem bản đồ quanh bạn.")
    : mapStatus === "unavailable"
      ? i18nT("Bản đồ hiện chưa khả dụng. Vui lòng thử lại sau.")
      : i18nT("Đang tải bản đồ…");

  return (
    <View style={fullscreen ? extra.fullRoot : styles.section}>
      {fullscreen ? null : (
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>{i18nT("Tài xế quanh bạn")}</Text>
            <Text style={styles.subtitle}>
              {i18nT("Vị trí tài xế được hiển thị gần đúng để bảo vệ riêng tư")}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <View style={styles.countDot} />
            <Text style={styles.countText}>{i18nT(drivers.length)}</Text>
          </View>
        </View>
      )}

      <View style={fullscreen ? extra.fullFrame : styles.mapFrame}>
        {coordinate && mapStatus === "ready" ? (
          <MapView
            style={StyleSheet.absoluteFill}
            styleURL="mapbox://styles/mapbox/streets-v11"
            compassEnabled={!fullscreen}
            compassViewPosition={1}
            scaleBarEnabled={false}
            attributionEnabled
            logoEnabled
            onMapLoadingError={() => setMapStatus("unavailable")}
          >
            <Camera
              ref={camera}
              defaultSettings={{
                bounds: bounds ?? undefined,
                padding: { paddingTop: 72, paddingBottom: 56, paddingLeft: 24, paddingRight: 24 },
              }}
            />
            {/* Logo PtitGo (đã tách nền) làm marker vị trí: dùng SymbolLayer để ảnh
                PNG trong suốt hiển thị đúng trên bề mặt bản đồ, không bị khung trắng. */}
            <Images images={{ "passenger-mark": brandMark }} />
            {passengerShape ? (
              <ShapeSource id="passenger-mark-source" shape={passengerShape}>
                <SymbolLayer
                  id="passenger-mark"
                  style={{
                    iconImage: "passenger-mark",
                    iconSize: 0.22,
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
              </ShapeSource>
            ) : null}
            {drivers.map(({ location }, index) => {
              const id = `nearby-driver-${location.lng}-${location.lat}-${index}`;
              return (
                <PointAnnotation
                  key={id}
                  id={id}
                  coordinate={[location.lng, location.lat]}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={extra.driverRing} collapsable={false}>
                    <View style={extra.driverMarker}>
                      <Text style={extra.driverIcon}>🚘</Text>
                    </View>
                  </View>
                </PointAnnotation>
              );
            })}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            {mapStatus === "loading" && coordinate ? (
              <ActivityIndicator color={colors.primary} />
            ) : null}
            <Text style={styles.fallbackText}>{i18nT(fallbackMessage)}</Text>
          </View>
        )}
      </View>

      {fullscreen ? null : (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.passengerDot} />
            <Text style={styles.legendText}>{i18nT("Bạn")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.driverDot} />
            <Text style={styles.legendText}>
              {i18nT("Tài xế đang trực tuyến")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: spacing.spaceSm,
    },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceSm,
    },
    headingCopy: {
      flex: 1,
      gap: spacing.py0_5,
    },
    title: {
      ...typography.titleMd,
      color: colors.onSurface,
    },
    subtitle: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
    countBadge: {
      minWidth: spacing.iconButtonSm,
      height: spacing.iconButtonSm - spacing.px1_5,
      paddingHorizontal: spacing.spaceSm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.spaceXs,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLow,
    },
    countDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: colors.error,
    },
    countText: {
      ...typography.labelMd,
      color: colors.onSurface,
    },
    mapFrame: {
      height: 300,
      overflow: "hidden",
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLow,
    },
    mapFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.spaceLg,
      gap: spacing.spaceSm,
    },
    fallbackText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceLg,
      paddingHorizontal: spacing.spaceXs,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.spaceXs,
    },
    passengerDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    driverDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.error,
    },
    legendText: {
      ...typography.labelSm,
      color: colors.onSurfaceVariant,
    },
  });

const extraStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fullRoot: { flex: 1 },
    fullFrame: { flex: 1, overflow: "hidden" },
    driverRing: {
      padding: 2,
      borderRadius: 18,
      backgroundColor: colors.error,
    },
    driverMarker: {
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.cardSurface,
    },
    driverIcon: { fontSize: 20, lineHeight: 24 },
  });
