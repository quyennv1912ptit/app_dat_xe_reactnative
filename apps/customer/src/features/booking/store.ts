import { create } from 'zustand';
import type { BookingPlace, PlaceKind } from './types';
type Draft = {
  pickup: BookingPlace | null;
  dropoff: BookingPlace | null;
  vehicleId: number | null;
  destinationHint: string;
  voucherCode: string;
  voucherId: number | null;
  pickupNote: string;
  setPickupNote: (note: string) => void;
  begin: (destinationHint?: string, voucherCode?: string, pickup?: BookingPlace | null, voucherId?: number | null) => void;
  setPlace: (kind: PlaceKind, place: BookingPlace) => void;
  setVehicle: (id: number) => void;
  setVoucher: (code: string, id?: number | null) => void;
  clear: () => void;
};
const empty = { pickup: null, dropoff: null, vehicleId: null, destinationHint: '', voucherCode: '', voucherId: null, pickupNote: '' };
export const useBookingDraft = create<Draft>(set => ({
  ...empty,
  setPickupNote: pickupNote => set({ pickupNote }),
  begin: (destinationHint = '', voucherCode = '', pickup = null, voucherId = null) => set({ ...empty, destinationHint, voucherCode, pickup, voucherId }),
  setPlace: (kind, place) => set({ [kind]: place }),
  setVehicle: vehicleId => set({ vehicleId }),
  setVoucher: (voucherCode, voucherId = null) => set({ voucherCode, voucherId }),
  clear: () => set(empty),
}));
