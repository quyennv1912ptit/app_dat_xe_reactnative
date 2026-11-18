import { env } from "@/config/env";
import { request } from "@/lib/api";
import { resetToRideScreen } from "@/lib/rideNavigation";
import { useCustomerRideCancellation } from "@/lib/useCustomerRideCancellation";
import { walletApi } from "@/lib/walletApi";
import {
  AuthApiError,
  createStompClient,
  parsePushData,
  positiveId,
  record,
  stompBrokerUrl,
  translate as i18nT,
  walletBalance,
} from "@datxe/shared";
import { localizedAlert } from "@datxe/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { createCustomerRide, getActiveCustomerRide, getCustomerRide, getRideEstimate } from "../api";
import { activeRideDestination, estimateRequest, money } from "../bookingUtils";
import { buildRestoredDraftFromRide } from "../findDriverRecovery";
import { useBookingDraft } from "../store";

export function useFindDriver() {
  const router = useRouter();
  const client = useQueryClient();
  const draft = useBookingDraft();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = Number(Array.isArray(params.rideId) ? params.rideId[0] : params.rideId);
  const query = useQuery({
    queryKey: ["customer", "findDriver", rideId],
    queryFn: () => (rideId ? getCustomerRide(rideId) : getActiveCustomerRide()),
    staleTime: 0,
    refetchInterval: (current) => {
      const ride = current.state.data;
      if (ride && !["PENDING", "SEARCHING"].includes(ride.status)) return false;
      return ride?.type === "SCHEDULED" && ride.status === "PENDING" ? 30000 : 4000;
    },
  });
  const ride = query.data;
  const error =
    query.error?.message ??
    (query.isSuccess && !ride ? i18nT("Không tìm thấy chuyến đang hoạt động trong tài khoản.") : "");
  const moved = useRef(false);
  const retryingRef = useRef(false);
  const [retrying, setRetrying] = useState(false);
  const refresh = query.refetch;
  const searchingRideId = ride && ["PENDING", "SEARCHING"].includes(ride.status) ? ride.id : undefined;

  useEffect(() => {
    moved.current = false;
  }, [rideId]);

  useEffect(() => {
    if (!searchingRideId) return;
    const socket = createStompClient(stompBrokerUrl(env.apiUrl), "CUSTOMER");
    const unsubscribe = socket.subscribe("/user/queue/trip", (message) => {
      const event = parsePushData({ payload: message.body });
      if (event && positiveId(record(event.payload).rideId) === searchingRideId) {
        void refresh({ cancelRefetch: false });
      }
    });
    const stopConnection = socket.onConnection((connected) => {
      if (connected) void refresh({ cancelRefetch: false });
    });
    socket.connect();
    return () => {
      unsubscribe();
      stopConnection();
      void socket.disconnect();
    };
  }, [searchingRideId, refresh]);

  const progress = useQuery({
    queryKey: ["customer", "searchProgress", searchingRideId],
    queryFn: ({ signal }) =>
      request<{ round: number; radiusKm: number; maxRadiusKm: number }>(
        `/customer/rides/${searchingRideId}/search-progress`,
        { signal, allowNull: true },
      ),
    enabled: ride?.status === "SEARCHING",
    refetchInterval: 2000,
    retry: false,
  });

  const cancellation = useCustomerRideCancellation(ride, refresh, { cancelSearchingImmediately: true });

  useEffect(() => {
    if (!ride || moved.current || cancellation.visible || cancellation.busy) return;
    if (
      [
        "DRIVER_ASSIGNED",
        "DRIVER_ARRIVING",
        "DRIVER_ARRIVED",
        "VEHICLE_HANDOVER",
        "IN_PROGRESS",
        "ARRIVED_DESTINATION",
        "VEHICLE_RETURNED",
      ].includes(ride.status)
    ) {
      moved.current = true;
      router.replace({ pathname: "/ride/tracking", params: { rideId: String(ride.id) } });
    }
  }, [ride, router, cancellation.visible, cancellation.busy]);

  const editAndRetry = () => {
    if (!ride || retryingRef.current) return;
    const restored = buildRestoredDraftFromRide(ride, draft.lastBookedDraft);
    if (!restored) {
      resetToRideScreen(router, "/ride/pickup");
      return;
    }
    draft.restoreBookedDraft(restored.snapshot);
    resetToRideScreen(router, "/ride/confirm");
  };

  const retrySearch = async () => {
    if (!ride || retryingRef.current) return;
    const restored = buildRestoredDraftFromRide(ride, draft.lastBookedDraft);
    if (!restored) {
      resetToRideScreen(router, "/ride/pickup");
      return;
    }
    retryingRef.current = true;
    setRetrying(true);
    try {
      const currentRide = await getActiveCustomerRide();
      if (currentRide) {
        client.setQueryData(["customer", "getActiveCustomerRide"], currentRide);
        resetToRideScreen(router, activeRideDestination(currentRide));
        return;
      }

      if (restored.scheduleExpired) {
        draft.restoreBookedDraft(restored.snapshot);
        localizedAlert(
          i18nT("Giờ hẹn trước đó đã qua"),
          i18nT("Vui lòng chọn lại thời gian đón hoặc đặt ngay trước khi tìm tài xế."),
        );
        resetToRideScreen(router, "/ride/confirm");
        return;
      }

      const { snapshot, previousPayableFare } = restored;
      const input = estimateRequest(
        snapshot.pickup,
        snapshot.dropoff,
        snapshot.vehicleId,
        snapshot.scheduledAt,
        snapshot.voucherCode,
        snapshot.voucherId ?? null,
        snapshot.paymentMethod,
      );
      const latest = await getRideEstimate(input);

      if (snapshot.paymentMethod === "WALLET") {
        const freshWallet = await walletApi.overview();
        const balance = walletBalance(freshWallet, "CUSTOMER");
        if (balance === undefined || balance < latest.payableFare) {
          draft.restoreBookedDraft(snapshot);
          localizedAlert(
            i18nT("Số dư ví không đủ"),
            i18nT("Vui lòng nạp thêm tiền hoặc đổi phương thức thanh toán trước khi đặt lại."),
          );
          resetToRideScreen(router, "/ride/confirm");
          return;
        }
      }

      if (latest.payableFare !== previousPayableFare) {
        draft.restoreBookedDraft({ ...snapshot, payableFare: latest.payableFare });
        localizedAlert(
          i18nT("Giá chuyến đã cập nhật"),
          i18nT("Tổng thanh toán hiện tại là {0}. Vui lòng kiểm tra trước khi đặt lại.", {
            0: money(latest.payableFare),
          }),
        );
        resetToRideScreen(router, "/ride/confirm");
        return;
      }

      const payload = {
        ...input,
        routeQuoteId: latest.route?.id,
        type: snapshot.scheduledAt ? ("SCHEDULED" as const) : ("INSTANT" as const),
        paymentMethod: snapshot.paymentMethod,
        note: snapshot.note || null,
        pickupNote: snapshot.pickupNote || null,
      };
      const idempotencyKey = `customer-retry-${ride.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newRide = await createCustomerRide(payload, idempotencyKey);
      draft.saveBookedDraft({ ...snapshot, payableFare: latest.payableFare });
      draft.clear();
      await client.invalidateQueries({ queryKey: ["customer"] });
      router.replace({ pathname: "/ride/find-driver", params: { rideId: String(newRide.id) } });
    } catch (cause) {
      if (cause instanceof AuthApiError && ["ACTIVE_RIDE_EXISTS", "CONFLICT"].includes(cause.code)) {
        const currentRide = await getActiveCustomerRide().catch(() => null);
        if (currentRide) {
          client.setQueryData(["customer", "getActiveCustomerRide"], currentRide);
          resetToRideScreen(router, activeRideDestination(currentRide));
          return;
        }
      }
      localizedAlert(
        i18nT("Chưa thể tìm lại tài xế"),
        cause instanceof Error ? cause.message : i18nT("Vui lòng thử lại."),
      );
    } finally {
      retryingRef.current = false;
      setRetrying(false);
    }
  };

  return {
    router,
    ride,
    error,
    cancellation,
    refresh,
    progress: progress.isError ? null : progress.data,
    retrying,
    retrySearch,
    editAndRetry,
  };
}
