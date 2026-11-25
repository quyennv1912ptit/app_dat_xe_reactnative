import { env } from '@/config/env';
import { useReducedMotion } from '@datxe/ui';
import {
  circleBounds,
  GoongMap,
  mapBounds,
  routeCumulativeMeters,
  trimRouteAtDistance,
  useSmoothedRoutePosition,
  type GoongMapMarker,
} from '@datxe/ui/goong-map';
import { useMemo } from 'react';
import type { BookingMapProps } from './types';

// Cùng nhịp với luồng vị trí tài xế: chấm đi men theo cung đường giữa 2 lần cập nhật.
const SMOOTHING_MS = 1000;

export function BookingMap({ pickup, dropoff, driver, vehicleType, route, searchRadius, ...props }: BookingMapProps) {
  const reducedMotion = useReducedMotion();
  const coordinates = useMemo(() => route ?? [], [route]);
  const cumulative = useMemo(() => routeCumulativeMeters(coordinates), [coordinates]);
  const { position, alongMeters } = useSmoothedRoutePosition(driver ?? null, coordinates, cumulative, {
    durationMs: SMOOTHING_MS,
    enabled: !reducedMotion,
  });

  const markers = useMemo(() => {
    const list: GoongMapMarker[] = [];
    if (pickup) list.push({ id: 'pickup', coordinate: pickup.coordinate, kind: 'pickup' });
    if (dropoff) list.push({ id: 'dropoff', coordinate: dropoff.coordinate, kind: 'dropoff' });
    if (position) list.push({ id: 'driver', coordinate: position, kind: 'driver', vehicleType });
    return list;
  }, [pickup, dropoff, position, vehicleType]);

  // Cắt tuyến ngay tại vị trí tài xế đã đi qua, không đợi tới đỉnh polyline kế tiếp.
  const remainingRoute = useMemo(() => {
    if (alongMeters == null || coordinates.length < 2) return route;
    return trimRouteAtDistance(coordinates, cumulative, alongMeters);
  }, [coordinates, cumulative, alongMeters, route]);

  // Bounds chỉ lấy điểm đón/trả + tuyến gốc (hoặc vòng tròn bán kính quét khi đang tìm tài xế).
  // Vị trí tài xế đổi mỗi frame không được đưa vào bounds, nếu không camera sẽ fitBounds lại liên tục.
  const bounds = useMemo(() => {
    const anchors = [pickup?.coordinate, dropoff?.coordinate].filter(
      (point): point is NonNullable<typeof point> => Boolean(point),
    );
    const points = [...anchors, ...(route ?? [])];
    if (points.length > 1) return mapBounds(points);
    if (searchRadius && searchRadius.radiusMeters > 0) {
      return circleBounds(searchRadius.center, searchRadius.radiusMeters);
    }
    return undefined;
  }, [pickup?.coordinate, dropoff?.coordinate, route, searchRadius]);

  return (
    <GoongMap
      {...props}
      bounds={bounds}
      markers={markers}
      route={remainingRoute}
      searchRadius={searchRadius}
      mapKey={env.goongMapKey}
    />
  );
}
