// PRD v5 Section 7, Interface Contracts: the elicitation-widget intake
// engine, shared verbatim between the funnel (web) and the console. Renders
// a declared ElicitationQuestion[] inventory as batched tappable questions
// and returns a flat structured payload — never a freeform form.
export interface ElicitationQuestion {
  key: string;
  question: string;
  type: "single_select";
  options: readonly string[];
}

export type ElicitationPayload = Record<string, string>;

export interface ElicitationEngine {
  present(questions: ElicitationQuestion[]): Promise<ElicitationPayload>;
}

export function createElicitationEngine(): ElicitationEngine {
  // TODO Phase 1: implement the batched tappable-question presenter per the
  // elicitation-widget skill pattern. Must return a payload that maps
  // directly onto LeadIntake (web/lib/validation.ts) with no separate
  // transformation step (PRD Section 6, "Elicitation driven intake",
  // acceptance criterion 3).
  throw new Error("not implemented");
}
