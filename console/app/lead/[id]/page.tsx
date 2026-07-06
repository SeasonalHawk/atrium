// PRD v5 Section 8, "lead detail view": captured/discovered fields, the
// five-category score breakdown, BANT + MEDDIC reasoning, crew artifacts,
// and run controls for each applicable /atrium command.
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO Phase 1: fetch the lead by id, render CategoryScores as a
  // breakdown, list Artifact[], and wire run controls to console/api/run.
  return null;
}
