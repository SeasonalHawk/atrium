# Lead Engine

The Lead Engine sources, enriches, and verifies leads before handing them to
the crew (`crew/`). Adapted in concept from `github.com/28AXE/lead-engine`
per PRD v8 Section 9 — swappable stages behind a common interface, driven by
config, never hardcoded.

**Sprint 3 scope** (current): sourcing → enrichment → verification.
Scoring, the admission gate, dedup, and Supabase/workspace output are
Sprint 4 — `engine/main.py` deliberately stops short of them.

## Stages

| Stage | Interface | Implementations |
|---|---|---|
| Sourcing | `SourcingProvider.discover(icp_profile, limit)` | `google_places.py`, `serp.py`, `list_import.py`, `claude_web.py` (disabled by default — see its docstring) |
| Enrichment | `EnrichmentProvider.enrich(candidate)` | `contact_finder.py` (Hunter.io) |
| Verification | `VerificationProvider.verify(email)` | `email_verifier.py` (ZeroBounce) |

Every stage is a small ABC in `src/core/base.py` — adding a new source is a
new file plus a `sources.yaml` entry, never a rewrite.

## Config

- `crew/config/icp.config.json` — the ICP profiles (shared with the crew,
  never duplicated here).
- `engine/config/sources.yaml` — which providers are enabled, rate limits.
- API keys are read directly from the environment by each provider
  (`GOOGLE_PLACES_API_KEY`, `SERPER_API_KEY`, `HUNTER_API_KEY`,
  `ZEROBOUNCE_API_KEY` — see `.env.example`). A missing key raises a clear
  `ConfigurationError` — the engine never fabricates a result when it can't
  reach a real source.

## Running it

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r engine/requirements.txt

# List-import needs no API key — reads crew/workspace/targets/*.json
python3 engine/main.py --profile embedded-executive --sources list-import

# All enabled sources (needs the relevant API keys in .env.local)
python3 engine/main.py --profile embedded-executive --limit 10
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
no test spends real Claude Code usage. 44 tests as of Sprint 3.
