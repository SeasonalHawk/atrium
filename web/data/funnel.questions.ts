// PRD v5 Section 6, "Elicitation driven intake": the declared question
// inventory the funnel renders one step at a time on mobile. Keys map
// directly to LeadIntake fields (web/lib/validation.ts).
import type { ElicitationQuestion } from "../lib/elicitation";
import { CHALLENGE_OPTIONS } from "./challenge-options";
import { BUDGET_BAND_OPTIONS } from "./budget-bands";

export const FUNNEL_QUESTIONS: ElicitationQuestion[] = [
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
    options: ["Immediate", "This quarter", "This year", "Just exploring"],
  },
  {
    key: "budgetBand",
    question: "What is your budget band?",
    type: "single_select",
    options: BUDGET_BAND_OPTIONS,
  },
];
