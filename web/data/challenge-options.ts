// PRD v5 Section 7 data model: ChallengeCategory tappable labels.
export const CHALLENGE_OPTIONS = [
  "AI strategy",
  "Automation",
  "Custom build",
  "Data pipeline",
  "Team enablement",
  "Other",
] as const;

// Maps each tappable label to the ChallengeCategory slug
// web/lib/validation.ts's Zod schema (and Supabase) expect.
export const CHALLENGE_SLUGS: Record<(typeof CHALLENGE_OPTIONS)[number], string> = {
  "AI strategy": "ai-strategy",
  Automation: "automation",
  "Custom build": "custom-build",
  "Data pipeline": "data-pipeline",
  "Team enablement": "team-enablement",
  Other: "other",
};
