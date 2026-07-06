// PRD v5 Section 6, "Operator console: pipeline board" — every lead and
// prospect grouped by LeadStage, with source, prospect score, and grade
// visible on each card. Selecting a card opens console/app/lead/[id].
import Link from "next/link";
import { fetchLeads, groupByStage, PIPELINE_STAGES } from "@/lib/leads";

const STAGE_LABELS: Record<string, string> = {
  sourced: "Sourced",
  new: "New",
  researched: "Researched",
  qualified: "Qualified",
  review: "Review",
  contacted: "Contacted",
  prepped: "Prepped",
  consulted: "Consulted",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export default async function PipelineBoardPage() {
  let error: string | null = null;
  let grouped = groupByStage([]);

  try {
    const leads = await fetchLeads();
    grouped = groupByStage(leads);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error fetching leads";
  }

  if (error) {
    return (
      <main>
        <h1>Pipeline</h1>
        <p role="alert">Could not load the pipeline: {error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Pipeline</h1>
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
        {PIPELINE_STAGES.map((stage) => (
          <section key={stage} style={{ minWidth: "220px" }}>
            <h2>
              {STAGE_LABELS[stage] ?? stage} ({grouped[stage].length})
            </h2>
            <ul>
              {grouped[stage].map((lead) => (
                <li key={lead.id}>
                  <Link href={`/lead/${lead.id}`}>
                    {lead.company}
                    {typeof lead.prospectScore === "number" ? ` — ${lead.prospectScore}` : ""}
                    {lead.grade ? ` (${lead.grade})` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
