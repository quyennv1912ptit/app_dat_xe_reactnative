import type { RideCoordinates } from '@datxe/shared';
export type BookingMapProps = {
  center: RideCoordinates;
  pickup?: { coordinate: RideCoordinates } | null;
  dropoff?: { coordinate: RideCoordinates } | null;
  driver?: RideCoordinates | null;
  route?: RideCoordinates[];
  interactive?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
};
