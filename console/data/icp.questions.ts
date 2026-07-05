// PRD v5 Section 8, "ideal customer profile editor": elicitation inventory
// for the ICP that calibrates scoring, written to crew/config/icp.config.json.
import type { ElicitationQuestion } from "./../lib/elicitation";

export const ICP_QUESTIONS: ElicitationQuestion[] = [
  {
    key: "orgSize",
    question: "What organization size fits your ideal customer profile?",
    type: "single_select",
    options: ["Small (1-50)", "Mid-market (50-500)", "Enterprise (500+)"],
  },
  {
    key: "minBudget",
    question: "What is the minimum disclosed budget band to score highly?",
    type: "single_select",
    options: ["$10k+", "$50k+", "$150k+", "No minimum"],
  },
];
