import { env } from '@/config/env';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { BookingMapProps } from './types';
import { bookingStyles as s } from './mapStyles';

export function BookingMap({ center, pickup, dropoff, driver, route, interactive = true, editablePin = false, onCenterChange, onReadyChange, onMovingChange }: BookingMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const editableMarker = useRef<mapboxgl.Marker | null>(null);
  const callbacks = useRef({ onCenterChange, onReadyChange, onMovingChange });
  const initial = useRef({ center, pickup, dropoff, route, interactive, editablePin });
  const [failed, setFailed] = useState(!env.mapboxToken);
  useEffect(() => { callbacks.current = { onCenterChange, onReadyChange, onMovingChange }; }, [onCenterChange, onReadyChange, onMovingChange]);
  useEffect(() => {
    if (!container.current || !env.mapboxToken) { callbacks.current.onReadyChange?.(false); return; }
    const state = initial.current;
    let instance: mapboxgl.Map;
    try {
      instance = new mapboxgl.Map({ container: container.current, accessToken: env.mapboxToken, style: 'mapbox://styles/mapbox/streets-v12', center: [state.center.lng, state.center.lat], zoom: 15, interactive: state.interactive, attributionControl: true });
      map.current = instance;
      instance.on('load', () => {
        callbacks.current.onReadyChange?.(true);
        if (state.editablePin) {
          const marker = new mapboxgl.Marker({ color: '#12B76A', draggable: true }).setLngLat([state.center.lng, state.center.lat]).addTo(instance);
          editableMarker.current = marker;
          marker.on('dragstart', () => callbacks.current.onMovingChange?.(true));
          marker.on('dragend', () => { const point = marker.getLngLat(); callbacks.current.onCenterChange?.({ lat: point.lat, lng: point.lng }); callbacks.current.onMovingChange?.(false); instance.easeTo({ center: point, duration: 250 }); });
        }
        for (const [index, place] of [state.pickup, state.dropoff].entries()) if (place) new mapboxgl.Marker({ color: index === 0 ? '#12B76A' : '#F04438' }).setLngLat([place.coordinate.lng, place.coordinate.lat]).addTo(instance);
        if (state.pickup && state.dropoff) instance.fitBounds([[state.pickup.coordinate.lng, state.pickup.coordinate.lat], [state.dropoff.coordinate.lng, state.dropoff.coordinate.lat]], { padding: 45, maxZoom: 16, duration: 0 });
        if ((state.route?.length ?? 0) > 1) {
          instance.addSource('booking-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: state.route!.map(point => [point.lng, point.lat]) }, properties: {} } });
          instance.addLayer({ id: 'booking-route-line', type: 'line', source: 'booking-route', paint: { 'line-color': '#208AEF', 'line-width': 5 } });
        }
        const point = instance.getCenter(); callbacks.current.onCenterChange?.({ lat: point.lat, lng: point.lng });
      });
      instance.on('movestart', () => callbacks.current.onMovingChange?.(true));
      instance.on('moveend', () => { const point = instance.getCenter(); editableMarker.current?.setLngLat(point); callbacks.current.onCenterChange?.({ lat: point.lat, lng: point.lng }); callbacks.current.onMovingChange?.(false); });
      instance.on('click', event => { if (state.interactive) instance.easeTo({ center: event.lngLat, duration: 300 }); });
      instance.on('error', () => { setFailed(true); callbacks.current.onReadyChange?.(false); });
    } catch { Promise.resolve().then(() => { setFailed(true); callbacks.current.onReadyChange?.(false); }); }
    return () => { map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => { if (!dropoff) map.current?.easeTo({ center: [center.lng, center.lat], duration: 300 }); }, [center.lat, center.lng, dropoff]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !driver) { driverMarker.current?.remove(); driverMarker.current = null; return; }
    const draw = () => {
      driverMarker.current ??= new mapboxgl.Marker({ color: '#2563EB' }).setLngLat([driver.lng, driver.lat]).addTo(instance);
      driverMarker.current.setLngLat([driver.lng, driver.lat]);
      if (!instance.getBounds().contains([driver.lng, driver.lat])) instance.fitBounds(instance.getBounds().extend([driver.lng, driver.lat]), { padding: 45, maxZoom: 16 });
    };
    if (instance.isStyleLoaded()) draw(); else instance.once('load', draw);
    return () => { instance.off('load', draw); };
  }, [driver]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !route || route.length < 2) return;
    const updateRoute = () => {
      const data: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', geometry: { type: 'LineString', coordinates: route.map(point => [point.lng, point.lat]) }, properties: {} };
      const source = instance.getSource('booking-route') as mapboxgl.GeoJSONSource | undefined;
      if (source) source.setData(data);
      else { instance.addSource('booking-route', { type: 'geojson', data }); instance.addLayer({ id: 'booking-route-line', type: 'line', source: 'booking-route', paint: { 'line-color': '#208AEF', 'line-width': 5 } }); }
    };
    if (instance.isStyleLoaded()) updateRoute(); else instance.once('load', updateRoute);
    return () => { instance.off('load', updateRoute); };
  }, [route]);
  return <View style={s.flex}><div ref={container} style={{ position: 'absolute', inset: 0 }} />{failed ? <View style={[s.flex, s.empty, { justifyContent: 'center', backgroundColor: '#E9F0F3' }]}><Text style={s.muted}>Bản đồ chưa khả dụng. Bạn vẫn có thể tìm và chọn địa chỉ.</Text></View> : null}</View>;
}
