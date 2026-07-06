import { describe, expect, it } from "vitest";
import { AlreadyBookedError, LeadNotFoundError, assertLeadIsBookable, validateBookingRequest } from "./booking";

const VALID_BODY = {
  leadId: "lead-1",
  attendeeName: "Jane Doe",
  attendeeEmail: "jane@acme.example",
  slotStart: "2026-08-01T10:00:00Z",
};

describe("validateBookingRequest", () => {
  it("returns the body when every required field is present", () => {
    expect(validateBookingRequest(VALID_BODY)).toEqual(VALID_BODY);
  });

  it("ignores extra fields such as a client-supplied company name", () => {
    // The route derives company from Supabase by leadId, never from the
    // request body -- a stray `company` field must not be trusted or
    // silently passed through.
    const result = validateBookingRequest({ ...VALID_BODY, company: "Spoofed Co" });
    expect(result).not.toHaveProperty("company");
  });

  it("throws when the body isn't an object", () => {
    expect(() => validateBookingRequest(null)).toThrow(/JSON object/);
    expect(() => validateBookingRequest("nope")).toThrow(/JSON object/);
  });

  it.each(["leadId", "attendeeName", "attendeeEmail", "slotStart"])("throws when %s is missing", (field) => {
    const body = { ...VALID_BODY, [field]: undefined };
    expect(() => validateBookingRequest(body)).toThrow(new RegExp(field));
  });

  it("throws when a field is present but empty", () => {
    expect(() => validateBookingRequest({ ...VALID_BODY, attendeeName: "" })).toThrow(/attendeeName/);
  });
});

describe("assertLeadIsBookable", () => {
  it("does not throw for a lead with no existing booking", () => {
    expect(() => assertLeadIsBookable({ company: "Acme Co", bookingId: null })).not.toThrow();
    expect(() => assertLeadIsBookable({ company: "Acme Co" })).not.toThrow();
  });

  it("throws LeadNotFoundError when the leadId doesn't match any row (IDOR guard)", () => {
    // A caller passing a made-up or someone-else's leadId that doesn't
    // resolve to a real row must be rejected before any write.
    expect(() => assertLeadIsBookable(null)).toThrow(LeadNotFoundError);
  });

  it("throws AlreadyBookedError when the lead already has a bookingId", () => {
    // Prevents overwriting an already-confirmed booking by replaying the
    // same leadId with a different slot/attendee.
    expect(() => assertLeadIsBookable({ company: "Acme Co", bookingId: "existing-booking" })).toThrow(
      AlreadyBookedError,
    );
  });
});
