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

Current stage: inception, scaffolded, entering Phase 1 (see PRD v5 Section 11).
Source of truth for product decisions: `docs/Atrium-PRD-v5.docx`.

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
  Tailwind CSS 3. pnpm workspaces (`web`, `console`, `launcher`).
- `pnpm install` — install JS workspace deps.
- `pnpm dev:web` — run the inbound funnel locally.
- `pnpm dev:console` — run the operator console locally (port 4000).
- `pnpm lint` / `pnpm build` — across both apps; matches `.github/workflows/ci.yml`.
- `node launcher/server.mjs` — start the local launcher (or `pnpm --filter @atrium/launcher start`).
- `pip install -r crew/requirements.txt` — crew Python deps (reportlab, beautifulsoup4, requests).
- Crew commands run inside Claude Code as `/atrium <command>` once installed
  under the Claude configuration directory per the reference `install.sh`
  convention (PRD v5 Section 7).

Key directories: `web/` (public funnel, Vercel), `console/` (operator
console, local), `launcher/` (Node helper bridging console to Claude Code),
`crew/` (orchestrator, skills, agents, scripts, templates, config — installed
to the Claude config dir, not run from here directly).

## Git

GitHub account: SeasonalHawk. Repo: `atrium`. Branches: `main` (production),
`dev` (integration), `feat/*` off `dev`. Never commit directly to `main`.
Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).

## Custom Project Rules

- **Reference-crew fidelity.** Atrium adopts
  `github.com/zubair-trabzada/ai-sales-team-claude` directly — the 14
  commands, 5 agents and their weights, the 4 script CLI contracts, and the
  6 templates. Never diverge from a verified reference contract without
  first updating the PRD; if the reference repo changes, re-verify against
  a fresh clone before changing this codebase, per the PRD's own verification
  discipline (PRD v5 revision note).
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
  signal (PRD v5 Section 10, condition 6).

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
