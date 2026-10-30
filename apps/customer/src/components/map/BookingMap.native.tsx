import { translate as i18nT } from '@datxe/shared';
import { useLanguage , useThemedStyles, useThemeColor , useTheme } from '@datxe/ui';
import { env } from '@/config/env';
import { initializeMapbox } from '@/lib/initializeMapbox';
import Mapbox, { Camera, CircleLayer, LineLayer, MapView, ShapeSource } from '@rnmapbox/maps';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { BookingMapProps } from './types';
import { bookingStyles as base_s } from './mapStyles';

export function BookingMap({ center, pickup, dropoff, driver, route, interactive = true, onCenterChange, onReadyChange, onMovingChange }: BookingMapProps) {
 useLanguage();

 const s=useThemedStyles(base_s);
 const themeColor=useThemeColor();

  const {dark}=useTheme();
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [initialCamera] = useState({ centerCoordinate: [center.lng, center.lat], zoomLevel: 15 });
  const camera = useRef<Camera>(null);
  const readyCallback = useRef(onReadyChange);
  useEffect(() => { readyCallback.current = onReadyChange; }, [onReadyChange]);
  useEffect(() => {
    let active = true;
    void initializeMapbox(Mapbox, env.mapboxToken).then(ready => {
      if (active) { setStatus(ready ? 'ready' : 'unavailable'); readyCallback.current?.(ready); }
    }, () => { if (active) { setStatus('unavailable'); readyCallback.current?.(false); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (status === 'ready' && !dropoff) camera.current?.setCamera({ centerCoordinate: [center.lng, center.lat], zoomLevel: 16, animationDuration: 350 });
  }, [center.lat, center.lng, dropoff, status]);
  const markers = useMemo(() => ({ type: 'FeatureCollection' as const, features: [pickup, dropoff, driver ? { coordinate: driver } : null].flatMap((place, index) => place ? [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [place.coordinate.lng, place.coordinate.lat] }, properties: { kind: index } }] : []) }), [pickup, dropoff, driver]);
  const line = useMemo(() => ({ type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: (route ?? []).map(point => [point.lng, point.lat]) }, properties: {} }), [route]);
  const points = [pickup?.coordinate, dropoff?.coordinate, driver].filter((point): point is { lat: number; lng: number } => Boolean(point));
  const bounds = points.length >= 2 ? { ne: [Math.max(...points.map(point => point.lng)) + 0.002, Math.max(...points.map(point => point.lat)) + 0.002], sw: [Math.min(...points.map(point => point.lng)) - 0.002, Math.min(...points.map(point => point.lat)) - 0.002], paddingTop: 45, paddingBottom: 45, paddingLeft: 40, paddingRight: 40 } : undefined;
  if (status !== 'ready') return <View style={[s.flex, s.empty, { justifyContent: 'center', backgroundColor: themeColor("#E9F0F3","backgroundColor") }]}>{status === 'loading' ? <ActivityIndicator /> : null}<Text style={s.muted}>{i18nT(status === 'loading' ? 'Đang mở bản đồ…' : 'Bản đồ chưa khả dụng. Bạn vẫn có thể tìm và chọn địa chỉ.')}</Text></View>;
  return <MapView style={StyleSheet.absoluteFill} styleURL={dark?'mapbox://styles/mapbox/dark-v11':'mapbox://styles/mapbox/streets-v12'} scrollEnabled={interactive} zoomEnabled={interactive} rotateEnabled={false} pitchEnabled={false}
    onCameraChanged={() => onMovingChange?.(true)}
    onMapIdle={event => { const [lng, lat] = event.properties.center; onCenterChange?.({ lat, lng }); onMovingChange?.(false); }}
    onPress={event => { if (interactive && !onCenterChange && event.geometry.type === 'Point') camera.current?.setCamera({ centerCoordinate: event.geometry.coordinates, animationDuration: 300 }); }}
    onMapLoadingError={() => { setStatus('unavailable'); readyCallback.current?.(false); }}>
    <Camera ref={camera} bounds={bounds} defaultSettings={initialCamera} animationDuration={400} />
    {line.geometry.coordinates.length > 1 ? <ShapeSource id="booking-route" shape={line}><LineLayer id="booking-route-line" style={{ lineColor: themeColor("#208AEF","lineColor"), lineWidth: 5, lineCap: 'round', lineJoin: 'round' }} /></ShapeSource> : null}
    <ShapeSource id="booking-points" shape={markers}>
      <CircleLayer id="booking-pickup" filter={['==', ['get', 'kind'], 0]} style={{ circleColor: themeColor("#12B76A","circleColor"), circleRadius: 8, circleStrokeWidth: 3, circleStrokeColor: themeColor("#FFFFFF","circleStrokeColor") }} />
      <CircleLayer id="booking-dropoff" filter={['==', ['get', 'kind'], 1]} style={{ circleColor: themeColor("#F04438","circleColor"), circleRadius: 8, circleStrokeWidth: 3, circleStrokeColor: themeColor("#FFFFFF","circleStrokeColor") }} />
      <CircleLayer id="live-driver" filter={['==', ['get', 'kind'], 2]} style={{ circleColor: themeColor("#2563EB","circleColor"), circleRadius: 10, circleStrokeWidth: 4, circleStrokeColor: themeColor("#FFFFFF","circleStrokeColor") }} />
    </ShapeSource>
  </MapView>;
}
