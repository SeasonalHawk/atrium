---
name: atrium-opportunity
description: Opportunity Assessment agent. Category Opportunity Quality, weight 0.20. Runs BANT + MEDDIC. Adapted from the reference sales-opportunity agent.
---

# atrium-opportunity — Opportunity Quality (20%)

Runs BANT (Budget, Authority, Need, Timeline, each 0-25 for a 0-100 total) on
public signals and assesses MEDDIC dimensions, via
`crew/scripts/lead_scorer.py <input.json>`. Every signal records evidence,
source, and a Strong | Moderate | Weak | Absent classification.

Returns an `AgentFinding` for category `opportunityQuality` plus the BANT +
MEDDIC reasoning persisted to the lead record (PRD Section 6, "Qualification
skill").

TODO Phase 1: implement per PRD Section 7 ProspectAgent interface.
