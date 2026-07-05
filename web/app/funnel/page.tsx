// PRD v5 Section 6, "Consultation funnel and capture": a five-step
// elicitation-widget flow (company, challenge, timeline, budget, book) that
// reserves a real Cal.com slot. Per-step answers held in a small Zustand
// store (PRD Section 9, Data Flow). See web/lib/elicitation.ts for the
// shared intake engine and web/data/funnel.questions.ts for the question
// inventory this screen renders.
export default function FunnelPage() {
  // TODO Phase 1: render web/data/funnel.questions.ts through the
  // ElicitationEngine, one tappable question per step, then embed Cal.com
  // on the final step per PRD Section 8.
  return null;
}
