// PRD v5 Section 6, "Consultation funnel and capture", acceptance criterion 2:
// validates the /api/booking request body. Kept separate from the route so
// it's independently unit-testable without a Request/Response mock.
export interface BookingRequestBody {
  leadId: string;
  company: string;
  attendeeName: string;
  attendeeEmail: string;
  slotStart: string;
}

const REQUIRED_FIELDS: (keyof BookingRequestBody)[] = ["leadId", "company", "attendeeName", "attendeeEmail", "slotStart"];

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
    company: record.company as string,
    attendeeName: record.attendeeName as string,
    attendeeEmail: record.attendeeEmail as string,
    slotStart: record.slotStart as string,
  };
}
