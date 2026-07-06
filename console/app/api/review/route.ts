// ROADMAP.md Sprint 7, "Review-before-send queue" — backs
// console/app/review/page.tsx. GET returns every lead awaiting review;
// PATCH records the operator's approve/edit/reject/hold decision. Nothing
// here ever sends outreach itself (PRD Non-Goal 2) -- it only changes
// reviewState and, on approval, advances the pipeline stage.
import { NextResponse } from "next/server";
import { decideReview, fetchReviewQueue, type ReviewDecision } from "@/lib/review";

const VALID_DECISIONS: ReviewDecision[] = ["approved", "edited", "rejected", "held"];

export async function GET() {
  try {
    const queue = await fetchReviewQueue();
    return NextResponse.json({ queue });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error loading the review queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const decision = body?.decision;

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!VALID_DECISIONS.includes(decision)) {
    return NextResponse.json({ error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` }, { status: 400 });
  }

  try {
    const lead = await decideReview(id, decision);
    if (!lead) {
      return NextResponse.json({ error: `No lead found with id ${id}` }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error recording the review decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
