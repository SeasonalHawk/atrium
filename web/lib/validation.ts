// PRD v5 Section 13, Testing Strategy: "Unit tests cover the Zod validation,
// the funnel data, the elicitation payload mapping..." — this is that
// validation layer, shared by the /api/lead route.
import { z } from "zod";

export const challengeCategorySchema = z.enum([
  "ai-strategy",
  "automation",
  "custom-build",
  "data-pipeline",
  "team-enablement",
  "other",
]);

export const timelineSchema = z.enum(["immediate", "this-quarter", "this-year", "exploring"]);

export const budgetBandSchema = z.enum([
  "under-10k",
  "10k-50k",
  "50k-150k",
  "150k-plus",
  "undisclosed",
]);

export const leadIntakeSchema = z.object({
  company: z.string().min(1),
  role: z.string().optional(),
  challenge: challengeCategorySchema,
  timeline: timelineSchema,
  budgetBand: budgetBandSchema,
});

export type LeadIntake = z.infer<typeof leadIntakeSchema>;
