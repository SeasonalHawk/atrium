// PRD v8 Section 9: same Supabase client contract as web/lib/supabase.ts —
// the console reads exclusively from Supabase for pipeline state (PRD
// Section 9, Data Flow and State Management). Sourced from @atrium/shared,
// not a relative import across the web/console package boundary (flagged
// as a risk in Sprint 4, fixed in Sprint 5).
export * from "@atrium/shared/supabase";
