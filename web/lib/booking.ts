// PRD v5 Section 6, "Consultation funnel and capture", acceptance criterion 2:
// validates the /api/booking request body. Kept separate from the route so
// it's independently unit-testable without a Request/Response mock.
//
// Deliberately has no `company` field: the route looks the lead's company
// up from Supabase by leadId instead of trusting a client-supplied value,
// so a caller can't spoof the operator alert's content by pairing a real
// leadId with an arbitrary company name (see the route's security notes).
export interface BookingRequestBody {
  leadId: string;
  attendeeName: string;
  attendeeEmail: string;
  slotStart: string;
}

const REQUIRED_FIELDS: (keyof BookingRequestBody)[] = ["leadId", "attendeeName", "attendeeEmail", "slotStart"];

export function validateBookingRequest(body: unknown): BookingRequestBody {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }
  const record = body as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (typeof record[field] !== "string" || !record[field]) {
      throw new Error(`${field} is required`);
    }
  }

  return {
    leadId: record.leadId as string,
    attendeeName: record.attendeeName as string,
    attendeeEmail: record.attendeeEmail as string,
    slotStart: record.slotStart as string,
  };
}

// Guards against IDOR on /api/booking: this is a public, unauthenticated
// endpoint (PRD Non-Goal 1, no accounts in v1), so leadId is only ever
// treated as a single-use bearer reference to a lead that /api/lead
// already created -- never as a value that grants write access to an
// arbitrary or already-completed row.
export type BookableLeadCheck = { company: string; bookingId?: string | null } | null;

export class LeadNotFoundError extends Error {}
export class AlreadyBookedError extends Error {}

export function assertLeadIsBookable(lead: BookableLeadCheck): asserts lead is { company: string; bookingId?: string | null } {
  if (!lead) {
    throw new LeadNotFoundError("We couldn't find your submission -- please start over.");
  }
  if (lead.bookingId) {
    throw new AlreadyBookedError("This consultation is already booked.");
  }
}
