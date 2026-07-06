// PRD v8 Section 7, Interface Contracts: the elicitation-widget intake
// engine, shared between the funnel (web) and the console. Renders a
// declared ElicitationQuestion[] inventory as batched tappable questions
// and returns a flat structured payload — never a freeform form.
export interface ElicitationQuestion {
  key: string;
  question: string;
  type: "single_select" | "text_input";
  // Required for single_select, omitted for text_input.
  options?: readonly string[];
  // Optional hint text for a text_input question.
  placeholder?: string;
}

export type ElicitationPayload = Record<string, string>;

export interface ElicitationEngine {
  present(questions: ElicitationQuestion[]): Promise<ElicitationPayload>;
}

// Pure step-management helpers (Sprint 9). These are the actual shared
// "engine" every interactive renderer (the funnel's React wizard, and in
// a later sprint the console's targets add-flow and ICP editor) drives
// against its own render loop -- a single Promise-returning present()
// can't surface intermediate per-step UI state, so it stays reserved for
// a genuinely headless caller (see createElicitationEngine below).

export function isAnswered(payload: ElicitationPayload, question: ElicitationQuestion): boolean {
  const value = payload[question.key];
  return typeof value === "string" && value.length > 0;
}

export function isPayloadComplete(questions: readonly ElicitationQuestion[], payload: ElicitationPayload): boolean {
  return questions.every((q) => isAnswered(payload, q));
}

// Returns the index of the first unanswered question, or -1 if every
// question in the inventory already has an answer.
export function nextIncompleteIndex(questions: readonly ElicitationQuestion[], payload: ElicitationPayload): number {
  return questions.findIndex((q) => !isAnswered(payload, q));
}

export function answerQuestion(payload: ElicitationPayload, key: string, value: string): ElicitationPayload {
  return { ...payload, [key]: value };
}

export function createElicitationEngine(): ElicitationEngine {
  return {
    async present() {
      // No headless caller exists yet -- every current renderer (the
      // funnel) is interactive and uses nextIncompleteIndex/answerQuestion/
      // isPayloadComplete directly against its own component state instead.
      // Implement this only when a real non-interactive caller needs it,
      // rather than fabricating a presenter nothing exercises.
      throw new Error(
        "createElicitationEngine().present() has no headless caller yet -- interactive UIs should use nextIncompleteIndex/answerQuestion/isPayloadComplete directly.",
      );
    },
  };
}
