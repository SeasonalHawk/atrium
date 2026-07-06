# CLAUDE.md — Atrium (AltoLumo Sales Leads)

Project-scoped instructions. Read alongside the global `~/.claude/CLAUDE.md`
rules, which this file does not repeat, only extends.

## Project Identity

Atrium, code ATR. A solo operator sales console for the AltoLumo business:
inbound leads arrive through a consultation funnel, outbound leads are
sourced by pointing an AI sales crew at target companies, and both streams
land in one pipeline worked by the same crew inside Claude Code.

Owner: Kenneth Benavides, personally. Not an Irongrove project — copyright
lines use "Copyright © 2026 Kenneth Benavides. All rights reserved."

Current stage: Phase 1 (Local MVP Crew) complete. Phase 2 (Lead Engine +
Shared Pipeline) complete. Phase 3 (Autopilot, Signals, Review-Before-Send)
in progress, 6 of 14 sprints done overall — `engine/` runs the full
seven-stage pipeline (source → enrich → signal → verify → dedup → score →
admit), `supabase/schema.sql` defines the shared tables,
`crew/scripts/push_status.mjs`/`fetch_leads.mjs` bridge the crew to
Supabase for real, and the console has a real pipeline board, lead detail
view, deliverability checker, and ICP profile switcher, all sharing
TypeScript code with the funnel through `packages/shared/` (a real pnpm
workspace package, replacing a cross-app relative import flagged as a risk
in Sprint 4). Signals (hiring, Meta Ad Library, Google Ads Transparency)
fold into the fit score with configurable per-signal weights
(`engine/config/signals.yaml`). 90 pytest tests (`engine/`) + 7 pytest
tests (`crew/scripts/test_log_run.py`) + 15 Node test-runner tests
(`crew/scripts/*.test.mjs`) + 17 vitest tests (`console/lib/*.test.ts`),
all external calls mocked. Source of truth for product decisions:
`docs/Atrium-System-PRD-v8.docx` — v8 consolidates and supersedes v5,
adding the Lead Engine, MCP automation layer, review-before-send queue, and
multi-profile ICP targeting. Source of truth for sequencing: `ROADMAP.md`
(14 sprints across PRD v8's 5 phases).

## Role

Operate as a data driven principal engineer. Evidence over assertion: read
the actual code before describing it, run the actual test before declaring
it passes, cite the source of every claim (file path, PRD section, test
result). Measure before optimizing. Propose the simplest design that works,
state tradeoffs, get approval before structural changes.

## Standing Skills

`/kajiro-prompt-optimizer-pro` and `/elicitation-widget` are permanent
process skills for every task in this project, exactly as specified in the
global instructions. In Atrium they are **also product dependencies**, not
just process skills: `kajiro-prompt-optimizer-pro` is the orchestrator's
prompt-optimization layer (`crew/config/kajiro.config.json`), and
`elicitation-widget` is the shared intake engine behind the funnel, the
targets add-flow, and the ICP editor (`web/lib/elicitation.ts`). Do not
conflate the two roles when editing crew code versus editing this
conversation's own process.

## Stack and Commands

- Next.js 15, App Router, TypeScript strict mode, no `any`. React 19.
  Tailwind CSS 3. pnpm workspaces (`web`, `console`, `launcher`,
  `packages/shared`).
- `pnpm install` — install JS workspace deps.
- `pnpm dev:web` — run the inbound funnel locally.
- `pnpm dev:console` — run the operator console locally (port 4000).
- `pnpm lint` / `pnpm build` — across both apps; matches `.github/workflows/ci.yml`.
- `node launcher/server.mjs` — start the local launcher (or `pnpm --filter @atrium/launcher start`).
- `pip install -r crew/requirements.txt` — crew Python deps (reportlab, beautifulsoup4, requests).
- `bash crew/install.sh` — installs the orchestrator, 14 sub-skills, 5 agents,
  4 scripts, 6 templates, and config into `~/.claude/skills` and
  `~/.claude/agents` from this repo's `crew/` directory (no GitHub clone
  step — the source is always local). `crew/uninstall.sh` reverses it.
- Crew commands run inside Claude Code as `/atrium <command>` once installed.
  The orchestrator and all 5 agents are real, adapted content (not stubs) as
  of Sprint 1 — see `crew/atrium/SKILL.md`.
- `python3 -m venv .venv && source .venv/bin/activate && pip install -r engine/requirements.txt`
  — set up the Lead Engine's Python environment (separate from the crew's).
- `python3 engine/main.py --profile <id> --sources list-import` — run the
  engine without needing any API key (list-import only). Drop `--sources`
  to run all enabled providers once their keys are in `.env.local`.
- `python3 -m pytest engine/tests/ -v` — engine unit tests (90 as of Sprint
  6), all HTTP/subprocess calls mocked, no live credentials needed.
- `node --test crew/scripts/*.test.mjs` — bridge script tests (15 as of
  Sprint 4: `push_status.mjs`, `fetch_leads.mjs`), Supabase calls mocked.
