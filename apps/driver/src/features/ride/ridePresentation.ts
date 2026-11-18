import type { CustomerRideDetail, RideStatus } from "@datxe/shared";

export type RideStop = "pickup" | "dropoff";
export type RideReport = CustomerRideDetail["handoverReports"][number];

export type RideAction =
  | { kind: "progress"; label: string; endpoint: string }
  | { kind: "inspection"; label: string; stop: RideStop };

export type StatusBanner = {
  tone: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
};

export type RouteMode = "to_pickup" | "at_pickup" | "to_dropoff" | "at_dropoff";

export type RideHandoverEntry = {
  stop: RideStop;
  report: RideReport | undefined;
  exists: boolean;
  confirmed: boolean;
  needsRevision: boolean;
  editable: boolean;
  canView: boolean;
};

export type InspectionMode =
  | "create"
  | "revise"
  | "waiting_customer"
  | "confirmed_view"
  | "unavailable";

const TERMINAL_STATUSES = new Set<RideStatus>([
  "COMPLETED",
  "CANCELLED",
  "NO_DRIVER_FOUND",
  "EXPIRED",
  "FAILED_SYSTEM",
]);

const stages = {
  DRIVER_ASSIGNED: {
    step: 1,
    title: "Chuẩn bị đón khách",
    routeMode: "to_pickup" as const,
    navigation: "pickup" as const,
    cancel: true,
    endpoint: "start-arriving",
    label: "Đi đón khách",
  },
  DRIVER_ARRIVING: {
    step: 1,
    title: "Đang đến điểm đón",
    routeMode: "to_pickup" as const,
    navigation: "pickup" as const,
    cancel: true,
    endpoint: "arrived",
    label: "Đã tới điểm đón",
  },
  DRIVER_ARRIVED: {
    step: 2,
    title: "Đã tới điểm đón",
    routeMode: "at_pickup" as const,
    stop: "pickup" as const,
    cancel: true,
  },
  VEHICLE_HANDOVER: {
    step: 2,
    title: "Nhận xe",
    routeMode: "at_pickup" as const,
    stop: "pickup" as const,
    cancel: true,
    endpoint: "start",
    label: "Bắt đầu chuyến đi",
  },
  IN_PROGRESS: {
    step: 3,
    title: "Đang đến điểm trả",
    routeMode: "to_dropoff" as const,
    navigation: "dropoff" as const,
    endpoint: "arrive-destination",
    label: "Đã tới điểm trả",
  },
  ARRIVED_DESTINATION: {
    step: 4,
    title: "Đã tới điểm trả",
    routeMode: "at_dropoff" as const,
    stop: "dropoff" as const,
  },
  VEHICLE_RETURNED: {
    step: 4,
    title: "Trả xe",
    routeMode: "at_dropoff" as const,
    stop: "dropoff" as const,
    endpoint: "complete",
    label: "Hoàn tất chuyến",
  },
} satisfies Partial<
  Record<
    RideStatus,
    {
      step: number;
      title: string;
      routeMode: RouteMode;
      navigation?: RideStop;
      stop?: RideStop;
      cancel?: boolean;
      endpoint?: string;
      label?: string;
    }
  >
>;

export function isTerminalRideStatus(status: RideStatus | string | null | undefined): boolean {
  return Boolean(status && TERMINAL_STATUSES.has(status as RideStatus));
}

