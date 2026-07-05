# Atrium Build Roadmap

One-week sprints for a solo operator (that's you), building with Claude Code
as the execution engine. Framework: classic MVP — de-risk the riskiest
assumption first, ship a thin vertical slice, then expand outward. No sprint
ships UI for something the crew can't yet prove out for real.

Pace assumption: ~8-10 hours/week, matching PRD v5 Section 12's own
calendar math (Phase 1 in ~5 weeks at that pace). If you have a lighter or
heavier week, slide the sprint, don't shrink the scope inside it — each
sprint below is sized to end on a working, demonstrable thing, not a
partial one.

Rule for every sprint: it ends with something you can run and watch happen,
not a pile of unconnected files. If a sprint doesn't produce that, it isn't
done yet.

---

## Sprint 0 — Inception ✅ Done

- PRD v5 read, verified against the reference repo.
- Repo scaffolded to PRD Section 7 exactly: `web/`, `console/`, `launcher/`,
  `crew/` (15 sub-skills, 5 agents, 4 script stubs, 6 templates, config).
- `github.com/SeasonalHawk/atrium` live, public, `main` + `dev`.
- Project `CLAUDE.md` and `README.md` written.
- Interactive system model built (brand-accurate, AltoLumo Brand Book v8:
  Paper/Ink Navy/Steel Blue, Inter, real logo, real crew persona photos).
- Pexels API client working and verified against your live key.

You're not starting from zero. Sprint 1 starts from a real skeleton.

---

## PHASE 1 — THE MVP (Sprints 1-5)

The riskiest assumption in this whole product isn't the console, the
funnel, or Supabase — it's whether the crew can actually turn a company URL
into a trustworthy score. Prove that before building anything around it.

### Sprint 1 — Prove the crew works (no UI, no database)

**Goal:** run `/atrium prospect <a real company>` in Claude Code and get
back a real `PROSPECT-ANALYSIS.md` with a real composite score you'd trust.

- Install the reference crew per `install.sh` convention into your Claude
  config directory (`crew/atrium`, `crew/skills/*`, `crew/agents/*`,
  `crew/scripts/*`, `crew/templates/*`).
- Implement `crew/scripts/analyze_prospect.py` and `contact_finder.py` for
  real (`pip install -r crew/requirements.txt` first).
- Implement the 5 agents (`crew/agents/atrium-*.md`) against their real
  category logic — Company Fit 25%, Contact Access 20%, Opportunity Quality
  20%, Competitive Position 15%, Outreach Readiness 20% — reading weights
  from `crew/config/qualify.config.json`, never hardcoded.
- Wire `crew/atrium/SKILL.md` to route `prospect` through discovery →
  5 parallel agents → synthesis.
- **Demo at end of week:** run `/atrium prospect` against 3 real target
  companies you actually care about. Read the 3 analyses. Do the scores
  and grades feel right? If not, this is the week to argue with the
  scoring model — before a console makes it feel more "done" than it is.

### Sprint 2 — Qualification and the full command set

**Goal:** `/atrium qualify` produces real BANT + MEDDIC reasoning, and the
orchestrator routes all 14 commands (even if most are still thin).

- Implement `crew/scripts/lead_scorer.py` for real: Budget, Authority,
  Need, Timeline each 0-25, Strong/Moderate/Weak/Absent evidence per
  signal, never a fabricated signal.
- Wire the kajiro-prompt-optimizer-pro Auto-mode step into the
  orchestrator's dispatch path (`crew/config/kajiro.config.json` already
  holds the rubric weights) — silent, no scorecard surfaced.
- Fill in `atrium-research`, `atrium-contacts`, `atrium-outreach`,
  `atrium-report` skills enough that all 14 commands resolve to something
  real rather than a TODO.
- **Demo at end of week:** run `prospect` → `qualify` → `outreach` back to
  back on one target from the command line. You should be able to hand
  someone the resulting markdown files and have them make sense on their
  own.

### Sprint 3 — Supabase: the crew starts writing to a database

**Goal:** a prospect run's score, grade, and stage land in a real Supabase
table, not just a markdown file in a folder.

- Stand up the Supabase project (`SUPABASE_URL`, keys into `.env.local`,
  never committed).