- `python3 -m pytest crew/scripts/test_*.py -v` — crew Python script tests
  (7 as of Sprint 5: `log_run.py`'s cost logging and per-profile summary).
- `pnpm --filter @atrium/console exec vitest run` — console unit tests (17
  as of Sprint 5: `leads.ts`, `deliverability.ts`, `icp.ts`), all
  Supabase/DNS/filesystem calls injectable and mocked.
- `psql < supabase/schema.sql` (or paste into the Supabase SQL Editor) —
  create the `leads`/`lead_signals`/`artifacts`/`runs`/`icp_profiles`/
  `campaigns` tables. No Supabase project is linked yet as of Sprint 5.

Key directories: `web/` (public funnel, Vercel), `console/` (operator
console, local), `launcher/` (Node helper bridging console to Claude Code),
`packages/shared/` (TypeScript shared between `web` and `console` — the
Supabase client/types and the elicitation engine; both apps depend on it
via `workspace:*`, never a relative import across the package boundary),
`crew/` (orchestrator, skills, agents, scripts, templates, config — installed
to the Claude config dir, not run from here directly), `engine/` (Lead
Engine — sourcing, enrichment, verification, dedup, scoring, admission,
Supabase output behind swappable interfaces; see `engine/README.md`),
`supabase/` (shared schema — `schema.sql`).

## Git

GitHub account: SeasonalHawk. Repo: `atrium`. pnpm only — never `npm` or
`yarn`, never commit `package-lock.json` or `yarn.lock`.

Branches: `main` (production), `dev` (integration), `feature/*` / `fix/*` /
`mvp/*` off `dev` (never off `main`). PRs merge to `dev`. Never commit
directly to `main`. When `dev` is stable (a phase's Definition of Done is
met, not just any merged PR), merge `dev` → `main` and tag the release
`vX.Y.Z` with `git tag -a`. Conventional commits (`feat:`, `fix:`, `chore:`,
`docs:`, `refactor:`, `test:`), format `type(scope): description`.

## Custom Project Rules

- **Reference-crew fidelity.** Atrium adopts
  `github.com/zubair-trabzada/ai-sales-team-claude` directly (the crew) and
  `github.com/28AXE/lead-engine` (the Lead Engine, Phase 2+) — the 14
  commands, 5 agents and their weights, the 4 script CLI contracts, and the
  6 templates. Never diverge from a verified reference contract without
  first updating the PRD; if a reference repo changes, re-verify against a
  fresh clone before changing this codebase, per the PRD's own verification
  discipline (PRD v8 consolidation note). When adapting reference content,
  rename only product-specific identifiers (`sales-*` → `atrium-*`, `/sales`
  → `/atrium`) — never blanket-replace the word "sales," which appears
  throughout the reference prose as ordinary business vocabulary ("VP
  Sales," "sales cycle") that must survive the adaptation untouched.
- **Weights live only in config.** The five category weights
  (`companyFit` 0.25, `contactAccess` 0.20, `opportunityQuality` 0.20,
  `competitivePosition` 0.15, `outreachReadiness` 0.20) exist solely in
  `crew/config/qualify.config.json` and must always sum to 1.0. A new agent
  is a data change plus one file, never a hardcoded weight in agent logic.
- **Kajiro is always Auto mode, silent.** No scorecard or gap commentary is
  ever surfaced into a console view or a crew artifact. Behavior is tuned
  via `crew/config/kajiro.config.json`, not code.
- **Elicitation is the only intake surface.** The funnel, the targets
  add-flow, and the ICP editor all render a declared
  `ElicitationQuestion[]` inventory through the one shared engine
  (`web/lib/elicitation.ts`) — never a freeform form.
- **Evidence over fabrication.** Every scored signal (BANT, MEDDIC,
  firmographics) records a claim, a source, and a Strong/Moderate/Weak/Absent
  strength. If public data can't substantiate a claim, the agent lowers
  confidence and records what could not be found — it never invents a
  signal (PRD v8 Section 12, "thin public data lowers the fit score").

## Do Not

- Do not hardcode the five category weights anywhere outside
  `crew/config/qualify.config.json`.
- Do not send outreach automatically without operator review (PRD Non-Goal
  2 — the crew drafts into the console, the operator sends).
- Do not rebuild the crew as a hosted web service in v1 (PRD Non-Goal 4 —
  it stays Claude Code skills/agents invoked through the local launcher).
- Do not add multi-user accounts, roles, or permissions (PRD Non-Goal 1 —
  Atrium is single-operator by design in v1).
- Do not commit Supabase, Cal.com, or Resend keys. All secrets live in
  `.env.local` (gitignored), documented (without values) in `.env.example`.

## Case-Study Standard

This repo is public and pinned per the global Portfolio & Case-Study
Standard. `README.md` leads with the business problem and outcome, includes
an architecture diagram, screenshots (added once Phase 1 ships real UI), the
technologies used, and links the interactive system-model artifact built
during inception. Advance all five case-study elements each phase — do not
defer polish to the end.
