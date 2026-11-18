import type { CustomerRideDetail, RideStatus } from "@datxe/shared";

export type CustomerHandoverPhase = "PICKUP" | "DROPOFF";
export type CustomerHandoverStop = "pickup" | "dropoff";
export type CustomerHandoverState =
  | "not_submitted"
  | "pending_confirmation"
  | "correction_requested"
  | "confirmed";

export type CustomerStatusBanner = {
  tone: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
};

export type CustomerHandoverEntry = {
  phase: CustomerHandoverPhase;
  stop: CustomerHandoverStop;
  state: CustomerHandoverState;
  report?: CustomerRideDetail["handoverReports"][number];
  revision: number;
  isPhaseActive: boolean;
  canReview: boolean;
  canConfirm: boolean;
  canRequestCorrection: boolean;
  statusText: string;
  detailText: string;
};

export type CustomerPrimaryAction =
  | {
      kind: "review_handover";
      phase: CustomerHandoverStop;
      revision: number;
      label: string;
    }
  | {
      kind: "view_completed";
      label: string;
    }
  | {
      kind: "go_home";
      label: string;
    };

export const TERMINAL_CUSTOMER_STATUSES = new Set<RideStatus>([
  "COMPLETED",
  "CANCELLED",
  "NO_DRIVER_FOUND",
  "EXPIRED",
  "FAILED_SYSTEM",
]);

export const SEARCHING_CUSTOMER_STATUSES = new Set<RideStatus>([
  "PENDING",
  "SEARCHING",
]);

export const CANCELLABLE_CUSTOMER_STATUSES = new Set<RideStatus>([
  "PENDING",
  "SEARCHING",
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
]);

export const rideStatusLabel: Record<string, string> = {
  PENDING: "Đang tiếp nhận yêu cầu",
  SEARCHING: "Đang tìm tài xế",
  DRIVER_ASSIGNED: "Tài xế đã nhận chuyến",
  DRIVER_ARRIVING: "Tài xế đang đến điểm đón",
  DRIVER_ARRIVED: "Tài xế đã đến điểm đón",
  VEHICLE_HANDOVER: "Đang bàn giao xe",
  IN_PROGRESS: "Chuyến đi đang diễn ra",
  ARRIVED_DESTINATION: "Đã đến điểm trả",
  VEHICLE_RETURNED: "Đang hoàn tất bàn giao xe",
  COMPLETED: "Chuyến đi hoàn thành",
  CANCELLED: "Chuyến đi đã hủy",
  FAILED_SYSTEM: "Không thể tìm tài xế lúc này",
  NO_DRIVER_FOUND: "Chưa tìm được tài xế",
  EXPIRED: "Yêu cầu đã hết hạn",
};

export const chatStatuses = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "VEHICLE_HANDOVER",
  "IN_PROGRESS",
  "ARRIVED_DESTINATION",
  "VEHICLE_RETURNED",
];

export function isTerminalCustomerRideStatus(status: RideStatus | string | null | undefined): boolean {
  return Boolean(status && TERMINAL_CUSTOMER_STATUSES.has(status as RideStatus));
}

export function getCustomerRideStatusLabel(
  rideOrStatus: Pick<CustomerRideDetail, "status" | "type"> | RideStatus | string | null | undefined,
): string {
  if (!rideOrStatus) return "Đang cập nhật trạng thái";
  if (typeof rideOrStatus === "string") {
    return rideStatusLabel[rideOrStatus] ?? "Đang cập nhật trạng thái";
  }
  if (rideOrStatus.type === "SCHEDULED" && rideOrStatus.status === "PENDING") {
    return "Đã đặt lịch, đang chờ đến giờ tìm tài xế";
  }
  return rideStatusLabel[rideOrStatus.status] ?? "Đang cập nhật trạng thái";
}

