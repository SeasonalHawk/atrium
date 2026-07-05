// PRD v5 Section 6, "Consultation funnel and capture", acceptance criterion 2:
// receives the Cal.com booking webhook, writes the bookingId and scheduledAt
// onto the lead row, and fires the Resend customer confirmation + operator
// alert (web/lib/resend.ts). PRD Section 10 condition 5 covers a failed
// reservation: no lead is marked booked and the visitor is prompted to pick
// another slot.
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // TODO Phase 1: verify the Cal.com webhook signature, extract bookingId +
  // scheduledAt + leadId, update Supabase, call sendBookingConfirmation and
  // sendOperatorAlert from web/lib/resend.ts.
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
