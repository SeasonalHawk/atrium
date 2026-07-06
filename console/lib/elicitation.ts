// PRD v8 Section 6: the console reuses the exact same elicitation-widget
// engine as the funnel so intake behaves identically everywhere. Sourced
// from @atrium/shared, not a relative import across the web/console
// package boundary (flagged as a risk in Sprint 4, fixed in Sprint 5).
export * from "@atrium/shared/elicitation";
