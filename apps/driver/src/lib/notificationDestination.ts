import { resolvePushDestination, type CustomerRideDetail, type PushEnvelope } from "@datxe/shared";
import { request } from "./api";
import { driverApi } from "./driverApi";

export const resolveDriverNotification = (event: PushEnvelope) => resolvePushDestination(event, "DRIVER", {
  ride: async (id) => {
    const ride = await driverApi.ride(id);
    if (!ride) throw new Error("Không tìm thấy chuyến.");
    return ride;
  },
  pendingOffer: () => request<{ rideId: number; expiresAt: number; serverTime?: number }>("/driver/offers/pending", { allowNull: true }),
  activeRide: () => request<CustomerRideDetail>("/driver/rides/active", { allowNull: true }),
});
