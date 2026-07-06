import { describe, expect, it } from "vitest";
import { suggestedSlots } from "./suggestedSlots";

describe("suggestedSlots", () => {
  it("returns the requested number of slots", () => {
    const slots = suggestedSlots(6, new Date("2026-08-03T12:00:00Z")); // a Monday
    expect(slots).toHaveLength(6);
  });

  it("skips weekends", () => {
    // Friday 2026-08-07 -> next slots should be Monday 2026-08-10, not Sat/Sun
    const slots = suggestedSlots(2, new Date("2026-08-07T12:00:00Z"));
    const days = slots.map((s) => new Date(s).getUTCDay());
    expect(days.every((d) => d !== 0 && d !== 6)).toBe(true);
  });

  it("starts from tomorrow, not today", () => {
    const now = new Date("2026-08-03T12:00:00Z");
    const slots = suggestedSlots(1, now);
    expect(new Date(slots[0]).getUTCDate()).toBe(4);
  });

  it("returns two slots per weekday at the configured hours", () => {
    const slots = suggestedSlots(2, new Date("2026-08-03T12:00:00Z"));
    const hours = slots.map((s) => new Date(s).getUTCHours());
    expect(hours).toEqual([15, 19]);
  });
});
