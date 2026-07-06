// PRD v5 Section 8, "lead detail view": captured/discovered fields, the
// five-category score breakdown, BANT + MEDDIC reasoning, crew artifacts,
// and run controls for each applicable /atrium command.
import { notFound } from "next/navigation";
import { fetchLeadById } from "@/lib/leads";

const CATEGORY_LABELS: Record<string, string> = {
  companyFit: "Company Fit",
  contactAccess: "Contact Access",
  opportunityQuality: "Opportunity Quality",
  competitivePosition: "Competitive Position",
  outreachReadiness: "Outreach Readiness",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let lead;
  try {
    lead = await fetchLeadById(id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error fetching lead";
    return (
      <main>
        <p role="alert">Could not load this lead: {message}</p>
      </main>
    );
  }

  if (!lead) {
    notFound();
  }

  return (
    <main>
      <h1>{lead.company}</h1>
      <dl>
        <dt>Stage</dt>
        <dd>{lead.stage}</dd>
        <dt>Source</dt>
        <dd>{lead.source}</dd>
        <dt>Contact</dt>
        <dd>{lead.contactName ?? "Unknown"} {lead.contactEmail ? `<${lead.contactEmail}>` : ""}</dd>
        <dt>Prospect score</dt>
        <dd>{lead.prospectScore ?? "Not yet scored"} {lead.grade ? `(${lead.grade})` : ""}</dd>
      </dl>

      {lead.categoryScores ? (
        <section>
          <h2>Score breakdown</h2>
          <ul>
            {Object.entries(lead.categoryScores).map(([key, value]) => (
              <li key={key}>
                {CATEGORY_LABELS[key] ?? key}: {value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
