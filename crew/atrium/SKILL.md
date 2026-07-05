---
name: atrium
description: Atrium orchestrator. Routes 14 commands to the correct sub-skill or agent set, applying kajiro-prompt-optimizer-pro (Auto mode) to every command intent before dispatch. Mirrors github.com/zubair-trabzada/ai-sales-team-claude's /sales orchestrator.
---

# Atrium Orchestrator

PRD v5 Section 7, "Reference incorporation, verified against the repository".

Routes: `prospect`, `quick`, `research`, `qualify`, `contacts`, `outreach`,
`followup`, `prep`, `proposal`, `objections`, `icp`, `competitors`, `report`,
`report-pdf` — plus the Atrium addition `intake`.

Every command except `quick` (handled inline, no subagents) dispatches to a
matching `crew/skills/atrium-<command>/SKILL.md`. `prospect` runs the
three-phase flow: discovery, parallel analysis (5 agents in `crew/agents/`),
synthesis (weighted composite from `crew/config/qualify.config.json`).

Before dispatch, the orchestrator always passes the command intent through
`kajiro-prompt-optimizer-pro` in Auto mode (silent, no scorecard) per PRD
Section 6, "Kajiro optimized crew prompts".

TODO Phase 1: implement command routing and the kajiro dispatch step.
