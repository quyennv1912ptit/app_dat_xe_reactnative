import type { RideCoordinates } from '@datxe/shared';
import type { GoongMapSearchRadius, MapViewportInsets } from "@datxe/ui/goong-map";
export type BookingMapProps = {
  center: RideCoordinates;
  cameraVersion?: number;
  viewport?: MapViewportInsets;
  pickup?: { coordinate: RideCoordinates } | null;
  dropoff?: { coordinate: RideCoordinates } | null;
  driver?: RideCoordinates | null;
  vehicleType?: 'CAR' | 'MOTORCYCLE' | null;
  route?: RideCoordinates[];
  searchRadius?: GoongMapSearchRadius | null;
  interactive?: boolean;
  editablePin?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
  onMovingChange?: (moving: boolean) => void;
};
