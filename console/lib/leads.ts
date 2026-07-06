// PRD v8 Section 6, "Operator console: pipeline board" — reads Lead rows
// from Supabase and groups them by LeadStage. The client is injectable so
// tests never hit a real Supabase project (see leads.test.ts).
import { getSupabaseClient, type Lead, type LeadStage } from "@atrium/shared/supabase";

// Matches supabase/schema.sql's `stage` check constraint, in pipeline order.
export const PIPELINE_STAGES: LeadStage[] = [
  "sourced",
  "new",
  "researched",
  "qualified",
  "review",
  "contacted",
  "prepped",
  "consulted",
  "proposal",
  "won",
  "lost",
];

interface SupabaseQueryResult {
  data: Lead[] | null;
  error: { message: string } | null;
}

// Narrow surface of the supabase-js client actually used here — real
// SupabaseClient instances satisfy this, and tests can pass a plain object.
export interface LeadsClient {
  from(table: string): {
    select(columns: string): {
      order(column: string, opts: { ascending: boolean }): Promise<SupabaseQueryResult>;
      eq(
        column: string,
        value: string,
      ): {
        maybeSingle(): Promise<{ data: Lead | null; error: { message: string } | null }>;
      };
    };
  };
}

// Real SupabaseClient instances are structurally deep generics; casting
// through unknown avoids TypeScript trying (and failing, "excessively deep")
// to check that whole shape against the narrow LeadsClient surface above.
function defaultClient(): LeadsClient {
  return getSupabaseClient() as unknown as LeadsClient;
}

export async function fetchLeads(client: LeadsClient = defaultClient()): Promise<Lead[]> {
  const { data, error } = await client.from("leads").select("*").order("createdAt", { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }
  return data ?? [];
}

export async function fetchLeadById(id: string, client: LeadsClient = defaultClient()): Promise<Lead | null> {
  const { data, error } = await client.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch lead ${id}: ${error.message}`);
  }
  return data;
}

export function groupByStage(leads: Lead[]): Record<LeadStage, Lead[]> {
  const grouped = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, [] as Lead[]])) as Record<
    LeadStage,
    Lead[]
  >;
  for (const lead of leads) {
    grouped[lead.stage].push(lead);
  }
  return grouped;
}
