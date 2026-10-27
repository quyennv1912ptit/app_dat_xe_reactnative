import type { AuthProfile,CustomerRideDetail } from '@datxe/shared';
import { create } from 'zustand';
type SessionState = { user: AuthProfile | null; activeRide: CustomerRideDetail | null; setUser: (user: AuthProfile | null) => void; setActiveRide: (ride: CustomerRideDetail | null) => void; reset: () => void };
export const useSessionStore = create<SessionState>(set => ({ user: null, activeRide: null, setUser: user => set({user}), setActiveRide: activeRide => set({activeRide}), reset: () => set({user:null,activeRide:null}) }));
