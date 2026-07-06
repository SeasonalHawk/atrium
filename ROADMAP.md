# Atrium Build Roadmap (PRD v8)

One-week sprints for a solo operator (that's you), building with Claude Code
as the execution engine. Framework: classic MVP — de-risk the riskiest
assumption first, ship a thin vertical slice, then expand outward. No sprint
ships UI for something the engine or crew can't yet prove out for real.

**This replaces the earlier v5-based roadmap.** PRD v8 consolidates and
supersedes PRD v5, merging the crew (`ai-sales-team-claude`) with a new Lead
Engine (`28AXE/lead-engine`) that finds and verifies leads before the crew
ever sees them, adds a review-before-send queue as the one human checkpoint,
an MCP automation layer, and configurable multi-profile ICP targeting. The
build sequence is explicitly ordered "cheapest, fastest-to-revenue work
first" — five phases instead of v5's three.

Pace assumption: ~10 hours/week, matching PRD v8 Section 14's own calendar
math. The phase-end weeks below are **cumulative from project start**, taken
directly from the PRD, not re-derived: Phase 1 done by ~week 2, Phase 2 by
~week 5, Phase 3 by ~week 8, Phase 4 by ~week 11-12. Phase 5 is additive and
has no calendar commitment in the PRD — it opens the system to paying
tenants once AltoLumo's own use is solid.

Rule for every sprint: it ends with something you can run and watch happen.
If a sprint doesn't produce that, it isn't done yet.

**Why this order, not another one:** the PRD's own feasibility check (run
during specification, not assumed) confirms the core scoring logic works
before a single line of the surrounding system exists — a sample Series A
lead scored BANT 75/100 (budget 19, authority 23, need 16, timeline 17),
MEDDIC 83% complete, grade A. The campaign cost model checked out
arithmetically too: about $0.66 per qualified lead across campaigns of 100,
200, and 500 sourced leads, supporting a 3-5x margin at a $5-8/lead charge.
That's why Phase 1 is "make the crew work, locally, on leads you already
have" — it's the cheapest possible proof that the expensive parts (Lead
Engine, MCP automation, multi-tenant) are worth building at all.

---

## Sprint 0 — Inception ✅ Done

- PRD v5 read and scaffolded; PRD v8 (the consolidation) reviewed in full.
- Repo live at `github.com/SeasonalHawk/atrium`, `main` + `dev`.
- Interactive Phase 0 mock-up built and extended for v8: architecture, the
  six-step Lead Engine pipeline, the crew persona roster, the four ICP
  profiles, the pipeline board, a simulated prospect run (with the
  admission-gate drop-off visible), the review-before-send queue, the
  inbound funnel, and the scoring legend — `docs/mockup/atrium-v8-model.html`.
- Pexels API client working and verified.

Sprint 1 starts from a real skeleton and a validated concept, not zero.

---

## PHASE 1 — LOCAL MVP CREW (Sprints 1-2, cumulative by ~week 2)

**Goal:** the crew working leads locally from the command line, almost no
cash, no infrastructure. The fastest path to a first paying conversation —
work leads you already have (a conference list, warm intros) before
building anything that finds new ones.

**Claude Code hours: 22 · Solo dev hours: 64**

### Sprint 1 — Install and wire the crew (13 CC hrs) ✅ Done

- Install and adapt the crew from the reference repo (4 hrs).
- Author the `/atrium` orchestrator and command routing (3 hrs).
- Wire kajiro-prompt-optimizer-pro into the orchestrator dispatch, Auto
  mode, silent (2 hrs).
- Adapt the 5 agents with config-driven weights — `qualify.config.json`,
  never hardcoded (4 hrs).

**Demo at end of week:** `/atrium prospect` routes through all five agents
and returns *something*, even if the scoring still needs Sprint 2's tuning.
**Verified:** ran end-to-end against resend.com — composite 64/100, Grade B.

### Sprint 2 — Score real leads, preload profiles (9 CC hrs) ✅ Done

- Wire `lead_scorer.py` and `analyze_prospect.py` for real (2 hrs).
- Simple CSV import of a warm or conference list (2 hrs).
- Run `/atrium prospect` and `qualify` on real targets, review the output
  (1 hr) — **this is the week you argue with the scoring model if it feels
  wrong, before anything is built on top of it.**
- Preload the four AltoLumo ICP profiles as config (2 hrs).
- Instrument per-lead and per-audit cost logging (2 hrs) — so Phase 2's
  economics model gets measured data, not another assumption.

**Definition of Done, Phase 1 (PRD v8):** import a list or supply a URL,
run `/atrium prospect`, and receive a composite 0-100 score, a grade, a
BANT + MEDDIC qualification with evidence, and drafted outreach — all
locally, review-before-send already the default posture. The five category
weights come from config and sum to one. Kajiro optimizes silently. Cost is
the Claude subscription only.

