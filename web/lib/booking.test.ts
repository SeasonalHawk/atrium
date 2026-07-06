import { describe, expect, it } from "vitest";
import { validateBookingRequest } from "./booking";

const VALID_BODY = {
  leadId: "lead-1",
  company: "Acme Co",
  attendeeName: "Jane Doe",
  attendeeEmail: "jane@acme.example",
  slotStart: "2026-08-01T10:00:00Z",
};

describe("validateBookingRequest", () => {
  it("returns the body when every required field is present", () => {
    expect(validateBookingRequest(VALID_BODY)).toEqual(VALID_BODY);
  });

  it("throws when the body isn't an object", () => {
    expect(() => validateBookingRequest(null)).toThrow(/JSON object/);
    expect(() => validateBookingRequest("nope")).toThrow(/JSON object/);
  });

  it.each(["leadId", "company", "attendeeName", "attendeeEmail", "slotStart"])(
    "throws when %s is missing",
    (field) => {
      const body = { ...VALID_BODY, [field]: undefined };
      expect(() => validateBookingRequest(body)).toThrow(new RegExp(field));
    },
  );

  it("throws when a field is present but empty", () => {
    expect(() => validateBookingRequest({ ...VALID_BODY, company: "" })).toThrow(/company/);
  });
});
