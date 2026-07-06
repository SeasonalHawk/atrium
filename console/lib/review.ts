// ROADMAP.md Sprint 7, "Review-before-send queue in the console" — PRD
// v8's single most important screen: the one human checkpoint before any
// crew-drafted outreach goes out (PRD Non-Goal 2, "the crew drafts into
// the console, the operator sends"). Reads/writes Lead rows through an
// injectable client so tests never hit a live Supabase project.
import { getSupabaseClient, type Lead, type ReviewState } from "@atrium/shared/supabase";

interface SupabaseQueryResult {
  data: Lead[] | null;
  error: { message: string } | null;
}

interface SupabaseSingleResult {
  data: Lead | null;
  error: { message: string } | null;
}

// Narrow surface of the supabase-js client actually used here — real
// SupabaseClient instances satisfy this, and tests can pass a plain object.
export interface ReviewClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(column: string, opts: { ascending: boolean }): Promise<SupabaseQueryResult>;
      };
    };
    update(values: Partial<Lead>): {
      eq(column: string, value: string): {
        select(columns: string): {
          maybeSingle(): Promise<SupabaseSingleResult>;
        };
      };
    };
  };
}

// Real SupabaseClient instances are structurally deep generics; casting
// through unknown avoids TypeScript trying (and failing, "excessively deep")
// to check that whole shape against the narrow ReviewClient surface above.
function defaultClient(): ReviewClient {
  return getSupabaseClient() as unknown as ReviewClient;
}

export type ReviewDecision = Extract<ReviewState, "approved" | "edited" | "rejected" | "held">;

// Approving is the only decision that advances the pipeline stage --
// rejecting or holding leaves the lead in "review" for the operator to
// revisit, it never silently drops out of the queue.
const STAGE_ON_DECISION: Partial<Record<ReviewDecision, Lead["stage"]>> = {
  approved: "contacted",
};

export async function fetchReviewQueue(client: ReviewClient = defaultClient()): Promise<Lead[]> {
  const { data, error } = await client.from("leads").select("*").eq("stage", "review").order("createdAt", {
    ascending: true,
  });
  if (error) {
    throw new Error(`Failed to fetch the review queue: ${error.message}`);
  }
  return data ?? [];
}

export async function decideReview(
  id: string,
  decision: ReviewDecision,
  client: ReviewClient = defaultClient(),
): Promise<Lead | null> {
  const updates: Partial<Lead> = { reviewState: decision };
  const nextStage = STAGE_ON_DECISION[decision];
  if (nextStage) {
    updates.stage = nextStage;
  }

  const { data, error } = await client.from("leads").update(updates).eq("id", id).select("*").maybeSingle();
  if (error) {
    throw new Error(`Failed to record review decision for ${id}: ${error.message}`);
  }
  return data;
}
