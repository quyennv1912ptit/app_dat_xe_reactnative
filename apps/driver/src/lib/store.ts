import type { AuthProfile, CustomerRideDetail } from '@datxe/shared';
import { create } from 'zustand';

export type OnlineVehicleType = 'CAR' | 'MOTORCYCLE';

type SessionState = {
  user: AuthProfile | null;
  activeRide: CustomerRideDetail | null;
  onlineVehicleType: OnlineVehicleType | null;
  setUser: (user: AuthProfile | null) => void;
  setActiveRide: (ride: CustomerRideDetail | null) => void;
  setOnlineVehicleType: (vehicleType: OnlineVehicleType | null) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>(set => ({
  user: null,
  activeRide: null,
  onlineVehicleType: null,
  setUser: user => set(() => ({
    user,
    onlineVehicleType:
      user && (user.status === 'ONLINE' || user.status === 'BUSY')
        ? (user.onlineVehicleType ?? null)
        : null,
  })),
  setActiveRide: activeRide => set({ activeRide }),
  setOnlineVehicleType: onlineVehicleType => set({ onlineVehicleType }),
  reset: () => set({ user: null, activeRide: null, onlineVehicleType: null }),
}));