function buildHandoverEntry(
  ride: CustomerRideDetail,
  phase: CustomerHandoverPhase,
  synchronized: boolean,
): CustomerHandoverEntry {
  const stop: CustomerHandoverStop = phase === "PICKUP" ? "pickup" : "dropoff";
  const handoverName = phase === "PICKUP" ? "nhận xe" : "trả xe";
  const expectedStatus: RideStatus = phase === "PICKUP" ? "VEHICLE_HANDOVER" : "VEHICLE_RETURNED";
  const isPhaseActive = ride.status === expectedStatus;
  const report = ride.handoverReports?.find((entry) => entry.phase === phase);
  const revision = report?.revision ?? 1;

  if (!report) {
    return {
      phase,
      stop,
      state: "not_submitted",
      report: undefined,
      revision: 1,
      isPhaseActive,
      canReview: false,
      canConfirm: false,
      canRequestCorrection: false,
      statusText: `Tài xế chưa gửi biên bản ${handoverName}`,
      detailText:
        ride.status === "DRIVER_ARRIVED" || ride.status === "ARRIVED_DESTINATION"
          ? `Tài xế đang kiểm tra xe và lập biên bản ${handoverName}.`
          : isPhaseActive
            ? `Đang đồng bộ biên bản ${handoverName} từ máy chủ.`
            : `Chưa có biên bản ${handoverName}.`,
    };
  }

  if (report.confirmedByCustomer) {
    return {
      phase,
      stop,
      state: "confirmed",
      report,
      revision,
      isPhaseActive,
      canReview: false,
      canConfirm: false,
      canRequestCorrection: false,
      statusText: `Đã xác nhận biên bản ${handoverName} (Phiên bản ${revision})`,
      detailText: isPhaseActive
        ? phase === "PICKUP"
          ? "Chờ tài xế bắt đầu chuyến đi."
          : "Chờ tài xế bấm hoàn tất chuyến đi."
        : "Biên bản đã được xác nhận và lưu đối chiếu.",
    };
  }

  if (report.correctionReason) {
    return {
      phase,
      stop,
      state: "correction_requested",
      report,
      revision,
      isPhaseActive,
      canReview: false,
      canConfirm: false,
      canRequestCorrection: false,
      statusText: `Đã yêu cầu điều chỉnh biên bản ${handoverName} (Phiên bản ${revision})`,
      detailText: `Lý do: ${report.correctionReason}. Đang chờ tài xế gửi biên bản cập nhật.`,
    };
  }

  const canReview = isPhaseActive;
  return {
    phase,
    stop,
    state: "pending_confirmation",
    report,
    revision,
    isPhaseActive,
    canReview,
    canConfirm: synchronized && canReview,
    canRequestCorrection: synchronized && canReview,
    statusText: `Chờ bạn xác nhận biên bản ${handoverName} (Phiên bản ${revision})`,
    detailText: canReview
      ? `Kiểm tra số km đồng hồ và 4 ảnh hiện trạng trước khi xác nhận.`
      : `Biên bản đang ở trạng thái chờ đối chiếu.`,
  };
}

