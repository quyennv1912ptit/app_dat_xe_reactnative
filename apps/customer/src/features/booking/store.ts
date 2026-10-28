import { create } from 'zustand';
import type { BookingPlace, PlaceKind } from './types';
type Draft = {
  pickup: BookingPlace | null;
  dropoff: BookingPlace | null;
  vehicleId: number | null;
  destinationHint: string;
  voucherCode: string;
  begin: (destinationHint?: string, voucherCode?: string, pickup?: BookingPlace | null) => void;
  setPlace: (kind: PlaceKind, place: BookingPlace) => void;
  setVehicle: (id: number) => void;
  setVoucher: (code: string) => void;
  clear: () => void;
};
const empty = { pickup: null, dropoff: null, vehicleId: null, destinationHint: '', voucherCode: '' };
export const useBookingDraft = create<Draft>(set => ({
  ...empty,
  begin: (destinationHint = '', voucherCode = '', pickup = null) => set({ ...empty, destinationHint, voucherCode, pickup }),
  setPlace: (kind, place) => set({ [kind]: place }),
  setVehicle: vehicleId => set({ vehicleId }),
  setVoucher: voucherCode => set({ voucherCode }),
  clear: () => set(empty),
}));
