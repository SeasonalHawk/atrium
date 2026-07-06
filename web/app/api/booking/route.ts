// PRD v5 Section 6, "Consultation funnel and capture", acceptance criterion 2:
// reserves the picked Cal.com slot, writes the bookingId and scheduledAt
// onto the lead row, and fires the Resend customer confirmation + operator
// alert (web/lib/resend.ts). PRD Section 10 condition 5: if the reservation
// fails, no lead is marked booked and the caller can prompt the visitor to
// pick another slot.
//
// Security notes:
// - The lead row is fetched by leadId before any write, and its `company`
//   (never the client-supplied one) is what goes into the operator alert --
//   a caller can't spoof the alert's content by passing an arbitrary
//   `company` value alongside a real leadId.
// - A lead that doesn't exist, or that already has a bookingId, is
//   rejected before any Cal.com call or Supabase write -- this is a
//   public, unauthenticated endpoint (PRD Non-Goal 1: no accounts/auth in
//   v1), so leadId acts as a single-use bearer reference rather than a
//   value trusted to grant arbitrary write access to any row.
// - Error responses are generic; the real cause (Supabase/Cal.com detail)
//   is logged server-side only, never echoed back to the caller.
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@atrium/shared/supabase";
import { appConfig } from "@/config/app.config";
import { AlreadyBookedError, LeadNotFoundError, assertLeadIsBookable, validateBookingRequest } from "@/lib/booking";
import { reserveSlot } from "@/lib/calcom";
import { sendBookingConfirmation, sendOperatorAlert } from "@/lib/resend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  let leadId: string;
  let attendeeName: string;
  let attendeeEmail: string;
  let slotStart: string;
  try {
    ({ leadId, attendeeName, attendeeEmail, slotStart } = validateBookingRequest(body));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid booking request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data: lead, error: fetchError } = await client
    .from("leads")
    .select("id, company, bookingId")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchError) {
    console.error(`Failed to fetch lead ${leadId} for booking: ${fetchError.message}`);
    return NextResponse.json({ error: "Unable to complete the booking. Please try again." }, { status: 500 });
  }
  try {
    assertLeadIsBookable(lead);
  } catch (e) {
    if (e instanceof LeadNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof AlreadyBookedError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }

  let reserved;
  try {
    reserved = await reserveSlot({ slotStart, attendeeName, attendeeEmail });
  } catch (e) {
    const message = e instanceof Error ? e.message : "That slot could not be booked -- please choose another time.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: updateError } = await client
    .from("leads")
    .update({ bookingId: reserved.bookingId, scheduledAt: reserved.scheduledAt })
    .eq("id", leadId);
  if (updateError) {
    console.error(`Failed to update lead ${leadId} after booking: ${updateError.message}`);
    return NextResponse.json({ error: "Unable to complete the booking. Please try again." }, { status: 500 });
  }

  try {
    // lead.company is the record Supabase already trusts (written by
    // /api/lead from validated intake), never the client-supplied company
    // on this request -- see the security note above.
    await sendBookingConfirmation(attendeeEmail, reserved.scheduledAt, appConfig.senderEmail);
    await sendOperatorAlert(lead.company, reserved.scheduledAt, appConfig.senderEmail, appConfig.operatorEmail);
  } catch (e) {
    // The booking itself succeeded and is already persisted; a failed
    // notification email shouldn't turn into a user-facing booking failure.
    console.error(`Booking ${reserved.bookingId} confirmed but notification email(s) failed: ${e}`);
  }

  return NextResponse.json(reserved);
}
