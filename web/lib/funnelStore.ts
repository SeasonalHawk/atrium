// PRD v5 Section 9, Data Flow: per-step answers held in a small Zustand
// store so the funnel's step components stay simple and any step can read
// the accumulated payload without prop-drilling.
import { create } from "zustand";
import type { ElicitationPayload } from "@atrium/shared/elicitation";

export interface FunnelState {
  payload: ElicitationPayload;
  leadId: string | null;
  bookingConfirmed: boolean;
  answer: (key: string, value: string) => void;
  setLeadId: (id: string) => void;
  setBookingConfirmed: () => void;
  reset: () => void;
}

export const useFunnelStore = create<FunnelState>((set) => ({
  payload: {},
  leadId: null,
  bookingConfirmed: false,
  answer: (key, value) => set((state) => ({ payload: { ...state.payload, [key]: value } })),
  setLeadId: (id) => set({ leadId: id }),
  setBookingConfirmed: () => set({ bookingConfirmed: true }),
  reset: () => set({ payload: {}, leadId: null, bookingConfirmed: false }),
}));
