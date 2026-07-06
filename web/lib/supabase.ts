// PRD v8 Section 9, Data Model + Interface Contracts: the shared Supabase
// client and Lead types now live in @atrium/shared so the funnel and
// console never diverge (see packages/shared/src/supabase.ts).
export * from "@atrium/shared/supabase";
