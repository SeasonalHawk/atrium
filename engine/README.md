# Lead Engine

The Lead Engine sources, enriches, verifies, dedupes, scores, and admits
leads before handing the admitted ones to the crew (`crew/`) and Supabase.
Adapted in concept from `github.com/28AXE/lead-engine` per PRD v8 Section 9
— swappable stages behind a common interface, driven by config, never
hardcoded.

**As of Sprint 6, `engine/main.py` runs the full seven-stage pipeline**:
source → enrich → signal → verify → dedup → score → admit, with an opt-in
`--write-supabase` flag to persist admitted leads.

## Stages

| Stage | Interface | Implementations |
|---|---|---|
| Sourcing | `SourcingProvider.discover(icp_profile, limit)` | `google_places.py`, `serp.py`, `list_import.py`, `claude_web.py` (disabled by default — see its docstring) |
| Enrichment | `EnrichmentProvider.enrich(candidate)` | `contact_finder.py` (Hunter.io) |
| Signals | `SignalProvider.collect(candidate)` | `hiring_signals.py` (Serper.dev job-posting search), `meta_ad_library.py` (Meta Ad Library Graph API), `google_ads_transparency.py` (Serper.dev search of the Ads Transparency Center) |
| Verification | `VerificationProvider.verify(email)` | `email_verifier.py` (ZeroBounce) |
| Dedup | `dedup.reconciler.dedupe(candidates)` | Merges by domain/company name, unions signals, keeps the richer contact and higher fit score |
| Scoring | `scoring.scorer.apply(candidate, signals_config)` | First-pass 0-100 fit score: URL/contact/email as before, plus each signal tag weighted per `engine/config/signals.yaml` (falls back to a flat per-signal weight if no config is passed) |
| Admission | `scoring.decision_gate.apply(candidate, icp_profile)` | Risky/invalid emails always held; not-found admitted only if the score clears the profile's `admissionThreshold` |
| Output | `output.supabase_writer.SupabaseWriter` | Upserts admitted leads into Supabase on `dedupeKey` |

Every stage is a small ABC in `src/core/base.py` — adding a new source is a
new file plus a `sources.yaml` entry, never a rewrite.

## Config

- `crew/config/icp.config.json` — the ICP profiles (shared with the crew,
  never duplicated here).
- `engine/config/sources.yaml` — which sourcing/enrichment/verification
  providers are enabled, rate limits.
- `engine/config/signals.yaml` — per-signal-tag scoring weights, the
  `max_total` ceiling on their combined contribution to `fit_score`, and
  which signal providers are enabled. Retune here as real admit-rate data
  comes in — never hardcode a weight in `scorer.py`.
- API keys are read directly from the environment by each provider
  (`GOOGLE_PLACES_API_KEY`, `SERPER_API_KEY`, `HUNTER_API_KEY`,
  `ZEROBOUNCE_API_KEY`, `META_AD_LIBRARY_ACCESS_TOKEN`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` — see `.env.example`). A missing key raises a
  clear `ConfigurationError` — the engine never fabricates a result when it
  can't reach a real source.
- `supabase/schema.sql` (repo root) defines the tables `SupabaseWriter`
  writes into. No Supabase project is linked yet as of Sprint 4 — run the
  schema against your own project when you provision one.

## Running it

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r engine/requirements.txt

# List-import needs no API key — reads crew/workspace/targets/*.json
python3 engine/main.py --profile embedded-executive --sources list-import

# All enabled sources (needs the relevant API keys in .env.local)
python3 engine/main.py --profile embedded-executive --limit 10

# Also persist admitted leads to Supabase
python3 engine/main.py --profile embedded-executive --sources list-import --write-supabase
```

`--profile` is an ICP profile id from `crew/config/icp.config.json`
(`founder-advisory`, `embedded-executive`, `growth-operator`,
`transformation-sprint`, `project-program-leadership`).

## Testing

```bash
source .venv/bin/activate
python3 -m pytest engine/tests/ -v
```

Every HTTP call and the one subprocess call (`claude_web.py`) is mocked in
tests — no live API keys or network access required to run the suite, and
no test spends real Claude Code usage. 90 tests as of Sprint 6.

The crew↔Supabase bridge scripts (`crew/scripts/push_status.mjs`,
`fetch_leads.mjs`) have their own Node test-runner suite:

```bash
node --test crew/scripts/*.test.mjs
```
