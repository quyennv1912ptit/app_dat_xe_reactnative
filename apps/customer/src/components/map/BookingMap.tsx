import { env } from '@/config/env';
import { useReducedMotion } from '@datxe/ui';
import {
  GoongMap,
  mapBounds,
  routeCumulativeMeters,
  trimRouteAtDistance,
  useSmoothedRoutePosition,
  type GoongMapMarker,
} from '@datxe/ui/goong-map';
import type { RideCoordinates } from '@datxe/shared';
import { useMemo } from 'react';
import type { BookingMapProps } from './types';

const LIVE_POSITION_SMOOTH_MS = 1000;
/** Tuyến rỗng dùng chung để không đổi identity mỗi render và khởi động lại nội suy. */
const NO_ROUTE: RideCoordinates[] = [];

export function BookingMap({ pickup, dropoff, driver, vehicleType, ...props }: BookingMapProps) {
  const reducedMotion = useReducedMotion();
  const route = props.route;
  const cumulative = useMemo(() => routeCumulativeMeters(route ?? NO_ROUTE), [route]);

  // Marker tài xế chạy men theo tuyến giữa các gói vị trí WebSocket, bám tim đường
  // khi lệch dưới 25 m thay vì nhảy cục mỗi lần có vị trí mới.
  const { position: liveDriver, alongMeters } = useSmoothedRoutePosition(
    driver ?? null,
    route ?? NO_ROUTE,
    cumulative,
    { durationMs: LIVE_POSITION_SMOOTH_MS, enabled: !reducedMotion },
  );

  // Đường còn lại bắt đầu đúng tại vị trí tài xế: phần đã đi biến mất ngay,
  // không chờ lần refetch tuyến kế tiếp.
  const trimmedRoute = useMemo(() => {
    if (!route || route.length < 2 || alongMeters == null) return route;
    const remaining = trimRouteAtDistance(route, cumulative, alongMeters);
    return remaining.length > 1 ? remaining : undefined;
  }, [route, cumulative, alongMeters]);

  const markers: GoongMapMarker[] = [];
  if (pickup) markers.push({ id: 'pickup', coordinate: pickup.coordinate, kind: 'pickup' });
  if (dropoff) markers.push({ id: 'dropoff', coordinate: dropoff.coordinate, kind: 'dropoff' });
  if (liveDriver) markers.push({ id: 'driver', coordinate: liveDriver, kind: 'driver', vehicleType });

  // Bounds chỉ tính từ tuyến gốc + điểm đón/trả để camera không fit lại mỗi frame
  // trong lúc marker tài xế đang được nội suy. Chỉ khi chưa có tuyến mới dùng
  // vị trí tài xế làm mốc.
  const boundsPoints = [
    ...(pickup ? [pickup.coordinate] : []),
    ...(dropoff ? [dropoff.coordinate] : []),
    ...(route ?? []),
  ];
  if (boundsPoints.length < 2 && driver) boundsPoints.push(driver);
  const bounds = boundsPoints.length > 1 ? mapBounds(boundsPoints) : undefined;

  return <GoongMap {...props} route={trimmedRoute} bounds={bounds} markers={markers} mapKey={env.goongMapKey} />;
}
