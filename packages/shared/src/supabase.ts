// PRD v8 Section 9, Data Model + supabase/schema.sql: the shared Supabase
// client and Lead types. Single source of truth for the funnel, console,
// and (conceptually) the engine's output writer -- moved here in Sprint 5
// after console/lib/supabase.ts previously re-exported from
// ../../web/lib/supabase.ts, a relative import that crossed a pnpm
// workspace package boundary and only worked because nothing had imported
// it yet (flagged in Sprint 1's self-review).
import { createClient } from "@supabase/supabase-js";

// Matches supabase/schema.sql's `source` check constraint exactly.
export type Source = "inbound" | "list-import" | "google-places" | "serp" | "claude-web";
export type EmailStatus = "valid" | "risky" | "invalid" | "not-found";
export type Grade = "A+" | "A" | "B" | "C" | "D";
export type ReviewState = "pending" | "approved" | "edited" | "rejected" | "held";

// Matches supabase/schema.sql's `stage` check constraint exactly.
export type LeadStage =
  | "sourced"
  | "new"
  | "researched"
  | "qualified"
  | "review"
  | "contacted"
  | "prepped"
  | "consulted"
  | "proposal"
  | "won"
  | "lost";

export type ChallengeCategory =
  | "ai-strategy"
  | "automation"
  | "custom-build"
  | "data-pipeline"
  | "team-enablement"
  | "other";
export type Timeline = "immediate" | "this-quarter" | "this-year" | "exploring";
export type BudgetBand = "under-10k" | "10k-50k" | "50k-150k" | "150k-plus" | "undisclosed";

export interface CategoryScores {
  companyFit: number; // weight 0.25, see crew/config/qualify.config.json
  contactAccess: number; // weight 0.20
  opportunityQuality: number; // weight 0.20
  competitivePosition: number; // weight 0.15
  outreachReadiness: number; // weight 0.20
}

export interface Lead {
  id: string;
  createdAt: string;
  source: Source;
  sourceDetail?: string;
  company: string;
  companyUrl?: string;
  contactName?: string;
  contactEmail?: string;
  emailStatus: EmailStatus;
  role?: string;
  challenge?: ChallengeCategory;
  timeline?: Timeline;
  budgetBand?: BudgetBand;
  stage: LeadStage;
  fitScore?: number; // 0-100 first-pass score from the engine
  admitted: boolean;
  prospectScore?: number; // 0-100 composite from the crew
  grade?: Grade;
  categoryScores?: CategoryScores;
  qualification?: string;
  reviewState: ReviewState;
  icpProfileId?: string;
  dedupeKey: string;
  bookingId?: string;
  scheduledAt?: string;
}

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env.example)");
  }
  return createClient(url, anonKey);
}
