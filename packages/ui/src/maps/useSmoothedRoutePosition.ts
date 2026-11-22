import type { RideCoordinates } from '@datxe/shared';
import { useEffect, useRef, useState } from 'react';
import { approximateDistanceMeters, pointAtDistance, projectOnRoute } from './routeGeometry';

/** Giới hạn tần suất vẽ lại (~25 fps) để không nghẽn bridge của MapLibre. */
const PAINT_INTERVAL_MS = 40;
/** Vị trí nhảy quá xa (mất tín hiệu / đổi nguồn) thì đặt lại ngay thay vì trượt dài. */
const MAX_INTERPOLATION_METERS = 150;
/** Lùi dọc tuyến ít hơn ngưỡng này coi là nhiễu GPS, không cho chấm trượt ngược. */
const BACKWARD_TOLERANCE_METERS = 15;
/** Lệch khỏi tim đường quá ngưỡng này thì vẽ vị trí thật thay vì bám tuyến. */
const DEFAULT_SNAP_OFFSET_METERS = 25;

const EMPTY: SmoothedRoutePosition = { position: null, alongMeters: null };

export type SmoothedRoutePosition = {
  /** Toạ độ để vẽ chấm: bám tim đường khi ở gần tuyến, vị trí thật khi lệch xa. */
  position: RideCoordinates | null;
  /** Khoảng cách dọc tuyến đang vẽ, dùng để cắt phần đường đã đi. */
  alongMeters: number | null;
};

type Options = {
  /** Thời gian nội suy giữa hai lần cập nhật vị trí; 0 = bám ngay vị trí thô. */
  durationMs: number;
  enabled?: boolean;
  /** Ngưỡng lệch khỏi tim đường còn được phép bám tuyến (mét). */
  snapOffsetMeters?: number;
};

type Animation = {
  /** `route`: chạy men theo polyline; `line`: nối thẳng hai toạ độ thô khi lệch tuyến. */
  mode: 'route' | 'line';
  from: RideCoordinates | null;
  to: RideCoordinates;
  fromMeters: number;
  toMeters: number;
  startedAt: number;
  duration: number;
};

function lerpCoordinate(from: RideCoordinates | null, to: RideCoordinates, ratio: number): RideCoordinates {
  if (!from || ratio >= 1) return to;
  return {
    lat: from.lat + (to.lat - from.lat) * ratio,
    lng: from.lng + (to.lng - from.lng) * ratio,
  };
}

/**
 * Nội suy vị trí giữa hai lần cập nhật (GPS hoặc WebSocket) **theo chiều dài cung**
 * của tuyến, nhờ vậy chấm chạy men theo đường cong thay vì cắt góc như nội suy
 * đường thẳng. Khi lệch tim đường trong ngưỡng `snapOffsetMeters`, chấm được kéo
 * về đúng polyline (snap-to-route); lệch xa hơn thì vẽ đúng vị trí thật.
 *
 * `cumulative` phải được memo hoá theo `coordinates` (ví dụ `routeCumulativeMeters`).
 */
export function useSmoothedRoutePosition(
  target: RideCoordinates | null,
  coordinates: readonly RideCoordinates[],
  cumulative: readonly number[],
  { durationMs, enabled = true, snapOffsetMeters = DEFAULT_SNAP_OFFSET_METERS }: Options,
): SmoothedRoutePosition {
  const [painted, setPainted] = useState<SmoothedRoutePosition>(EMPTY);
  const paintedRef = useRef<RideCoordinates | null>(null);
  const alongRef = useRef<number | null>(null);
  const routeRef = useRef({ coordinates, cumulative });
  const animationRef = useRef<Animation | null>(null);
  const frameRef = useRef<number | null>(null);
  const paintedAtRef = useRef(0);
  const duration = enabled ? Math.max(0, durationMs) : 0;

  useEffect(() => {
    const routeChanged = routeRef.current.coordinates !== coordinates;
    routeRef.current = { coordinates, cumulative };

    if (!target) {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      animationRef.current = null;
      paintedRef.current = null;
      alongRef.current = null;
      return;
    }

    const hasRoute = coordinates.length > 1 && cumulative.length === coordinates.length;
    const projection = hasRoute ? projectOnRoute(coordinates, cumulative, target) : null;
    const onRoute = Boolean(projection && projection.offsetMeters <= snapOffsetMeters);
    const targetMeters = projection?.alongMeters ?? 0;
    const previous = paintedRef.current;

    // Tuyến mới (re-route/refetch) thì quy điểm đang vẽ về hệ khoảng cách của tuyến mới
    // để chấm không nhảy khi dữ liệu tuyến đổi.
    let fromMeters = alongRef.current ?? targetMeters;
    if (routeChanged && previous && hasRoute) {
      fromMeters = projectOnRoute(coordinates, cumulative, previous)?.alongMeters ?? targetMeters;
    }

    const jump = onRoute
      ? Math.abs(targetMeters - fromMeters)
      : previous
        ? approximateDistanceMeters(previous, target)
        : 0;
    const negligible = jump < 0.25;
    const snap = duration <= 0 || !previous || negligible || jump > MAX_INTERPOLATION_METERS;
    // Nhiễu GPS làm điểm chiếu lùi vài mét: giữ nguyên thay vì cho chấm giật ngược.
    const toMeters =
      onRoute && targetMeters < fromMeters && fromMeters - targetMeters < BACKWARD_TOLERANCE_METERS
        ? fromMeters
        : targetMeters;

    animationRef.current = {
      mode: onRoute ? 'route' : 'line',
      from: previous ?? target,
      to: target,
      fromMeters,
      toMeters,
      startedAt: Date.now(),
      duration: snap ? 0 : duration,
    };
    if (frameRef.current != null) return;

    const tick = () => {
      const animation = animationRef.current;
      if (!animation) {
        frameRef.current = null;
        return;
      }
      const now = Date.now();
      const ratio =
        animation.duration <= 0 ? 1 : Math.min(1, (now - animation.startedAt) / animation.duration);
      if (ratio >= 1 || now - paintedAtRef.current >= PAINT_INTERVAL_MS) {
        paintedAtRef.current = now;
        const route = routeRef.current;
        const meters = animation.fromMeters + (animation.toMeters - animation.fromMeters) * ratio;
        const next =
          animation.mode === 'route'
            ? pointAtDistance(route.coordinates, route.cumulative, meters)
            : lerpCoordinate(animation.from, animation.to, ratio);
        const along = animation.mode === 'route' ? meters : animation.toMeters;
        paintedRef.current = next;
        alongRef.current = along;
        setPainted({ position: next, alongMeters: along });
      }
      if (ratio < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [coordinates, cumulative, duration, snapOffsetMeters, target]);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return target ? painted : EMPTY;
}
