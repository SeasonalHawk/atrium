"use client";

// PRD v5 Section 6, "Consultation funnel and capture": a five-step
// elicitation-widget flow (company, challenge, timeline, budget, book) that
// reserves a real Cal.com slot. Per-step answers held in a small Zustand
// store (PRD Section 9, Data Flow). See web/lib/elicitation.ts for the
// shared intake engine and web/data/funnel.questions.ts for the question
// inventory this screen renders.
import { useMemo, useState } from "react";
import { FUNNEL_QUESTIONS } from "@/data/funnel.questions";
import { nextIncompleteIndex } from "@atrium/shared/elicitation";
import { useFunnelStore } from "@/lib/funnelStore";
import { suggestedSlots } from "@/lib/suggestedSlots";

type Phase = "questions" | "booking" | "confirmed";

export default function FunnelPage() {
  const { payload, answer, leadId, setLeadId, bookingConfirmed, setBookingConfirmed } = useFunnelStore();
  const [phase, setPhase] = useState<Phase>("questions");
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const stepIndex = nextIncompleteIndex(FUNNEL_QUESTIONS, payload);
  const currentQuestion = stepIndex === -1 ? undefined : FUNNEL_QUESTIONS[stepIndex];
  const slots = useMemo(() => suggestedSlots(6), []);

  // Takes the just-updated payload explicitly rather than reading the
  // `payload` closure variable -- answer() updates the Zustand store, but
  // this component's `payload` binding still reflects the render this
  // handler was created in until React re-renders, so the final answer
  // would otherwise be missing from the submitted body.
  async function submitLead(completedPayload: typeof payload) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completedPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit your answers");
      }
      setLeadId(data.id);
      setPhase("booking");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleTextSubmit() {
    if (!currentQuestion || !textValue.trim()) return;
    const updated = { ...payload, [currentQuestion.key]: textValue.trim() };
    answer(currentQuestion.key, textValue.trim());
    setTextValue("");
    if (nextIncompleteIndex(FUNNEL_QUESTIONS, updated) === -1) {
      void submitLead(updated);
    }
  }

  function handleSelect(option: string) {
    if (!currentQuestion) return;
    const updated = { ...payload, [currentQuestion.key]: option };
    answer(currentQuestion.key, option);
    if (nextIncompleteIndex(FUNNEL_QUESTIONS, updated) === -1) {
      void submitLead(updated);
    }
  }

  async function submitBooking() {
    if (!selectedSlot || !attendeeName.trim() || !attendeeEmail.trim() || !leadId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          company: payload.company,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim(),
          slotStart: selectedSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to book that slot -- please choose another");
      }
      setScheduledAt(data.scheduledAt);
      setBookingConfirmed();
      setPhase("confirmed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-white p-8 shadow-sm">
        {phase === "questions" && currentQuestion && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-steel">
              Step {FUNNEL_QUESTIONS.indexOf(currentQuestion) + 1} of {FUNNEL_QUESTIONS.length}
            </p>
            <h1 className="mt-2 text-xl font-semibold">{currentQuestion.question}</h1>

            {currentQuestion.type === "text_input" ? (
              <div className="mt-6">
                <input
                  autoFocus
                  type="text"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  placeholder={currentQuestion.placeholder}
                  className="w-full rounded-md border border-hairline px-3 py-2 focus:border-steel focus:outline-none"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textValue.trim() || submitting}
                  className="mt-4 w-full rounded-md bg-deep-steel px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    disabled={submitting}
                    className="rounded-md border border-hairline px-4 py-2 text-left hover:border-steel hover:bg-warm-tint disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === "booking" && (
          <div>
            <h1 className="text-xl font-semibold">Pick a time to talk</h1>
            <p className="mt-1 text-sm text-ink/70">30 minutes, no pressure -- just a conversation about the challenge you described.</p>

            <div className="mt-6 flex flex-col gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-4 py-2 text-left ${
                    selectedSlot === slot ? "border-steel bg-warm-tint" : "border-hairline hover:border-steel"
                  }`}
                >
                  {new Date(slot).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                className="w-full rounded-md border border-hairline px-3 py-2 focus:border-steel focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                className="w-full rounded-md border border-hairline px-3 py-2 focus:border-steel focus:outline-none"
              />
              <button
                onClick={submitBooking}
                disabled={!selectedSlot || !attendeeName.trim() || !attendeeEmail.trim() || submitting}
                className="w-full rounded-md bg-deep-steel px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Confirm consultation"}
              </button>
            </div>
          </div>
        )}

        {phase === "confirmed" && bookingConfirmed && (
          <div>
            <h1 className="text-xl font-semibold">You&apos;re booked</h1>
            <p className="mt-2 text-sm text-ink/70">
              {scheduledAt &&
                `See you ${new Date(scheduledAt).toLocaleString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}.`}{" "}
              A confirmation is on its way to your inbox.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