**Phase 1 Definition of Done: met.** Verified `/atrium qualify` end-to-end
against linear.app — Opportunity Quality Score 59/100, Grade B, computed
from the qualify skill's own BANT*0.5 + MEDDIC*0.3 + Urgency*0.2 formula.
Preloaded 5 ICP profiles (PRD's 4 + Project & Program Leadership). Cost
logging verified via `crew/scripts/log_run.py --summary`.

---

## PHASE 2 — LEAD ENGINE + SHARED PIPELINE (Sprints 3-5, cumulative by ~week 5)

**Goal:** the machine finds leads and a shared pipeline holds them. You
stop sourcing by hand.

**Claude Code hours: 33 · Solo dev hours: 98**

### Sprint 3 — Sourcing and enrichment (12 CC hrs) ✅ Done

- Scaffold the engine, config loader, base stage interfaces (3 hrs).
- Build Google Places + SERP + Claude web discovery (4 hrs).
- Build contact and email finding (3 hrs).
- Build email verification and the valid/risky/invalid gate (2 hrs) — note:
  the admission *gate* itself (valid/risky/invalid routing logic) is Sprint
  4's "first-pass scoring, admission gate, and dedup" task; Sprint 3 ships
  the classifier the gate will consume.

**Verified:** `engine/` scaffolded with base interfaces (`SourcingProvider`,
`EnrichmentProvider`, `VerificationProvider`), 4 sourcing providers (Google
Places, SERP, list-import, Claude-web), contact-finding enrichment (Hunter),
and email verification (ZeroBounce). 44 pytest unit tests, all HTTP/subprocess
calls mocked — no live API keys needed to run the suite. Ran the real CLI
end-to-end via `list-import` (no key required for that source) against a
real target. See `engine/README.md`. Found and fixed a real TLS-verification
security bug while adapting `analyze_prospect.py` in Sprint 2 — same
adapt-with-scrutiny discipline applied here; no equivalent issue found in
the new engine code.

### Sprint 4 — Scoring, admission, persistence (9 CC hrs) ✅ Done

- Build first-pass scoring, the admission gate, and dedup (3 hrs).
- Integrate Supabase — leads, targets, runs tables (3 hrs).
- Database bridge scripts between crew and Supabase (3 hrs).

**Verified:** `engine/src/scoring/scorer.py` (first-pass fit score, 0-100),
`decision_gate.py` (admission: risky/invalid emails always held, not-found
admitted if the score clears the profile's threshold), and
`dedup/reconciler.py` (merges duplicates by domain/name, unions signals,
keeps the richer contact) — 26 new pytest tests, 70 total in `engine/`.
`supabase/schema.sql` defines `leads`, `lead_signals`, `artifacts`, `runs`,
`icp_profiles`, `campaigns`. `engine/src/output/supabase_writer.py` upserts
admitted leads on `dedupeKey`. `crew/scripts/push_status.mjs` and
`fetch_leads.mjs` are real now (Supabase REST via `fetch`, PRD Section 10
condition 3's fallback-to-workspace-on-failure behavior included) — 15
Node test-runner tests. Ran the full six-stage pipeline end-to-end via
`engine/main.py --sources list-import`: 2 real candidates in, 1 correctly
admitted (had a contact), 1 correctly held (didn't) — the admission gate
making a real decision on real data, not a mocked one.

### Sprint 5 — Console, deliverability, profiles (12 CC hrs)

- Minimal console pipeline board and lead detail (5 hrs).
- Deliverability foundation: sending domain, SPF, DKIM, DMARC (2 hrs).
- ICP profile library and switcher (3 hrs).
- Campaign cost metering, cost per campaign per profile (2 hrs).

**Definition of Done, Phase 2 (PRD v8):** a run discovers, enriches,
verifies, scores, and admits leads, writing only valid, good-fit leads to
Supabase, where they appear on the board and the crew works them.
Duplicates are merged. A test send from admitted leads measures a bounce
rate under 2%.

---

## PHASE 3 — AUTOPILOT, SIGNALS, REVIEW-BEFORE-SEND (Sprints 6-8, cumulative by ~week 8)

**Goal:** the system runs on its own and asks for you only at the review
queue.

**Claude Code hours: 27 · Solo dev hours: 78**

### Sprint 6 — Signals and crew depth (12 CC hrs)

- Meta Ad Library, Google Ads Transparency, hiring signals (6 hrs).
- Fold signals into scoring with configurable weights (2 hrs).
- Crew outreach, follow-up, prep, proposal skills (4 hrs).

### Sprint 7 — The review queue and MCP servers (9 CC hrs)

- Review-before-send queue in the console (4 hrs) — **the single most
  important screen in the whole system: this is the trust mechanism.**
- Custom MCP servers: places, email finder, verifier, signals (5 hrs).

### Sprint 8 — Connect, schedule, notify (6 CC hrs)

- Connect existing MCP tools: Sheets, CRM, web search, Gmail draft (3 hrs).
- Scheduled autonomous run via GitHub Actions cron (2 hrs).
- Hot lead notification (1 hr).

**Definition of Done, Phase 3 (PRD v8):** on a schedule, the system sources,
verifies, scores, works, and drafts, then presents a review queue; Claude
operates the tools through MCP; you approve, edit, or reject; nothing sends
without approval; you're notified of hot leads.

---

## PHASE 4 — FULL INTEGRATION AND INBOUND (Sprints 9-12, cumulative by ~week 11-12)

**Goal:** inbound and outbound share one pipeline behind a full console,
launch-ready.

**Claude Code hours: 29 · Solo dev hours: 84**

### Sprint 9 — The inbound funnel (8 CC hrs)

- Inbound consultation funnel on Vercel, Elicitation-driven (5 hrs).
- Cal.com booking and Resend confirmation + alert (3 hrs).

### Sprint 10 — Full console and NL sourcing (9 CC hrs)

- Full console: targets, runs, artifacts, ICP editor, reports (6 hrs).
- Natural-language sourcing — describe a market, get queries (3 hrs).

### Sprint 11 — Reporting and the growth stack (7 CC hrs)

- Report and report-pdf via `generate_pdf_report.py` (3 hrs).
- Host the site and funnel on Cloudflare with DNS and CDN (2 hrs).
- Instrument the site and funnel with PostHog analytics (2 hrs).

### Sprint 12 — Distribution and launch hardening (5 CC hrs)

- Content distribution via Repurpose and a community channel (2 hrs).
- Accessibility, error hardening, deployment lockdown (3 hrs).

**Definition of Done, Phase 4 (PRD v8):** a visitor books through the funnel
and the lead joins the same pipeline as outbound; the full console manages
the system; natural-language sourcing works; the system is deployed and
hardened.

---

## PHASE 5 — MULTI-TENANT (Sprints 13-14, additive — no PRD calendar commitment)

**Goal:** open the system to paying tenants beyond AltoLumo, each with their
own profiles and isolated pipeline. AltoLumo stays free and single-tenant
through Phase 4 — this phase is additive and never blocks AltoLumo's own
use.

**Claude Code hours: 13 · Solo dev hours: 39**

### Sprint 13 — Isolation (6 CC hrs)

- Tenant isolation and Supabase row-level security (4 hrs).
- Per-tenant profile libraries (2 hrs).

### Sprint 14 — Monetization (7 CC hrs)

- Usage metering and billing (4 hrs).
- Self-serve profile builder (3 hrs).

**Definition of Done, Phase 5 (PRD v8):** a second tenant defines their own
ICP profiles, runs campaigns isolated from AltoLumo data, and is billed by
usage. AltoLumo remains the owner tenant at no charge.

---

## Total (PRD v8 Section 14)

| Phase | Claude Code Hours | Solo Dev Hours |
|---|---|---|
| Phase 1 | 22 | 64 |
| Phase 2 | 33 | 98 |
| Phase 3 | 27 | 78 |
| Phase 4 | 29 | 84 |
| Phase 5 | 13 | 39 |
| **Total** | **124** | **363** |

## Weekly ritual

At the start of each sprint: re-read that sprint's goal above, out loud, to
yourself, before opening an editor. At the end: the demo line — or the
phase's Definition of Done, on a phase's final sprint — is the bar. If you
can't do it, the sprint isn't done, no matter how much code got written.
Carry unfinished work forward as next week's first task rather than starting
the next sprint's scope early; half of two sprints is worse than one sprint
actually finished.

If reality disagrees with an estimate — the scoring feels wrong in Sprint 2,
email verification takes longer than expected in Sprint 3 — that's real
signal. Stop and fix the model before moving forward. It's cheaper to be
wrong about a scoring algorithm in Sprint 2 than to discover it in Sprint 5
with a Lead Engine and a console built on top of it.

## Compliance line, never negotiable

The Lead Engine uses official and public APIs only — Google Places, a SERP
API, Claude web search, the Meta Ad Library, the Google Ads Transparency
Center, a contact-finding API, an email verifier. It **never** logs into
Instagram, Facebook, X, or LinkedIn to scrape them, and never evades
anti-bot protection. That's not a style preference — a banned account or a
poisoned sending domain costs more than manual sourcing ever would, and it's
explicitly out of scope in PRD v8 Section 9's Data Source Catalog (rated
Red). If a future sprint is ever tempted to add a scraper for a platform
without an official API, that's a stop-and-reread-the-PRD moment, not a
judgment call to make alone at 11pm.
