// PRD v5 Section 6 + Section 9: the funnel's lead create endpoint.
// Validates the accumulated ElicitationPayload with Zod (web/lib/leadIntake.ts),
// writes one Lead row to Supabase in the "new" stage, and does not fire the
// booking confirmation itself — that happens from /api/booking once the
// visitor picks a slot (PRD Section 10, Error Handling condition 4: no
// partial booked record on a failed insert).
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@atrium/shared/supabase";
import { buildLeadRow, mapElicitationPayloadToLeadIntake } from "@/lib/leadIntake";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  let row;
  try {
    const intake = mapElicitationPayloadToLeadIntake(payload);
    row = buildLeadRow(intake);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid lead intake payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from("leads").insert(row).select("id").maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({ id: data?.id });
  } catch (e) {
    // The real cause (e.g. a Supabase connection/config error) is logged
    // server-side only -- never echoed back to the caller.
    console.error(`Failed to create lead: ${e instanceof Error ? e.message : e}`);
    return NextResponse.json({ error: "Unable to submit your information. Please try again." }, { status: 500 });
  }
}
