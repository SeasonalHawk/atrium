// PRD v5 Section 6 + Section 9: the funnel's lead create endpoint.
// Validates the accumulated ElicitationPayload with Zod (web/lib/validation.ts),
// writes one Lead row to Supabase in the "new" stage, and does not fire the
// booking confirmation itself — that happens from the /api/booking webhook
// once Cal.com confirms a slot (PRD Section 10, Error Handling condition 4:
// no partial booked record on a failed insert).
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // TODO Phase 1: parse + validate body with leadSchema (web/lib/validation.ts),
  // insert into Supabase `leads` table via web/lib/supabase.ts, return the
  // created lead id.
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