export function formatRideVehicleSummary(ride: CustomerRideDetail | null | undefined): string {
  if (!ride) return "";
  const typeLabel =
    ride.vehicleType === "CAR"
      ? "Ô tô"
      : ride.vehicleType === "MOTORCYCLE"
        ? "Xe máy"
        : null;
  const brandModel = [ride.vehicleSnapshot?.brand, ride.vehicleSnapshot?.model]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ");
  const transmissionLabel =
    ride.transmission === "AUTO"
      ? "Số tự động"
      : ride.transmission === "MANUAL"
        ? "Số sàn"
        : null;
  return [
    typeLabel,
    brandModel || null,
    ride.vehicleSnapshot?.color?.trim() || null,
    transmissionLabel,
    ride.licensePlate?.trim() || null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function buildHandoverEntries(
  ride: CustomerRideDetail,
  synchronized: boolean,
  activeStop?: RideStop,
): RideHandoverEntry[] {
  const submitted = ride.status === "VEHICLE_HANDOVER" || ride.status === "VEHICLE_RETURNED";
  return (["pickup", "dropoff"] as const).map((stop) => {
    const report = ride.handoverReports?.find((entry) => entry.phase === stop.toUpperCase());
    const exists = Boolean(report);
    const confirmed = Boolean(report?.confirmedByCustomer);
    const needsRevision = Boolean(report?.correctionReason && !confirmed);
    const current = activeStop === stop;
    const editableInState = current && (submitted ? needsRevision : !exists);
    const editable = synchronized && editableInState;
    return {
      stop,
      report,
      exists,
      confirmed,
      needsRevision,
      editable,
      canView: exists && !editableInState,
    };
  });
}

export function ridePresentation(ride: CustomerRideDetail | null | undefined, synchronized = true) {
  if (!ride || !Object.hasOwn(stages, ride.status)) return null;
  const stage = stages[ride.status as keyof typeof stages];
  const activeStop = "stop" in stage ? stage.stop : undefined;
  const handovers = buildHandoverEntries(ride, synchronized, activeStop);
  const current = activeStop ? handovers.find((item) => item.stop === activeStop) : undefined;
  const handoverName = current?.stop === "dropoff" ? "trả xe" : "nhận xe";

  let action: RideAction | undefined;
  let notice: string | undefined;
  let disabledPrimaryReason: string | undefined;
  let waitingForCustomer = false;
  let statusBanner: StatusBanner;

  if (!synchronized) {
    notice = "Chưa đồng bộ được chuyến. Làm mới để tiếp tục.";
    disabledPrimaryReason = "Mất đồng bộ với máy chủ. Hãy làm mới trước khi thay đổi trạng thái chuyến.";
    statusBanner = {
      tone: "error",
      title: "Chưa đồng bộ được chuyến",
      message: "Dữ liệu đang tạm giữ ở phiên bản gần nhất. Bấm Làm mới trước khi thao tác.",
    };
  } else if (current?.editable) {
    action = {
      kind: "inspection",
      stop: current.stop,
      label: current.report ? `Sửa biên bản ${handoverName}` : `Lập biên bản ${handoverName}`,
    };
    statusBanner = current.needsRevision
      ? {
          tone: "warning",
          title: `Khách yêu cầu điều chỉnh biên bản ${handoverName}`,
          message: current.report?.correctionReason
            ? `Lý do: ${current.report.correctionReason}`
            : "Kiểm tra lại với khách và cập nhật bộ ảnh mới.",
        }
      : {
          tone: "info",
          title: current.stop === "pickup" ? "Đã tới điểm đón" : "Đã tới điểm trả",
          message:
            current.stop === "pickup"
              ? "Kiểm tra tình trạng xe, nhập số km đồng hồ và chụp đủ 4 góc ảnh nhận xe."
              : "Đối chiếu hiện trạng xe sau hành trình, nhập số km và chụp đủ 4 góc ảnh trả xe.",
        };
  } else if (current && "endpoint" in stage && !current.confirmed) {
    if (current.report) {
      waitingForCustomer = true;
      notice = `Chờ khách xác nhận biên bản ${handoverName}.`;
      disabledPrimaryReason =
        stage.endpoint === "start"
          ? "Chưa thể bắt đầu chuyến đi khi khách chưa xác nhận biên bản nhận xe."
          : "Chưa thể hoàn tất chuyến khi khách chưa xác nhận biên bản trả xe.";
      statusBanner = {
        tone: "warning",
        title: `Chờ khách xác nhận biên bản ${handoverName}`,
        message: "Khách hàng cần xem và xác nhận biên bản trên ứng dụng khách trước khi sang bước tiếp theo.",
      };
    } else {
      notice = `Chưa tải được biên bản ${handoverName}. Hãy làm mới.`;
      disabledPrimaryReason = `Cần đồng bộ lại biên bản ${handoverName} trước khi tiếp tục.`;
      statusBanner = {
        tone: "warning",
        title: `Chưa tải được biên bản ${handoverName}`,
        message: "Hãy làm mới trạng thái chuyến để kiểm tra biên bản đã gửi.",
      };
    }
  } else if ("endpoint" in stage) {
    action = { kind: "progress", label: stage.label, endpoint: stage.endpoint };
    if (ride.status === "DRIVER_ASSIGNED") {
      statusBanner = {
        tone: "info",
        title: "Sẵn sàng đón khách",
        message: "Kiểm tra điểm đón, ghi chú và phương tiện rồi bấm Đi đón khách khi xuất phát.",
      };
    } else if (ride.status === "DRIVER_ARRIVING") {
      statusBanner = {
        tone: "info",
        title: "Đang đến điểm đón",
        message: "Chỉ bấm Đã tới điểm đón khi bạn đã có mặt tại điểm hẹn cùng xe khách.",
      };
    } else if (ride.status === "VEHICLE_HANDOVER") {
      statusBanner = {
        tone: "success",
        title: "Khách đã xác nhận nhận xe",
        message: "Đã đủ điều kiện pháp lý và bàn giao. Bấm Bắt đầu chuyến đi để xuất phát.",
      };
    } else if (ride.status === "IN_PROGRESS") {
      statusBanner = {
        tone: "info",
        title: "Đang thực hiện chuyến đi",
        message: "Tập trung lái xe an toàn về điểm trả. Chỉ thao tác điện thoại khi đã dừng xe.",
      };
    } else {
      statusBanner = {
        tone: "success",
        title: "Khách đã xác nhận trả xe",
        message: "Bấm Hoàn tất chuyến để kết toán cước và đóng chuyến.",
      };
    }
  } else {
    statusBanner = {
      tone: "info",
      title: stage.title,
      message: "Theo dõi hướng dẫn ở bước hiện tại.",
    };
  }

  const navigation = synchronized && "navigation" in stage ? stage.navigation : undefined;

  return {
    title: stage.title,
    step: stage.step,
    routeMode: stage.routeMode,
    action,
    notice,
    statusBanner,
    disabledPrimaryReason,
    waitingForCustomer,
    canCancel: synchronized && "cancel" in stage,
    navigation,
    showMap: Boolean(navigation),
    vehicleSummary: formatRideVehicleSummary(ride),
    handovers,
  };
}

export function inspectionPresentation(
  ride: CustomerRideDetail | null | undefined,
  stop: RideStop,
  synchronized = true,
) {
  const handoverName = stop === "dropoff" ? "trả xe" : "nhận xe";
  const pageTitle = stop === "dropoff" ? "Biên bản trả xe" : "Biên bản nhận xe";

  if (!ride) {
    return {
      mode: "unavailable" as InspectionMode,
      title: pageTitle,
      canEditForm: false,
      canSubmit: false,
      showNavigation: false as const,
      report: undefined,
      nextRevision: 1,
      statusBanner: {
        tone: "warning" as const,
        title: "Không tìm thấy ngữ cảnh chuyến đi",
        message: "Màn hình thiếu mã chuyến hợp lệ hoặc chuyến đã đóng.",
      },
      fallbackRoute: "/(tabs)/home" as const,
      fallbackLabel: "Về trang chủ",
    };
  }

  const report = ride.handoverReports?.find((entry) => entry.phase === stop.toUpperCase());
  const isCreatePhase =
    !report &&
    ((stop === "pickup" && ride.status === "DRIVER_ARRIVED") ||
      (stop === "dropoff" && ride.status === "ARRIVED_DESTINATION"));
  const isRevisePhase =
    Boolean(report?.correctionReason && !report.confirmedByCustomer) &&
    ((stop === "pickup" && ride.status === "VEHICLE_HANDOVER") ||
      (stop === "dropoff" && ride.status === "VEHICLE_RETURNED"));

  if (isCreatePhase || isRevisePhase) {
    const nextRevision = report ? (report.revision ?? 1) + 1 : 1;
    return {
      mode: (isRevisePhase ? "revise" : "create") as InspectionMode,
      title: pageTitle,
      // Giữ nguyên form khi mất mạng tạm thời để tài xế không mất ODO, ghi chú và ảnh vừa chụp.
      canEditForm: true,
      canSubmit: synchronized,
      submitDisabledReason: synchronized
        ? undefined
        : "Đang mất kết nối. Bản nháp đã được giữ lại, hãy đồng bộ trước khi gửi.",
      showNavigation: false as const,
      report,
      nextRevision,
      statusBanner: synchronized
        ? isRevisePhase
          ? {
              tone: "warning" as const,
              title: "Khách yêu cầu điều chỉnh",
              message: report?.correctionReason || "Kiểm tra lại thông tin và chụp bộ ảnh mới.",
            }
          : {
              tone: "info" as const,
              title: `Lập biên bản ${handoverName}`,
              message: "Điền số km đồng hồ, ghi chú tình trạng xe và chụp đủ 4 góc bắt buộc.",
            }
        : {
            tone: "error" as const,
            title: "Mất kết nối máy chủ",
            message: "Dữ liệu bạn đang nhập vẫn được giữ. Bấm Đồng bộ lại khi có mạng để gửi.",
          },
      fallbackRoute: "/ride/in-progress" as const,
      fallbackLabel: "Về chuyến hiện tại",
    };
  }

  if (report) {
    if (report.confirmedByCustomer) {
      const canContinueOnTrip =
        (stop === "pickup" && ride.status === "VEHICLE_HANDOVER") ||
        (stop === "dropoff" && ride.status === "VEHICLE_RETURNED");
      return {
        mode: "confirmed_view" as InspectionMode,
        title: `Biên bản ${handoverName}`,
        canEditForm: false,
        canSubmit: false,
        showNavigation: false as const,
        report,
        nextRevision: report.revision ?? 1,
        statusBanner: {
          tone: "success" as const,
          title: `Khách đã xác nhận biên bản ${handoverName}`,
          message: canContinueOnTrip
            ? stop === "pickup"
              ? "Quay về màn chuyến đi để bấm Bắt đầu chuyến đi."
              : "Quay về màn chuyến đi để bấm Hoàn tất chuyến."
            : "Biên bản đã được khóa để đối chiếu.",
        },
        fallbackRoute: isTerminalRideStatus(ride.status) ? ("/ride/complete" as const) : ("/ride/in-progress" as const),
        fallbackLabel: canContinueOnTrip
          ? stop === "pickup"
            ? "Về màn để bắt đầu chuyến"
            : "Về màn để hoàn tất chuyến"
          : isTerminalRideStatus(ride.status)
            ? "Về chi tiết chuyến"
            : "Về chuyến hiện tại",
      };
    }

    return {
      mode: "waiting_customer" as InspectionMode,
      title: `Biên bản ${handoverName}`,
      canEditForm: false,
      canSubmit: false,
      showNavigation: false as const,
      report,
      nextRevision: report.revision ?? 1,
      statusBanner: {
        tone: "warning" as const,
        title: `Đang chờ khách xác nhận biên bản ${handoverName}`,
        message:
          "Khách hàng cần xác nhận trên ứng dụng khách trước khi bạn có thể chuyển sang bước tiếp theo.",
      },
      fallbackRoute: "/ride/in-progress" as const,
      fallbackLabel: "Về màn chuyến đi",
    };
  }

  let reason = "Chỉ lập biên bản sau khi đã báo tới điểm đón hoặc điểm trả.";
  if (stop === "pickup" && (ride.status === "DRIVER_ASSIGNED" || ride.status === "DRIVER_ARRIVING")) {
    reason = "Bạn chưa báo tới điểm đón. Hãy bấm Đã tới điểm đón trước khi lập biên bản nhận xe.";
  } else if (stop === "dropoff" && ride.status !== "ARRIVED_DESTINATION" && !isTerminalRideStatus(ride.status)) {
    reason = "Biên bản trả xe chỉ mở sau khi bạn xác nhận Đã tới điểm trả.";
  } else if (isTerminalRideStatus(ride.status)) {
    reason = "Chuyến đi đã kết thúc và không có biên bản này.";
  }

  return {
    mode: "unavailable" as InspectionMode,
    title: pageTitle,
    canEditForm: false,
    canSubmit: false,
    showNavigation: false as const,
    report: undefined,
    nextRevision: 1,
    statusBanner: {
      tone: "info" as const,
      title: `Biên bản ${handoverName} chưa khả dụng`,
      message: reason,
    },
    fallbackRoute: isTerminalRideStatus(ride.status) ? ("/ride/complete" as const) : ("/ride/in-progress" as const),
    fallbackLabel: isTerminalRideStatus(ride.status) ? "Xem chi tiết chuyến" : "Về chuyến hiện tại",
  };
}

export function completePresentation(ride: CustomerRideDetail | null | undefined) {
  if (!ride) return null;
  if (!isTerminalRideStatus(ride.status)) {
    return {
      terminal: false as const,
      title: "Chuyến đang thực hiện",
      notice: {
        tone: "warning" as const,
        title: "Chuyến đi chưa kết thúc",
        message: "Quay lại màn thực hiện chuyến để tiếp tục các bước bàn giao hoặc hoàn tất.",
      },
      canConfirmCash: false,
      cashToCollect: undefined,
      cashCollected: false,
      paymentBanner: null,
    };
  }

  const payment = ride.payment;
  const cashToCollect =
    ride.status === "COMPLETED" &&
    payment?.method === "CASH" &&
    payment.status === "PENDING" &&
    Number.isFinite(payment.amount) &&
    payment.amount > 0
      ? payment.amount
      : undefined;
  const canConfirmCash = cashToCollect !== undefined;
  const cashCollected = ride.status === "COMPLETED" && payment?.method === "CASH" && payment.status === "PAID";

  let paymentBanner: StatusBanner | null = null;
  if (ride.status === "COMPLETED") {
    if (!payment) {
      paymentBanner = {
        tone: "warning",
        title: "Chưa tải được thông tin thanh toán",
        message: "Hãy tải lại chuyến trước khi xác nhận thu tiền.",
      };
    } else if (payment.method === "CASH") {
      if (payment.status === "PAID") {
        paymentBanner = payment.amount === 0
          ? {
              tone: "success",
              title: "Khách được miễn phí (Voucher 0 đ)",
              message: "Không cần thu tiền mặt từ khách. Thu nhập chuyến đã được cộng vào ví.",
            }
          : {
              tone: "success",
              title: "Tiền mặt đã thu đủ",
              message: "Giao dịch tiền mặt cho chuyến này đã được xác nhận.",
            };
      } else if (payment.status === "PENDING") {
        paymentBanner = payment.amount === 0
          ? {
              tone: "warning",
              title: "Chờ hoàn tất thanh toán 0 đ",
              message: "Không cần thu tiền mặt từ khách. Hãy làm mới trạng thái chuyến.",
            }
          : {
              tone: "warning",
              title: "Chờ xác nhận thu tiền mặt",
              message: "Chỉ bấm xác nhận sau khi đã nhận đủ tiền mặt trực tiếp từ khách.",
            };
      } else if (payment.status === "FAILED") {
        paymentBanner = {
          tone: "error",
          title: "Thanh toán tiền mặt gặp lỗi",
          message: "Hãy làm mới trạng thái hoặc liên hệ hỗ trợ để kiểm tra.",
        };
      } else {
        paymentBanner = {
          tone: "info",
          title: "Giao dịch tiền mặt đã hoàn tất điều chỉnh",
          message: "Trạng thái thanh toán đã được hoàn/điều chỉnh trên hệ thống.",
        };
      }
    } else if (payment.method === "WALLET") {
      if (payment.status === "PAID") {
        paymentBanner = {
          tone: "success",
          title: "Đã thanh toán qua ví",
          message: "Tiền mặt cần thu trực tiếp: 0 đ.",
        };
      } else if (payment.status === "PENDING") {
        paymentBanner = {
          tone: "warning",
          title: "Đang xử lý thanh toán ví",
          message: "Hệ thống đang đồng bộ kết quả thanh toán qua ví. Vui lòng làm mới sau ít giây.",
        };
      } else if (payment.status === "FAILED") {
        paymentBanner = {
          tone: "error",
          title: "Thanh toán ví không thành công",
          message: "Làm mới để kiểm tra trạng thái mới nhất hoặc liên hệ hỗ trợ.",
        };
      } else {
        paymentBanner = {
          tone: "info",
          title: "Giao dịch ví đã được hoàn tiền",
          message: "Hệ thống ghi nhận thanh toán ví đã ở trạng thái hoàn tiền.",
        };
      }
    }
  }

  return {
    terminal: true as const,
    title: "Chi tiết chuyến",
    notice: null,
    canConfirmCash,
    cashToCollect,
    cashCollected,
    paymentBanner,
  };
}

export function homeRideCardPresentation(ride: CustomerRideDetail | null | undefined, synchronized = true) {
  const model = ridePresentation(ride, synchronized);
  if (!ride || !model) return null;
  const targetStop =
    model.routeMode === "to_dropoff" || model.routeMode === "at_dropoff" ? "dropoff" : "pickup";
  const targetLabel =
    model.routeMode === "to_pickup"
      ? "Đang đón tại"
      : model.routeMode === "at_pickup"
        ? "Đang bàn giao tại điểm đón"
        : model.routeMode === "to_dropoff"
          ? "Đang trả tại"
          : "Đang trả xe tại điểm đến";
  const address =
    (targetStop === "dropoff" ? ride.dropoffAddress : ride.pickupAddress) || "Chưa có địa chỉ";
  return {
    phaseTitle: model.title,
    targetLabel,
    address,
    hint: model.notice ?? model.action?.label,
    vehicleSummary: model.vehicleSummary,
  };
}
