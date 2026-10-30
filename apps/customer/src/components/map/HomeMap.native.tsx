import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemeColors , useThemedStyles, useThemeColor , useTheme , borderRadius,colors,spacing,typography } from '@datxe/ui';
import { env } from '@/config/env';
import { initializeMapbox } from '@/lib/initializeMapbox';
import Mapbox,{ Camera,CircleLayer,MapView,ShapeSource,PointAnnotation } from '@rnmapbox/maps';
import { useEffect,useMemo,useState } from 'react';
import { ActivityIndicator,StyleSheet,Text,View } from 'react-native';


import type { NearbyDriverMarker,RideCoordinates } from '@datxe/shared';

type HomeMapProps = {
  coordinate: RideCoordinates | null;
  drivers: NearbyDriverMarker[];
};

type MapMarkerProperties = { markerType: 'passenger' | 'driver' };
type MapMarkerFeature = {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: MapMarkerProperties;
};

const mapboxToken = env.mapboxToken;

export function HomeMap({ coordinate, drivers }: HomeMapProps) {
 useLanguage();

 const colors=useThemeColors();

 const styles=useThemedStyles(base_styles);
 const themeColor=useThemeColor();

  const {dark}=useTheme();
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'unavailable'>(mapboxToken ? 'loading' : 'unavailable');
  const shape = useMemo(() => {
    const features: MapMarkerFeature[] = [];
    if (coordinate) {
      features.push({
        type: 'Feature',
        id: 'passenger-location',
        geometry: { type: 'Point', coordinates: [coordinate.lng, coordinate.lat] },
        properties: { markerType: 'passenger' },
      });
    }
    drivers.forEach((driver, index) => {
      features.push({
        type: 'Feature',
        id: `nearby-driver-${index}`,
        geometry: {
          type: 'Point',
          coordinates: [driver.location.lng, driver.location.lat],
        },
        properties: { markerType: 'driver' },
      });
    });
    return { type: 'FeatureCollection' as const, features };
  }, [coordinate, drivers]);

  useEffect(() => {
    let mounted = true;
    void initializeMapbox(Mapbox, mapboxToken).then(
      ready => { if (mounted) setMapStatus(ready ? 'ready' : 'unavailable'); },
      () => { if (mounted) setMapStatus('unavailable'); },
    );
    return () => { mounted = false; };
  }, []);

  const fallbackMessage = !coordinate
    ? i18nT("Cho phép truy cập vị trí để xem bản đồ quanh bạn.")
    : mapStatus === 'unavailable'
      ? i18nT("Bản đồ hiện chưa khả dụng. Vui lòng thử lại sau.")
      : i18nT("Đang tải bản đồ…");

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{i18nT("Tài xế quanh bạn")}</Text>
          <Text style={styles.subtitle}>{i18nT("Vị trí tài xế được hiển thị gần đúng để bảo vệ riêng tư")}</Text>
        </View>
        <View style={styles.countBadge}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>{i18nT(drivers.length)}</Text>
        </View>
      </View>

      <View style={styles.mapFrame}>
        {coordinate && mapStatus === 'ready' ? (
          <MapView
            style={StyleSheet.absoluteFill}
            styleURL={dark?'mapbox://styles/mapbox/dark-v11':'mapbox://styles/mapbox/streets-v11'}
            compassEnabled
            scaleBarEnabled={false}
            attributionEnabled
            logoEnabled
            onMapLoadingError={() => setMapStatus('unavailable')}
          >
            <Camera
              centerCoordinate={[coordinate.lng, coordinate.lat]}
              zoomLevel={13.5}
              animationMode="easeTo"
              animationDuration={500}
            />
            {drivers.map((driver, index) => <PointAnnotation key={String(index)} id={'driver-' + index} coordinate={[driver.location.lng, driver.location.lat]}><View style={{ backgroundColor: themeColor("#FFFFFF","backgroundColor"), borderRadius: 20, padding: 6, borderWidth: 2, borderColor: themeColor("#14A66A","borderColor") }}><Text style={{ fontSize: 22 }}>🚘</Text></View></PointAnnotation>)}
            <ShapeSource id="home-nearby-map-markers" shape={shape}>
              <CircleLayer id="home-passenger-halo" filter={['==', ['get', 'markerType'], 'passenger']} style={{ circleColor: themeColor("#2563EB","circleColor"), circleRadius: 23, circleOpacity: 0.15 }} />
              <CircleLayer
                id="home-passenger-location"
                filter={['==', ['get', 'markerType'], 'passenger']}
                style={{
                  circleColor: themeColor("#2563EB","circleColor"),
                  circleRadius: 9,
                  circleStrokeColor: themeColor("#FFFFFF","circleStrokeColor"),
                  circleStrokeWidth: 3,
                }}
              />
            </ShapeSource>
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            {mapStatus === 'loading' && coordinate
              ? <ActivityIndicator color={colors.primary} />
              : null}
            <Text style={styles.fallbackText}>{i18nT(fallbackMessage)}</Text>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.passengerDot} />
          <Text style={styles.legendText}>{i18nT("Bạn")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.driverDot} />
          <Text style={styles.legendText}>{i18nT("Tài xế đang trực tuyến")}</Text>
        </View>
      </View>
    </View>
  );
}

const base_styles = StyleSheet.create({
  section: {
    gap: spacing.spaceSm,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
  },
  headingCopy: {
    flex: 1,
    gap: spacing.py0_5,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  countBadge: {
    minWidth: spacing.iconButtonSm,
    height: spacing.iconButtonSm,
    paddingHorizontal: spacing.spaceSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceXs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
    backgroundColor: '#14A66A',
  },
  countText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  mapFrame: {
    height: 330,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spaceLg,
    gap: spacing.spaceSm,
  },
  fallbackText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceLg,
    paddingHorizontal: spacing.spaceXs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  passengerDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  driverDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: '#14A66A',
  },
  legendText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
