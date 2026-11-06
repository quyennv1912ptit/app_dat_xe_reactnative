import { env } from "@/config/env";
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
import { useMemo, useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import type { NearbyDriverMarker, RideCoordinates } from "@datxe/shared";
import { homeMapBounds } from "./homeMapViewport";

type HomeMapProps = {
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
  /** Bản đồ phủ toàn màn hình (trang chủ), ẩn tiêu đề và chú thích. */
  fullscreen?: boolean;
  /** Giữ tương thích API với bản native. */
  recenterToken?: number;
};

const mapboxToken = env.mapboxToken;

export function HomeMap({
  coordinate,
  drivers,
  fullscreen = false,
  recenterToken = 0,
}: HomeMapProps) {
  const colors = useThemeColors();

  useLanguage();

  const styles = useThemedStyles(base_styles);

  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [failedRequest, setFailedRequest] = useState("");
  const imageUrl = useMemo(() => {
    if (!coordinate || !mapboxToken || frame.width < 1 || frame.height < 1) return null;
    const { sw, ne } = homeMapBounds(coordinate);
    const scale = Math.min(1, 1280 / Math.max(frame.width, frame.height));
    const width = Math.max(1, Math.round(frame.width * scale));
    const height = Math.max(1, Math.round(frame.height * scale));
    const pin = (size: "s" | "l", symbol: string, color: string, point: RideCoordinates) =>
      `pin-${size}-${symbol}+${color.replace("#", "")}(${point.lng.toFixed(5)},${point.lat.toFixed(5)})`;
    const overlay = [
      pin("l", "circle", colors.primary, coordinate),
      ...drivers.map(({ location }) => pin("s", "car", colors.error, location)),
    ].join(",");
    const bounds = `[${[...sw, ...ne].map((value) => value.toFixed(5)).join(",")}]`;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlay}/${bounds}/${width}x${height}?access_token=${encodeURIComponent(mapboxToken)}`;
  }, [coordinate, drivers, frame, colors.primary, colors.error]);

  const requestKey = `${recenterToken}:${imageUrl}`;

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

      <View
        style={fullscreen ? extra.fullFrame : styles.mapFrame}
        onLayout={({ nativeEvent: { layout: { width, height } } }) =>
          setFrame((current) => current.width === width && current.height === height ? current : { width, height })
        }
      >
        {imageUrl && failedRequest !== requestKey ? (
          <ImageBackground
            key={requestKey}
            accessibilityLabel={i18nT(
              "Bản đồ vị trí hiện tại và các tài xế đang trực tuyến gần đó",
            )}
            source={{ uri: imageUrl }}
            onError={() => setFailedRequest(requestKey)}
            resizeMode="contain"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.fallbackText}>
              {i18nT(
                !coordinate ? "Cho phép truy cập vị trí để xem bản đồ quanh bạn."
                  : mapboxToken && !imageUrl ? "Đang tải bản đồ…"
                  : "Bản đồ hiện chưa khả dụng. Vui lòng thử lại sau.",
              )}
            </Text>
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

const extra = {
  fullRoot: { flex: 1 },
  fullFrame: { flex: 1, overflow: "hidden" },
} as const;

const base_styles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: { gap: spacing.spaceSm },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.spaceSm,
    },
    headingCopy: { flex: 1, gap: spacing.py0_5 },
    title: { ...typography.titleMd, color: colors.onSurface },
    subtitle: { ...typography.labelSm, color: colors.onSurfaceVariant },
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
    countText: { ...typography.labelMd, color: colors.onSurface },
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
    legendText: { ...typography.labelSm, color: colors.onSurfaceVariant },
  });
