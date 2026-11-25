import type { RideCoordinates } from '@datxe/shared';
import type { MapBounds, MapViewportInsets } from './types';

export const DEFAULT_MAP_ZOOM = 16.5;
export const MAX_ROUTE_ZOOM = 18;
const ROUTE_BOUNDS_MARGIN = 0.0002;
const EARTH_RADIUS_METERS = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function goongStyleUrl(key?: string) {
  return key ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${encodeURIComponent(key)}` : undefined;
}

export function mapPadding(viewport?: MapViewportInsets) {
  return { top: (viewport?.top ?? 0) + 24, bottom: (viewport?.bottom ?? 0) + 24, left: 32, right: 32 };
}

export function mapBounds(points: readonly RideCoordinates[]): MapBounds | undefined {
  if (points.length < 2) return undefined;
  let [west, south, east, north] = [180, 90, -180, -90];
  for (const { lat, lng } of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [west - ROUTE_BOUNDS_MARGIN, south - ROUTE_BOUNDS_MARGIN, east + ROUTE_BOUNDS_MARGIN, north + ROUTE_BOUNDS_MARGIN];
}

export const lngLat = ({ lng, lat }: RideCoordinates): [number, number] => [lng, lat];

/** Computes a destination [lng, lat] at `distanceMeters` and `bearingDeg` from `center` on a spherical Earth. */
export function destinationPoint(
  center: RideCoordinates,
  distanceMeters: number,
  bearingDeg: number,
): [number, number] {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = bearingDeg * DEG_TO_RAD;
  const lat1 = center.lat * DEG_TO_RAD;
  const lng1 = center.lng * DEG_TO_RAD;
  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAd = Math.sin(angularDistance);
  const cosAd = Math.cos(angularDistance);
  const lat2 = Math.asin(sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(bearing));
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * sinAd * cosLat1,
      cosAd - sinLat1 * Math.sin(lat2),
    );
  return [lng2 * RAD_TO_DEG, lat2 * RAD_TO_DEG];
}

/** Builds a closed geodesic GeoJSON Polygon for a circle of `radiusMeters` around `center`. */
export function circlePolygon(
  center: RideCoordinates,
  radiusMeters: number,
  steps = 72,
) {
  const ring: [number, number][] = [];
  for (let i = 0; i < steps; i += 1) {
    ring.push(destinationPoint(center, radiusMeters, (i / steps) * 360));
  }
  ring.push(ring[0]);
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [ring] },
  };
}

/** Builds a geodesic radar sweep (sector polygon + leading arm line) at `angleDeg` matching `radiusMeters`. */
export function radarSweepGeoJSON(
  center: RideCoordinates,
  radiusMeters: number,
  angleDeg: number,
  sweepDeg = 75,
  steps = 18,
) {
  const origin = lngLat(center);
  const sectorRing: [number, number][] = [origin];
  const startDeg = angleDeg - sweepDeg;
  for (let i = 0; i <= steps; i += 1) {
    sectorRing.push(destinationPoint(center, radiusMeters, startDeg + (i / steps) * sweepDeg));
  }
  sectorRing.push(origin);
  const armEnd = sectorRing[sectorRing.length - 2];
  const sector = {
    type: 'Feature' as const,
    properties: { part: 'sector' as const },
    geometry: { type: 'Polygon' as const, coordinates: [sectorRing] },
  };
  const arm = {
    type: 'Feature' as const,
    properties: { part: 'arm' as const },
    geometry: { type: 'LineString' as const, coordinates: [origin, armEnd] },
  };
  return {
    type: 'FeatureCollection' as const,
    features: [sector, arm],
    sector,
    arm,
  };
}

/** Computes [west, south, east, north] bounds enclosing a circle of `radiusMeters` around `center`. */
export function circleBounds(center: RideCoordinates, radiusMeters: number): MapBounds {
  const [, north] = destinationPoint(center, radiusMeters, 0);
  const [east] = destinationPoint(center, radiusMeters, 90);
  const [, south] = destinationPoint(center, radiusMeters, 180);
  const [west] = destinationPoint(center, radiusMeters, 270);
  return [west, south, east, north];
}
