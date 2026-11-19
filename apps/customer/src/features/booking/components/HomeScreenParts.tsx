import type { CustomerRideDetail, CustomerRideSummary, RideCoordinates } from "@datxe/shared";
import { getLocale, translate as i18nT } from "@datxe/shared";
import { isCoordinate, placeTitle } from "../bookingUtils";

export type RecentDestination = {
  address: string;
  title: string;
  coordinate: RideCoordinates | null;
};

export function getGreeting(hour: number): string {
  if (hour < 11) return i18nT("Chào buổi sáng");
  if (hour < 18) return i18nT("Chào buổi chiều");
  return i18nT("Chào buổi tối");
}

export function getRecentDestinations(rides: CustomerRideSummary[]): RecentDestination[] {
  const destinations = new Map<string, RecentDestination>();
  for (const ride of rides) {
    if (["CANCELLED", "NO_DRIVER_FOUND", "EXPIRED", "FAILED_SYSTEM"].includes(ride.status))
      continue;
    const address = ride.dropoffAddress?.trim();
    if (!address) continue;
    const key = address.toLocaleLowerCase(getLocale());
    if (destinations.has(key)) continue;
    const point =
      ride.dropoffLat != null && ride.dropoffLng != null
        ? { lat: ride.dropoffLat, lng: ride.dropoffLng }
        : null;
    destinations.set(key, {
      address,
      title: placeTitle(address),
      coordinate: point && isCoordinate(point) ? point : null,
    });
  }
  return [...destinations.values()].slice(0, 3);
}

export function getRideStatusLabel(
  status: CustomerRideDetail["status"],
): string {
  const labels: Record<CustomerRideDetail["status"], string> = {
    PENDING: "Đang chờ xử lý",
    SEARCHING: "Đang tìm tài xế",
    DRIVER_ASSIGNED: "Đã có tài xế",
    DRIVER_ARRIVING: "Tài xế đang tới điểm đón",
    DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
    VEHICLE_HANDOVER: "Đang bàn giao xe",
    IN_PROGRESS: "Chuyến đi đang diễn ra",
    ARRIVED_DESTINATION: "Đã đến điểm trả xe",
    VEHICLE_RETURNED: "Đang hoàn tất bàn giao",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy",
    FAILED_SYSTEM: "Không thể tìm tài xế do lỗi hệ thống",
    NO_DRIVER_FOUND: "Chưa tìm được tài xế",
    EXPIRED: "Yêu cầu đã hết hạn",
  };
  return labels[status];
}
