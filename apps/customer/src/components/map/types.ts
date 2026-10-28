import type { RideCoordinates } from '@datxe/shared';
export type BookingMapProps = {
  center: RideCoordinates;
  pickup?: { coordinate: RideCoordinates } | null;
  dropoff?: { coordinate: RideCoordinates } | null;
  driver?: RideCoordinates | null;
  route?: RideCoordinates[];
  interactive?: boolean;
  editablePin?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
  onMovingChange?: (moving: boolean) => void;
};
