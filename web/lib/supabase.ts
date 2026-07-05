// PRD v5 Section 7, Data Model + Interface Contracts: the shared Supabase
// client. Reads and writes the Lead, Run, and Artifact rows that make
// Supabase the single source of truth for both the funnel and the console
// (PRD Section 9, Data Flow and State Management).
import { createClient } from "@supabase/supabase-js";

export type Source = "inbound" | "outbound";
export type Grade = "A+" | "A" | "B" | "C" | "D";
export type LeadStage =
  | "new"
  | "researched"
  | "qualified"
  | "contacted"
  | "prepped"
  | "consulted"
  | "proposal"
  | "won"
  | "lost";

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
  company: string;
  companyUrl?: string;
  contactName?: string;
  contactEmail?: string;
  stage: LeadStage;
  prospectScore?: number;
  grade?: Grade;
  categoryScores?: CategoryScores;
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