export function customerRidePresentation(
  ride: CustomerRideDetail | null | undefined,
  synchronized = true,
) {
  if (!ride) return null;
  const pickup = buildHandoverEntry(ride, "PICKUP", synchronized);
  const dropoff = buildHandoverEntry(ride, "DROPOFF", synchronized);
  const activeHandover =
    ride.status === "VEHICLE_HANDOVER"
      ? pickup
      : ride.status === "VEHICLE_RETURNED"
        ? dropoff
        : undefined;

  let headline = getCustomerRideStatusLabel(ride);
  let statusBanner: CustomerStatusBanner;
  let primaryAction: CustomerPrimaryAction | undefined;
  let secondaryHandoverView:
    | { phase: CustomerHandoverStop; revision: number; label: string }
    | undefined;

  if (!synchronized) {
    statusBanner = {
      tone: "error",
      title: "Mất đồng bộ với máy chủ",
      message: "Thông tin chuyến có thể chưa mới nhất. Vui lòng làm mới trạng thái trước khi thao tác.",
    };
  } else if (activeHandover) {
    const handoverName = activeHandover.stop === "pickup" ? "nhận xe" : "trả xe";
    if (activeHandover.state === "pending_confirmation") {
      headline = `Cần xác nhận biên bản ${handoverName}`;
      statusBanner = {
        tone: "warning",
        title: activeHandover.statusText,
        message: activeHandover.detailText,
      };
      primaryAction = {
        kind: "review_handover",
        phase: activeHandover.stop,
        revision: activeHandover.revision,
        label:
          activeHandover.stop === "pickup"
            ? "Xem và xác nhận nhận xe"
            : "Xem và xác nhận trả xe",
      };
    } else if (activeHandover.state === "correction_requested") {
      headline = `Chờ tài xế sửa biên bản ${handoverName}`;
      statusBanner = {
        tone: "warning",
        title: activeHandover.statusText,
        message: activeHandover.detailText,
      };
      secondaryHandoverView = {
        phase: activeHandover.stop,
        revision: activeHandover.revision,
        label: "Xem biên bản đã phản hồi",
      };
    } else if (activeHandover.state === "confirmed") {
      headline = `Đã xác nhận biên bản ${handoverName}`;
      statusBanner = {
        tone: "success",
        title: activeHandover.statusText,
        message: activeHandover.detailText,
      };
      secondaryHandoverView = {
        phase: activeHandover.stop,
        revision: activeHandover.revision,
        label: "Xem biên bản đã xác nhận",
      };
    } else {
      headline = getCustomerRideStatusLabel(ride);
      statusBanner = {
        tone: "info",
        title: activeHandover.statusText,
        message: activeHandover.detailText,
      };
    }
  } else if (ride.status === "COMPLETED") {
    statusBanner = {
      tone: "success",
      title: "Chuyến đi đã hoàn thành",
      message: "Bạn có thể xem tổng kết cước phí và đánh giá tài xế.",
    };
    primaryAction = { kind: "view_completed", label: "Xem tổng kết chuyến" };
  } else if (isTerminalCustomerRideStatus(ride.status)) {
    statusBanner = {
      tone: "error",
      title: headline,
      message: ride.cancelReason || "Chuyến đi đã kết thúc. Bạn có thể đặt chuyến mới từ trang chủ.",
    };
    primaryAction = { kind: "go_home", label: "Về trang chủ" };
  } else if (ride.status === "DRIVER_ARRIVED" || ride.status === "ARRIVED_DESTINATION") {
    const waitingDropoff = ride.status === "ARRIVED_DESTINATION";
    statusBanner = {
      tone: "info",
      title: headline,
      message: waitingDropoff
        ? "Tài xế đang lập biên bản hoàn trả xe. Bạn sẽ nhận được thông báo để xác nhận."
        : "Tài xế đang kiểm tra xe và lập biên bản nhận xe. Vui lòng đợi trong giây lát.",
    };
  } else if (ride.status === "IN_PROGRESS") {
    statusBanner = {
      tone: "info",
      title: headline,
      message: "Chuyến đi đang di chuyển về điểm đến. Bạn có thể theo dõi lộ trình trực tiếp.",
    };
  } else if (ride.status === "DRIVER_ARRIVING" || ride.status === "DRIVER_ASSIGNED") {
    statusBanner = {
      tone: "info",
      title: headline,
      message:
        ride.status === "DRIVER_ARRIVING"
          ? "Tài xế đang di chuyển đến điểm đón. Chuẩn bị sẵn xe và chìa khóa nhé."
          : "Tài xế đã nhận chuyến và chuẩn bị xuất phát đến điểm đón.",
    };
  } else {
    statusBanner = {
      tone: "info",
      title: headline,
      message: "Đang theo dõi trạng thái chuyến đi.",
    };
  }

  return {
    headline,
    statusBanner,
    primaryAction,
    secondaryHandoverView,
    handovers: { pickup, dropoff },
    approaching: ride.status === "DRIVER_ASSIGNED" || ride.status === "DRIVER_ARRIVING",
    ended: isTerminalCustomerRideStatus(ride.status),
    canCancel: synchronized && CANCELLABLE_CUSTOMER_STATUSES.has(ride.status),
    canChat: Boolean(ride.driverId && chatStatuses.includes(ride.status)),
  };
}

export type CustomerInspectionMode =
  | "unavailable"
  | "not_submitted"
  | "pending_confirmation"
  | "stale_revision"
  | "correction_requested"
  | "confirmed"
  | "read_only";

