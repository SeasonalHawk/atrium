// PRD v5 Section 6 + Section 9: maps the funnel's ElicitationPayload
// (tappable label strings, e.g. "AI strategy") onto LeadIntake's slug enums
// (e.g. "ai-strategy"), then builds the Supabase `leads` row to insert.
// Kept separate from the /api/lead route so both halves are independently
// unit-testable without a request/response mock.
import type { ElicitationPayload } from "@atrium/shared/elicitation";
import type { Lead } from "@atrium/shared/supabase";
import { CHALLENGE_SLUGS } from "../data/challenge-options";
import { BUDGET_BAND_SLUGS } from "../data/budget-bands";
import { TIMELINE_SLUGS } from "../data/timeline-options";
import { leadIntakeSchema, type LeadIntake } from "./validation";

const LABEL_TO_SLUG: Record<string, Record<string, string>> = {
  challenge: CHALLENGE_SLUGS,
  timeline: TIMELINE_SLUGS,
  budgetBand: BUDGET_BAND_SLUGS,
};

/** Turn a funnel payload of tappable labels into a validated LeadIntake.
 * Throws a ZodError (via safeParse's .error, re-thrown as a plain Error
 * with a readable message) if the payload is incomplete or a label isn't
 * a recognized option -- never silently drops or guesses a field. */
export function mapElicitationPayloadToLeadIntake(payload: ElicitationPayload): LeadIntake {
  const slugged: Record<string, string> = { ...payload };
  for (const [key, labelMap] of Object.entries(LABEL_TO_SLUG)) {
    const label = payload[key];
    if (label !== undefined) {
      slugged[key] = labelMap[label] ?? label;
    }
  }

  const result = leadIntakeSchema.safeParse(slugged);
  if (!result.success) {
    throw new Error(`Invalid lead intake payload: ${result.error.message}`);
  }
  return result.data;
}

function slugifyCompany(company: string): string {
  return company
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build the Supabase `leads` row for a new inbound intake. dedupeKey uses
 * the company name (inbound leads have no companyUrl at intake time,
 * unlike outbound leads whose dedupeKey comes from the domain --
 * see engine/src/dedup/reconciler.py's dedupe_key for the outbound side
 * of the same convention). */
export function buildLeadRow(intake: LeadIntake): Omit<Lead, "id" | "createdAt"> {
  return {
    source: "inbound",
    company: intake.company,
    role: intake.role,
    challenge: intake.challenge,
    timeline: intake.timeline,
    budgetBand: intake.budgetBand,
    emailStatus: "not-found",
    stage: "new",
    admitted: false,
    reviewState: "pending",
    dedupeKey: `inbound:${slugifyCompany(intake.company)}`,
  };
}
