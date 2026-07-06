"use client";

// PRD v8's single most important screen: the review-before-send queue,
// the one human checkpoint before any crew-drafted outreach goes out
// (PRD Non-Goal 2 -- the crew drafts, the operator sends). Every decision
// here is explicit; nothing in this page ever sends outreach itself.
import { useCallback, useEffect, useState } from "react";
import type { Lead } from "@atrium/shared/supabase";

const DECISIONS = [
  { value: "approved", label: "Approve" },
  { value: "rejected", label: "Reject" },
  { value: "held", label: "Hold" },
] as const;

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/review");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load the review queue");
      }
      setQueue(data.queue);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, decision: (typeof DECISIONS)[number]["value"]) {
    setDecidingId(id);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to record the decision");
      }
      setQueue((current) => (current ?? []).filter((lead) => lead.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDecidingId(null);
    }
  }

  if (error) {
    return (
      <main>
        <h1>Review Queue</h1>
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!queue) {
    return (
      <main>
        <h1>Review Queue</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (queue.length === 0) {
    return (
      <main>
        <h1>Review Queue</h1>
        <p>Nothing waiting on review right now.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Review Queue ({queue.length})</h1>
      <ul>
        {queue.map((lead) => (
          <li key={lead.id} style={{ marginBottom: "1rem" }}>
            <strong>{lead.company}</strong>
            {typeof lead.prospectScore === "number" ? ` — ${lead.prospectScore}` : ""}
            {lead.grade ? ` (${lead.grade})` : ""}
            <div>{lead.contactName ?? "Unknown contact"} {lead.contactEmail ? `<${lead.contactEmail}>` : ""}</div>
            <div>
              {DECISIONS.map((d) => (
                <button
                  key={d.value}
                  disabled={decidingId === lead.id}
                  onClick={() => decide(lead.id, d.value)}
                  style={{ marginRight: "0.5rem" }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
