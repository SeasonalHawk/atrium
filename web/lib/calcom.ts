// PRD v5 Section 6, "Cal.com booking integration": reserves a real
// consultation slot and returns booking details. The API key and event
// slug are read from the environment, never hardcoded.
//
// Design note: the funnel presents a short list of suggested slots (see
// web/app/funnel/page.tsx) rather than embedding Cal.com's own iframe, to
// keep the visitor on-brand through the whole flow (PRD Section 8, Visual
// Style) — the app calls Cal.com's booking API directly once the visitor
// picks a slot and provides their name/email, instead of relying on a
// Cal.com-hosted widget and its webhook.
//
// Reads CALCOM_EVENT_SLUG directly from process.env (rather than through
// web/config/app.config.ts's module-level constant) so it's re-read on
// every call -- app.config.ts resolves its value once at import time,
// which would freeze stale env state under test.
const CALCOM_BOOKINGS_URL = "https://api.cal.com/v2/bookings";

export interface BookingResult {
  bookingId: string;
  scheduledAt: string;
}

export interface ReserveSlotInput {
  slotStart: string; // ISO 8601
  attendeeName: string;
  attendeeEmail: string;
}

interface FetchLike {
  (input: string, init?: RequestInit): Promise<Response>;
}

export async function reserveSlot(
  { slotStart, attendeeName, attendeeEmail }: ReserveSlotInput,
  fetchImpl: FetchLike = fetch,
): Promise<BookingResult> {
  const apiKey = process.env.CALCOM_API_KEY;
  if (!apiKey) {
    throw new Error("CALCOM_API_KEY must be set (see .env.example)");
  }
  const eventSlug = process.env.CALCOM_EVENT_SLUG;
  if (!eventSlug) {
    throw new Error("CALCOM_EVENT_SLUG must be set (see .env.example)");
  }

  const response = await fetchImpl(CALCOM_BOOKINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify({
      eventTypeSlug: eventSlug,
      start: slotStart,
      attendee: { name: attendeeName, email: attendeeEmail, timeZone: "UTC" },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cal.com booking failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const booking = data.data ?? data;
  return {
    bookingId: String(booking.uid ?? booking.id),
    scheduledAt: booking.start ?? slotStart,
  };
}
