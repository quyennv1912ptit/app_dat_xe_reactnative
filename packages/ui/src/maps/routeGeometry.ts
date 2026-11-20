import type { RideCoordinates } from '@datxe/shared';

const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_DEGREE_LAT = 110540;
const METERS_PER_DEGREE_LNG = 111320;
const VERTEX_MERGE_METERS = 0.5;

export type RouteProjection = {
  /** Điểm trên polyline gần vị trí hiện tại nhất. */
  coordinate: RideCoordinates;
  /** Chỉ số đoạn (segment) chứa điểm chiếu. */
  segmentIndex: number;
  /** Tỉ lệ 0..1 của điểm chiếu trên đoạn. */
  segmentRatio: number;
  /** Khoảng cách đã đi dọc theo polyline tính tới điểm chiếu (mét). */
  alongMeters: number;
  /** Khoảng cách lệch khỏi polyline (mét). */
  offsetMeters: number;
};

export function distanceMeters(a: RideCoordinates, b: RideCoordinates): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Khoảng cách nhanh (xấp xỉ equirectangular) dùng để lọc/so sánh trong nội suy. */
export function approximateDistanceMeters(a: RideCoordinates, b: RideCoordinates): number {
  const dx = (b.lng - a.lng) * METERS_PER_DEGREE_LNG * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const dy = (b.lat - a.lat) * METERS_PER_DEGREE_LAT;
  return Math.sqrt(dx * dx + dy * dy);
}

export function routeCumulativeMeters(coordinates: readonly RideCoordinates[]): number[] {
  const cumulative: number[] = [];
  if (coordinates.length === 0) return cumulative;
  cumulative.push(0);
  for (let index = 1; index < coordinates.length; index += 1) {
    cumulative.push(cumulative[index - 1] + distanceMeters(coordinates[index - 1], coordinates[index]));
  }
  return cumulative;
}

function projectOnSegment(from: RideCoordinates, to: RideCoordinates, point: RideCoordinates) {
  const metersPerLng = METERS_PER_DEGREE_LNG * Math.cos((point.lat * Math.PI) / 180);
  const ax = (from.lng - point.lng) * metersPerLng;
  const ay = (from.lat - point.lat) * METERS_PER_DEGREE_LAT;
  const dx = (to.lng - from.lng) * metersPerLng;
  const dy = (to.lat - from.lat) * METERS_PER_DEGREE_LAT;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / lengthSquared));
  return {
    coordinate: {
      lat: from.lat + (to.lat - from.lat) * ratio,
      lng: from.lng + (to.lng - from.lng) * ratio,
    },
    ratio,
  };
}

/**
 * Chiếu vị trí hiện tại lên polyline để biết tài xế đang ở đâu trên tuyến.
 * Khi `hintSegment` được truyền, chỉ quét quanh đoạn đó để chạy mượt mỗi frame.
 */
export function projectOnRoute(
  coordinates: readonly RideCoordinates[],
  cumulative: readonly number[],
  point: RideCoordinates,
  hintSegment?: number | null,
  windowSegments = 30,
): RouteProjection | null {
  if (coordinates.length === 0) return null;

  if (coordinates.length === 1 || cumulative.length < 2) {
    return {
      coordinate: coordinates[0],
      segmentIndex: 0,
      segmentRatio: 0,
      alongMeters: 0,
      offsetMeters: distanceMeters(coordinates[0], point),
    };
  }

  const lastSegment = coordinates.length - 2;
  const hasHint = typeof hintSegment === 'number' && Number.isFinite(hintSegment);
  const start = hasHint ? Math.max(0, Math.trunc(hintSegment) - 5) : 0;
  const end = hasHint ? Math.min(lastSegment, Math.trunc(hintSegment) + windowSegments) : lastSegment;

  let best: RouteProjection | null = null;
  for (let index = start; index <= end; index += 1) {
    const { coordinate, ratio } = projectOnSegment(coordinates[index], coordinates[index + 1], point);
    const offsetMeters = distanceMeters(coordinate, point);
    if (best && offsetMeters >= best.offsetMeters) continue;
    const segmentStart = cumulative[index] ?? 0;
    const segmentEnd = cumulative[index + 1] ?? segmentStart + distanceMeters(coordinates[index], coordinates[index + 1]);
    best = {
      coordinate,
      segmentIndex: index,
      segmentRatio: ratio,
      alongMeters: segmentStart + (segmentEnd - segmentStart) * ratio,
      offsetMeters,
    };
  }

  // Nếu chỉ quét quanh hint mà lệch tuyến quá xa (GPS nhảy hoặc vừa re-route), quét lại toàn tuyến.
  if (best && hasHint && best.offsetMeters > 60 && (start > 0 || end < lastSegment)) {
    return projectOnRoute(coordinates, cumulative, point);
  }

  return best;
}

/**
 * Tìm đoạn chứa khoảng cách `meters` dọc polyline.
 * `cumulative` tăng dần nên chỉ cần binary search: O(log n) mỗi frame.
 */
function locateDistance(cumulative: readonly number[], meters: number) {
  const lastSegment = cumulative.length - 2;
  const total = cumulative[cumulative.length - 1] ?? 0;
  const clamped = Math.min(Math.max(0, meters), total);
  let low = 0;
  let high = Math.max(0, lastSegment);
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if ((cumulative[middle] ?? 0) <= clamped) low = middle;
    else high = middle - 1;
  }
  const start = cumulative[low] ?? 0;
  const end = cumulative[low + 1] ?? start;
  return { index: low, ratio: end > start ? (clamped - start) / (end - start) : 0, clamped };
}

/**
 * Điểm nằm đúng trên polyline, cách điểm đầu `meters` dọc theo tuyến.
 * Dùng để nội suy chuyển động theo cung đường thay vì đường thẳng giữa hai fix GPS.
 */
export function pointAtDistance(
  coordinates: readonly RideCoordinates[],
  cumulative: readonly number[],
  meters: number,
): RideCoordinates | null {
  if (coordinates.length === 0) return null;
  return coordinateOnRoute(coordinates, cumulative, meters).coordinate;
}

function coordinateOnRoute(
  coordinates: readonly RideCoordinates[],
  cumulative: readonly number[],
  meters: number,
) {
  if (coordinates.length === 1 || cumulative.length < 2) {
    return { index: 0, coordinate: coordinates[0] };
  }
  const { index, ratio } = locateDistance(cumulative, meters);
  const from = coordinates[index];
  const to = coordinates[index + 1] ?? from;
  return {
    index,
    coordinate: {
      lat: from.lat + (to.lat - from.lat) * ratio,
      lng: from.lng + (to.lng - from.lng) * ratio,
    },
  };
}

/**
 * Cắt tuyến còn lại bắt đầu đúng tại vị trí hiện tại, tính theo khoảng cách dọc polyline.
 * Nhờ vậy phần đường đã đi biến mất ngay khi vị trí đổi, không chờ tới đỉnh kế tiếp,
 * và mỗi frame chỉ tốn một lần binary search thay vì chiếu lại toàn tuyến.
 */
export function trimRouteAtDistance(
  coordinates: readonly RideCoordinates[],
  cumulative: readonly number[],
  meters: number,
): RideCoordinates[] {
  if (coordinates.length === 0) return [];
  const { index, coordinate } = coordinateOnRoute(coordinates, cumulative, meters);
  const tail = coordinates.slice(index + 1);
  if (tail.length > 0 && distanceMeters(coordinate, tail[0]) < VERTEX_MERGE_METERS) {
    tail.shift();
  }
  return [coordinate, ...tail];
}
