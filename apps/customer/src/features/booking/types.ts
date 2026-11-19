import type { RideCoordinates } from '@datxe/shared';
export type BookingPlace = { id: string; name: string; address: string; coordinate: RideCoordinates; provider?: 'goong' | 'history' | 'popular'; secondaryAddress?: string | null };
export type PlaceSuggestion = Omit<BookingPlace, 'coordinate'> & { coordinate?: RideCoordinates | null };
export type PlaceSearchResult = { provider: 'goong'; limitedCoverage: boolean; places: PlaceSuggestion[] };
export type PlaceKind = 'pickup' | 'dropoff';
/** Địa điểm đã có tọa độ, kèm khoảng cách do backend đo từ vị trí tìm kiếm. */
export type CustomerPlace = BookingPlace & { distanceMeters?: number | null; useCount?: number | null };
export type NearbyPlace = BookingPlace & { distanceMeters: number };
export type NearbyPlacesResult = {
  provider: string;
  radiusMeters: number;
  withinRadius: boolean;
  places: NearbyPlace[];
};
export type ReportPlaceInput = {
  placeId?: string | null;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  reason: string;
};
export type BookingMapProps = {
  center: RideCoordinates;
  pickup?: BookingPlace | null;
  dropoff?: BookingPlace | null;
  route?: RideCoordinates[];
  interactive?: boolean;
  onCenterChange?: (point: RideCoordinates) => void;
  onReadyChange?: (ready: boolean) => void;
};
