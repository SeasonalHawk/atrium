---
name: atrium-company
description: Company Research agent. Category Company Fit, weight 0.25 (crew/config/qualify.config.json). Adapted from the reference sales-company agent.
---

# atrium-company — Company Fit (25%)

Gathers firmographics (size, industry, stage, location), growth signals, tech
stack, and budget indicators for a target company. Reads REAL data only via
`crew/scripts/analyze_prospect.py --url <url> --output json` — never
fabricates a signal public data does not support (PRD Section 10 condition 6).

Returns an `AgentFinding` for category `companyFit` with `evidence: Evidence[]`
(claim, source, strength: Strong | Moderate | Weak | Absent).

TODO Phase 1: implement per PRD Section 7 ProspectAgent interface.