export function customerHandoverInspectionPresentation(
  ride: CustomerRideDetail | null | undefined,
  phase: CustomerHandoverPhase,
  acknowledgedRevision?: number,
  synchronized = true,
) {
  const handoverName = phase === "PICKUP" ? "nhận xe" : "trả xe";
  const screenTitle = phase === "PICKUP" ? "Biên bản nhận xe" : "Biên bản trả xe";

  if (!ride) {
    return {
      mode: "unavailable" as CustomerInspectionMode,
      screenTitle,
      handoverName,
      report: undefined,
      currentRevision: 1,
      isStaleRevision: false,
      canConfirm: false,
      canRequestCorrection: false,
      banner: {
        tone: "warning" as const,
        title: "Không tìm thấy ngữ cảnh chuyến đi",
        message: "Màn hình thiếu mã chuyến hợp lệ hoặc dữ liệu chưa sẵn sàng.",
      },
    };
  }

  const entry = buildHandoverEntry(ride, phase, synchronized);
  const currentRevision = entry.revision;
  const isStaleRevision = Boolean(
    entry.report && acknowledgedRevision != null && currentRevision !== acknowledgedRevision,
  );

  if (!entry.report) {
    return {
      mode: "not_submitted" as CustomerInspectionMode,
      screenTitle,
      handoverName,
      report: undefined,
      currentRevision,
      isStaleRevision: false,
      canConfirm: false,
      canRequestCorrection: false,
      banner: {
        tone: "info" as const,
        title: entry.statusText,
        message: entry.detailText,
      },
    };
  }

  if (entry.state === "confirmed") {
    return {
      mode: "confirmed" as CustomerInspectionMode,
      screenTitle,
      handoverName,
      report: entry.report,
      currentRevision,
      isStaleRevision: false,
      canConfirm: false,
      canRequestCorrection: false,
      banner: {
        tone: "success" as const,
        title: entry.statusText,
        message: entry.detailText,
      },
    };
  }

  if (entry.state === "correction_requested") {
    return {
      mode: "correction_requested" as CustomerInspectionMode,
      screenTitle,
      handoverName,
      report: entry.report,
      currentRevision,
      isStaleRevision: false,
      canConfirm: false,
      canRequestCorrection: false,
      banner: {
        tone: "warning" as const,
        title: entry.statusText,
        message: entry.detailText,
      },
    };
  }

  if (!entry.canReview) {
    return {
      mode: "read_only" as CustomerInspectionMode,
      screenTitle,
      handoverName,
      report: entry.report,
      currentRevision,
      isStaleRevision: false,
      canConfirm: false,
      canRequestCorrection: false,
      banner: {
        tone: "info" as const,
        title: `Biên bản ${handoverName} (Phiên bản ${currentRevision})`,
        message: `Chuyến đi hiện đang ở trạng thái "${getCustomerRideStatusLabel(ride)}", chỉ xem đối chiếu.`,
      },
    };
  }

  if (isStaleRevision) {
    return {
      mode: "stale_revision" as CustomerInspectionMode,
      screenTitle,
      handoverName,
      report: entry.report,
      currentRevision,
      isStaleRevision: true,
      canConfirm: false,
      canRequestCorrection: false,
      banner: {
        tone: "warning" as const,
        title: `Tài xế vừa gửi phiên bản ${currentRevision}`,
        message: `Biên bản bạn đang xem (phiên bản ${acknowledgedRevision}) đã cũ. Hãy xem nội dung phiên bản ${currentRevision} trước khi xác nhận hoặc phản hồi.`,
      },
    };
  }

  return {
    mode: "pending_confirmation" as CustomerInspectionMode,
    screenTitle,
    handoverName,
    report: entry.report,
    currentRevision,
    isStaleRevision: false,
    canConfirm: synchronized,
    canRequestCorrection: synchronized,
    banner: synchronized
      ? {
          tone: "info" as const,
          title: `Đang xem phiên bản ${currentRevision}`,
          message: "Đối chiếu số km, ghi chú và 4 ảnh thực tế trước khi bấm Xác nhận.",
        }
      : {
          tone: "error" as const,
          title: "Chưa đồng bộ được phiên bản mới nhất",
          message: "Hãy bấm Làm mới để đồng bộ dữ liệu trước khi xác nhận biên bản.",
        },
  };
}
