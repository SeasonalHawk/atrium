// PRD v5 Section 6, "Elicitation driven intake": the declared question
// inventory the funnel renders one step at a time on mobile. Keys map
// directly to LeadIntake fields (web/lib/validation.ts) after the
// label -> slug mapping in web/lib/leadIntake.ts.
import type { ElicitationQuestion } from "../lib/elicitation";
import { CHALLENGE_OPTIONS } from "./challenge-options";
import { BUDGET_BAND_OPTIONS } from "./budget-bands";
import { TIMELINE_OPTIONS } from "./timeline-options";

export const FUNNEL_QUESTIONS: ElicitationQuestion[] = [
  {
    key: "company",
    question: "What's your company called?",
    type: "text_input",
    placeholder: "Acme Co",
  },
  {
    key: "challenge",
    question: "What challenge brings you here?",
    type: "single_select",
    options: CHALLENGE_OPTIONS,
  },
  {
    key: "timeline",
    question: "What is your timeline?",
    type: "single_select",
    options: TIMELINE_OPTIONS,
  },
  {
    key: "budgetBand",
    question: "What is your budget band?",
    type: "single_select",
    options: BUDGET_BAND_OPTIONS,
  },
];
