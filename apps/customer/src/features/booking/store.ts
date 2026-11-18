import { create } from 'zustand';
import type { BookingPlace, PlaceKind } from './types';
export type PaymentChoice = 'CASH' | 'WALLET';

export type BookedDraftSnapshot = {
  pickup: BookingPlace;
  dropoff: BookingPlace;
  vehicleId: number;
  voucherCode: string;
  voucherId?: number | null;
  note: string;
  pickupNote: string;
  scheduledAt: string | null;
  paymentMethod: PaymentChoice;
  payableFare?: number;
};

type Draft = {
  pickup: BookingPlace | null;
  dropoff: BookingPlace | null;
  vehicleId: number | null;
  destinationHint: string;
  voucherCode: string;
  voucherId: number | null;
  note: string;
  pickupNote: string;
  scheduledAt: string | null;
  scheduleRequested: boolean;
  clearScheduleRequest: () => void;
  paymentMethod: PaymentChoice | null;
  lastBookedDraft: BookedDraftSnapshot | null;
  setNote: (note: string) => void;
  setPickupNote: (note: string) => void;
  begin: (
    destinationHint?: string,
    voucherCode?: string,
    pickup?: BookingPlace | null,
    scheduleRequested?: boolean,
    voucherId?: number | null,
  ) => void;
  setPlace: (kind: PlaceKind, place: BookingPlace) => void;
  setVehicle: (id: number) => void;
  setVoucher: (code: string, voucherId?: number | null) => void;
  setScheduledAt: (slot: string | null) => void;
  setPaymentMethod: (method: PaymentChoice) => void;
  saveBookedDraft: (snapshot: BookedDraftSnapshot) => void;
  restoreBookedDraft: (snapshot: BookedDraftSnapshot) => void;
  clear: () => void;
};
const empty = { pickup: null, dropoff: null, vehicleId: null, destinationHint: '', voucherCode: '', voucherId: null as number | null, note: '', pickupNote: '', scheduledAt: null, scheduleRequested: false, paymentMethod: null };
export const useBookingDraft = create<Draft>(set => ({
  ...empty,
  lastBookedDraft: null,
  setNote: note => set({ note }),
  setPickupNote: pickupNote => set({ pickupNote }),
  begin: (destinationHint = '', voucherCode = '', pickup = null, scheduleRequested = false, voucherId = null) =>
    set({ ...empty, destinationHint, voucherCode, voucherId, pickup, scheduleRequested }),
  clearScheduleRequest: () => set({ scheduleRequested: false }),
  setPlace: (kind, place) => set({ [kind]: place }),
  setVehicle: vehicleId => set({ vehicleId }),
  setVoucher: (voucherCode, voucherId = null) => set({ voucherCode, voucherId }),
  setScheduledAt: scheduledAt => set({ scheduledAt }),
  setPaymentMethod: paymentMethod => set({ paymentMethod }),
  saveBookedDraft: lastBookedDraft => set({ lastBookedDraft }),
  restoreBookedDraft: snapshot => set({
    ...empty,
    pickup: snapshot.pickup,
    dropoff: snapshot.dropoff,
    vehicleId: snapshot.vehicleId,
    voucherCode: snapshot.voucherCode,
    voucherId: snapshot.voucherId ?? null,
    note: snapshot.note,
    pickupNote: snapshot.pickupNote,
    scheduledAt: snapshot.scheduledAt,
    scheduleRequested: Boolean(snapshot.scheduledAt),
    paymentMethod: snapshot.paymentMethod,
  }),
  clear: () => set(state => ({ ...empty, lastBookedDraft: state.lastBookedDraft })),
}));
