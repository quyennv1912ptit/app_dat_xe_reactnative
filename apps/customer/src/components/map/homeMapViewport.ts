import type { RideCoordinates } from "@datxe/shared";

// The customer endpoint searches 5 km around this center. Leave room for
// privacy rounding and marker size at the edge of the search area.
const AREA_KM = 5.3;
const MAX_LATITUDE = 85.05112878;

export function homeMapBounds({ lat, lng }: RideCoordinates) {
  const latDelta = AREA_KM / 110.5;
  const lngDelta = AREA_KM / (111.32 * Math.cos(lat * Math.PI / 180));
  const sw: [number, number] = [Math.max(-180, lng - lngDelta), Math.max(-MAX_LATITUDE, lat - latDelta)];
  const ne: [number, number] = [Math.min(180, lng + lngDelta), Math.min(MAX_LATITUDE, lat + latDelta)];
  return { sw, ne };
}
