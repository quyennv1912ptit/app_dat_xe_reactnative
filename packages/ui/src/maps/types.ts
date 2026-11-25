import type { RideCoordinates } from '@datxe/shared';

export type MapViewportInsets = { top: number; bottom: number };
export type MapBounds = [number, number, number, number];
export type GoongMapMarker = {
  id: string;
  coordinate: RideCoordinates;
  kind: 'nearby' | 'driver' | 'pickup' | 'dropoff';
  vehicleType?: 'CAR' | 'MOTORCYCLE' | null;
};
export type GoongMapSearchRadius = {
  center: RideCoordinates;
  radiusMeters: number;
  animate?: boolean;
};
export type GoongMapProps = {
  mapKey?: string;
  center: RideCoordinates;
  viewport?: MapViewportInsets;
  bounds?: MapBounds;
  cameraVersion?: number;
  markers?: GoongMapMarker[];
  currentLocation?: RideCoordinates | null;
  currentHeading?: number | null;
  route?: RideCoordinates[];
  searchRadius?: GoongMapSearchRadius | null;
  interactive?: boolean;
  editablePin?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
  onMovingChange?: (moving: boolean) => void;
};
