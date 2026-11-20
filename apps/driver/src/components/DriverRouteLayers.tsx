import type { RideCoordinates } from '@datxe/shared';
import {
  CURRENT_LOCATION_BLUE,
  CURRENT_LOCATION_RING,
  TRIP_ROUTE_CASING,
  TRIP_ROUTE_COLOR,
  routeCumulativeMeters,
  trimRouteAtDistance,
  useSmoothedRoutePosition,
} from '@datxe/ui/goong-map';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { memo, useMemo } from 'react';

type Props = {
  coordinates: readonly RideCoordinates[];
  /** Vị trí GPS thô, cập nhật mỗi lần `watchPositionAsync` trả về. */
  target: RideCoordinates | null;
  destination: RideCoordinates;
  destinationColor: string;
  /** Thời gian nội suy giữa hai lần GPS; 0 = bám ngay vị trí thô. */
  smoothingMs: number;
  animate: boolean;
};

// Giữ tham chiếu ổn định để mỗi frame nội suy không đẩy lại paint/layout qua bridge.
const ROUTE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const;
const ROUTE_CASING_PAINT = { 'line-color': TRIP_ROUTE_CASING, 'line-width': 8 } as const;
const ROUTE_LINE_PAINT = { 'line-color': TRIP_ROUTE_COLOR, 'line-width': 5 } as const;
const POSITION_PAINT = {
  'circle-radius': 8,
  'circle-color': CURRENT_LOCATION_BLUE,
  'circle-stroke-width': 3,
  'circle-stroke-color': CURRENT_LOCATION_RING,
} as const;

/**
 * Lớp bản đồ động của màn chỉ đường: chấm vị trí và tuyến còn lại.
 * Tách riêng để mỗi frame nội suy chỉ vẽ lại phần bản đồ, không kéo theo
 * toàn bộ overlay/thẻ chỉ dẫn phía trên.
 */
export const DriverRouteLayers = memo(function DriverRouteLayers({
  coordinates,
  target,
  destination,
  destinationColor,
  smoothingMs,
  animate,
}: Props) {
  const cumulative = useMemo(() => routeCumulativeMeters(coordinates), [coordinates]);
  // Chấm chạy men theo cung đường và bám tim đường khi lệch dưới 25 m.
  const { position, alongMeters } = useSmoothedRoutePosition(target, coordinates, cumulative, {
    durationMs: smoothingMs,
    enabled: animate,
  });

  const routeLine = useMemo(() => {
    if (alongMeters == null || coordinates.length < 2) return null;
    const remaining = trimRouteAtDistance(coordinates, cumulative, alongMeters);
    return remaining.length > 1
      ? {
          type: 'LineString' as const,
          coordinates: remaining.map(({ lng, lat }) => [lng, lat] as [number, number]),
        }
      : null;
  }, [coordinates, cumulative, alongMeters]);

  const destinationData = useMemo(
    () => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [destination.lng, destination.lat] },
      properties: {},
    }),
    [destination.lat, destination.lng],
  );

  const destinationPaint = useMemo(
    () => ({
      'circle-radius': 9,
      'circle-color': destinationColor,
      'circle-stroke-width': 3,
      'circle-stroke-color': CURRENT_LOCATION_RING,
    }),
    [destinationColor],
  );

  return (
    <>
      {routeLine ? (
        <GeoJSONSource id="driver-route" data={routeLine}>
          <Layer id="driver-route-casing" type="line" paint={ROUTE_CASING_PAINT} layout={ROUTE_LAYOUT} />
          <Layer id="driver-route-line" type="line" paint={ROUTE_LINE_PAINT} layout={ROUTE_LAYOUT} />
        </GeoJSONSource>
      ) : null}
      {position ? (
        <GeoJSONSource
          id="driver-position"
          data={{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [position.lng, position.lat] },
            properties: {},
          }}
        >
          <Layer id="driver-position-dot" type="circle" paint={POSITION_PAINT} />
        </GeoJSONSource>
      ) : null}
      <GeoJSONSource id="driver-destination" data={destinationData}>
        <Layer id="driver-destination-dot" type="circle" paint={destinationPaint} />
      </GeoJSONSource>
    </>
  );
});
