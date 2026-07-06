// PRD v5 Section 6, "Consultation funnel and capture", acceptance criterion 2:
// reserves the picked Cal.com slot, writes the bookingId and scheduledAt
// onto the lead row, and fires the Resend customer confirmation + operator
// alert (web/lib/resend.ts). PRD Section 10 condition 5: if the reservation
// fails, no lead is marked booked and the caller can prompt the visitor to
// pick another slot.
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@atrium/shared/supabase";
import { appConfig } from "@/config/app.config";
import { validateBookingRequest } from "@/lib/booking";
import { reserveSlot } from "@/lib/calcom";
import { sendBookingConfirmation, sendOperatorAlert } from "@/lib/resend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  let booking;
  try {
    const { leadId, company, attendeeName, attendeeEmail, slotStart } = validateBookingRequest(body);

    const reserved = await reserveSlot({ slotStart, attendeeName, attendeeEmail });

    const client = getSupabaseClient();
    const { error } = await client
      .from("leads")
      .update({ bookingId: reserved.bookingId, scheduledAt: reserved.scheduledAt })
      .eq("id", leadId);
    if (error) {
      throw new Error(`Failed to update lead ${leadId}: ${error.message}`);
    }

    await sendBookingConfirmation(attendeeEmail, reserved.scheduledAt, appConfig.senderEmail);
    await sendOperatorAlert(company, reserved.scheduledAt, appConfig.senderEmail, appConfig.operatorEmail);

    booking = reserved;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error booking the consultation";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json(booking);
}
