import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reserveSlot } from "./calcom";

describe("reserveSlot", () => {
  beforeEach(() => {
    vi.stubEnv("CALCOM_API_KEY", "fake-key");
    vi.stubEnv("CALCOM_EVENT_SLUG", "consultation");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when CALCOM_API_KEY is missing", async () => {
    vi.stubEnv("CALCOM_API_KEY", "");
    await expect(
      reserveSlot({ slotStart: "2026-08-01T10:00:00Z", attendeeName: "Jane", attendeeEmail: "jane@acme.example" }),
    ).rejects.toThrow(/CALCOM_API_KEY/);
  });

  it("throws when CALCOM_EVENT_SLUG is missing", async () => {
    vi.stubEnv("CALCOM_EVENT_SLUG", "");
    await expect(
      reserveSlot({ slotStart: "2026-08-01T10:00:00Z", attendeeName: "Jane", attendeeEmail: "jane@acme.example" }),
    ).rejects.toThrow(/CALCOM_EVENT_SLUG/);
  });

  it("posts to Cal.com's bookings endpoint and returns the confirmed booking", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { uid: "booking-123", start: "2026-08-01T10:00:00Z" } }),
    });

    const result = await reserveSlot(
      { slotStart: "2026-08-01T10:00:00Z", attendeeName: "Jane", attendeeEmail: "jane@acme.example" },
      fetchImpl,
    );

    expect(result).toEqual({ bookingId: "booking-123", scheduledAt: "2026-08-01T10:00:00Z" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.cal.com/v2/bookings",
      expect.objectContaining({ method: "POST" }),
    );
    const call = fetchImpl.mock.calls[0][1];
    expect(call.headers.Authorization).toBe("Bearer fake-key");
    const body = JSON.parse(call.body);
    expect(body.eventTypeSlug).toBe("consultation");
    expect(body.attendee).toEqual({ name: "Jane", email: "jane@acme.example", timeZone: "UTC" });
  });

  it("throws a clear error when Cal.com returns a non-2xx response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => "slot no longer available",
    });

    await expect(
      reserveSlot(
        { slotStart: "2026-08-01T10:00:00Z", attendeeName: "Jane", attendeeEmail: "jane@acme.example" },
        fetchImpl,
      ),
    ).rejects.toThrow(/409/);
  });
});
