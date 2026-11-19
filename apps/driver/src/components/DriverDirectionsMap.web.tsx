import { env } from '@/config/env';
import type { MapDirections, RideCoordinates } from '@datxe/shared';
import { GoongMap, mapBounds, type MapViewportInsets } from '@datxe/ui/goong-map';

type Props = {
  destination: RideCoordinates;
  targetLabel?: string;
  directions?: MapDirections | null;
  viewport?: MapViewportInsets;
  onRefresh?: () => void;
};

export function DriverDirectionsMap({ destination, directions, viewport }: Props) {
  return (
    <GoongMap
      mapKey={env.goongMapKey}
      viewport={viewport}
      center={destination}
      bounds={mapBounds([destination, ...(directions?.coordinates ?? [])])}
      markers={[{ id: 'stop', coordinate: destination, kind: 'dropoff' }]}
      route={directions?.coordinates}
    />
  );
}
