import { beforeEach, describe, expect, it } from "vitest";
import { useFunnelStore } from "./funnelStore";

beforeEach(() => {
  useFunnelStore.getState().reset();
});

describe("useFunnelStore", () => {
  it("starts with an empty payload and no lead", () => {
    const state = useFunnelStore.getState();
    expect(state.payload).toEqual({});
    expect(state.leadId).toBeNull();
    expect(state.bookingConfirmed).toBe(false);
  });

  it("answer() accumulates payload keys without dropping earlier answers", () => {
    useFunnelStore.getState().answer("company", "Acme Co");
    useFunnelStore.getState().answer("challenge", "AI strategy");

    expect(useFunnelStore.getState().payload).toEqual({ company: "Acme Co", challenge: "AI strategy" });
  });

  it("answer() overwrites an existing key", () => {
    useFunnelStore.getState().answer("company", "Acme Co");
    useFunnelStore.getState().answer("company", "Beta Inc");

    expect(useFunnelStore.getState().payload.company).toBe("Beta Inc");
  });

  it("setLeadId() records the created lead id", () => {
    useFunnelStore.getState().setLeadId("lead-123");
    expect(useFunnelStore.getState().leadId).toBe("lead-123");
  });

  it("setBookingConfirmed() flips the confirmation flag", () => {
    useFunnelStore.getState().setBookingConfirmed();
    expect(useFunnelStore.getState().bookingConfirmed).toBe(true);
  });

  it("reset() clears everything", () => {
    useFunnelStore.getState().answer("company", "Acme Co");
    useFunnelStore.getState().setLeadId("lead-123");
    useFunnelStore.getState().setBookingConfirmed();

    useFunnelStore.getState().reset();

    expect(useFunnelStore.getState()).toMatchObject({ payload: {}, leadId: null, bookingConfirmed: false });
  });
});
