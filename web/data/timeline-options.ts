// PRD v5 Section 7 data model: Timeline tappable labels, in display order.
export const TIMELINE_OPTIONS = ["Immediate", "This quarter", "This year", "Just exploring"] as const;

// Maps each tappable label to the Timeline slug web/lib/validation.ts's
// Zod schema (and Supabase) expect.
export const TIMELINE_SLUGS: Record<(typeof TIMELINE_OPTIONS)[number], string> = {
  Immediate: "immediate",
  "This quarter": "this-quarter",
  "This year": "this-year",
  "Just exploring": "exploring",
};
