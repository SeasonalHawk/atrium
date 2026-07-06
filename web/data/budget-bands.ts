// PRD v5 Section 7 data model: BudgetBand tappable labels, in display order.
export const BUDGET_BAND_OPTIONS = [
  "Under $10k",
  "$10k - $50k",
  "$50k - $150k",
  "$150k+",
  "Prefer not to say",
] as const;

// Maps each tappable label to the BudgetBand slug web/lib/validation.ts's
// Zod schema (and Supabase) expect.
export const BUDGET_BAND_SLUGS: Record<(typeof BUDGET_BAND_OPTIONS)[number], string> = {
  "Under $10k": "under-10k",
  "$10k - $50k": "10k-50k",
  "$50k - $150k": "50k-150k",
  "$150k+": "150k-plus",
  "Prefer not to say": "undisclosed",
};
