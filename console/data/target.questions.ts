// PRD v5 Section 6, "targets surface": elicitation inventory for adding a
// target company by URL.
import type { ElicitationQuestion } from "./../lib/elicitation";

export const TARGET_QUESTIONS: ElicitationQuestion[] = [
  {
    key: "source",
    question: "Add this target by URL, or generate from your saved ICP?",
    type: "single_select",
    options: ["Company URL", "Generate from ICP"],
  },
];