- Create the `leads`, `targets`, `runs`, `artifacts` tables per the
  `Lead`/`Run`/`Artifact` interfaces in `web/lib/supabase.ts`.
- Implement `crew/scripts/push_status.mjs` (writes score/grade/stage back)
  and `crew/scripts/fetch_leads.mjs` (pulls new-stage leads in).
- **Demo at end of week:** run a prospect against a target added directly
  in Supabase, then query the table and see the composite score, grade,
  and category breakdown sitting there.

### Sprint 4 — Launcher + a read-only console board

**Goal:** click a button in a browser, watch a real crew run happen, see
the result on a board — no more terminal-only workflow.

- Implement `launcher/server.mjs` for real: accept a `RunRequest`, invoke
  the corresponding `/atrium` command via `run-map.mjs`, track status.
- Implement `console/app/api/run/route.ts` to call the launcher.
- Implement `console/app/page.tsx` (the pipeline board) reading real
  Supabase data, grouped by `LeadStage`, and `console/app/lead/[id]/page.tsx`
  for the score breakdown.
- **Demo at end of week:** open the console locally (`pnpm dev:console`),
  click "Run prospect" on a real target, watch it go from queued → running
  → done, and see the grade badge land on the board.

### Sprint 5 — Inbound funnel + booking (Phase 1 complete)

**Goal:** the other half of the business — a real person books a real
consultation on their phone, and it shows up next to your outbound
prospects on the same board.

- Build the elicitation funnel (`web/app/funnel/page.tsx`,
  `web/data/funnel.questions.ts`) as an actual one-question-at-a-time
  mobile flow.
- Wire Cal.com (`web/lib/calcom.ts`) for real slot booking.
- Wire Resend (`web/lib/resend.ts`) for the customer confirmation and
  operator alert.
- Implement `web/app/api/lead/route.ts` and `web/app/api/booking/route.ts`.
- **Demo at end of week — this is the real Phase 1 Definition of Done
  (PRD Section 11):** hand your phone to someone, have them book a
  consultation through the funnel, watch the confirmation email land, get
  the operator alert yourself, and see the lead appear on your console
  board next to your outbound prospects, workable by the same crew.

**At this point you have a real MVP.** Both lead streams work, the crew
produces trustworthy scores, and you manage it all from one board. Everything
past this line is depth, not proof-of-concept.

---

## PHASE 2 — CORE FEATURES (Sprints 6-9, lighter detail)

Per PRD Section 11, Phase 2 is roughly half the Claude Code hours of Phase 1
(17 vs 49) — expect faster sprints now that the scaffolding argument is won.

- **Sprint 6:** Outreach + follow-up skills against the real templates,
  operator-reviewed (never auto-sent, per PRD Non-Goal 2).
- **Sprint 7:** Meeting prep + proposal skills; these lean on the
  qualification data you already have from Sprint 2.
- **Sprint 8:** Report + report-pdf (`generate_pdf_report.py` for real),
  console runs view and artifact viewer.
- **Sprint 9:** ICP editor on the elicitation engine, `sync_workspace.mjs`
  reconciliation for write-back failures.

## PHASE 3 — POLISH AND LAUNCH (Sprints 10-12, lighter detail)

- **Sprint 10:** Objections, ICP tuning, competitors skill.
- **Sprint 11:** Quick snapshot command, accessibility pass on the funnel,
  error-state hardening across the console (PRD Section 10's edge cases).
- **Sprint 12:** Deployment lockdown — env vars finalized, funnel deployed
  to Vercel for real, README screenshots taken from the actual running
  console (case-study standard), CI green on every push.

---

## Weekly ritual

At the start of each sprint: re-read that sprint's goal above, out loud, to
yourself, before opening an editor. At the end: the demo line is the bar —
if you can't do the demo, the sprint isn't done, no matter how much code got
written. Carry unfinished work forward as next week's first task rather than
starting the next sprint's scope early; half of two sprints is worse than
one sprint actually finished.

If reality disagrees with a sprint's estimate — the scoring feels wrong in
Sprint 1, Supabase takes longer than expected in Sprint 3 — that's real
signal. Stop and fix the model before moving forward. That's the whole
point of proving the crew first: it's cheaper to be wrong about a scoring
algorithm in Sprint 1 than to discover it in Sprint 5 with a console built
on top of it.
