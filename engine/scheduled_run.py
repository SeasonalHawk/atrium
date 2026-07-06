#!/usr/bin/env python3
"""
Scheduled autonomous run (ROADMAP.md Sprint 8: "Scheduled autonomous run
via GitHub Actions cron"; PRD v8 Phase 3 Definition of Done: "on a
schedule, the system sources, verifies, scores, works, and drafts").
Runs the full seven-stage pipeline (main.py's run()) for every configured
ICP profile in one invocation, then checks the combined results for hot
leads. Invoked by .github/workflows/scheduled-run.yml; also runnable
locally.

Usage:
    python3 engine/scheduled_run.py --limit 10 --write-supabase
    python3 engine/scheduled_run.py --sources list-import
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import run, write_output  # noqa: E402
from src.core.base import ConfigurationError  # noqa: E402
from src.core.config_loader import load_icp_profiles  # noqa: E402
from src.notify.hot_lead import HotLeadNotifier  # noqa: E402


def run_all_profiles(limit: int, write_supabase: bool, only_sources: list = None) -> list:
    """Run the pipeline once per ICP profile in crew/config/icp.config.json,
    returning every candidate across all profiles combined."""
    all_candidates = []
    for profile in load_icp_profiles():
        print(f"--- profile: {profile['id']} ---", file=sys.stderr)
        candidates = run(profile["id"], limit, only_sources)
        write_output(candidates, write_supabase)
        all_candidates.extend(candidates)
    return all_candidates


def notify_hot_leads(candidates: list) -> int:
    """Send hot-lead notifications for the combined run, skipping gracefully
    if HOT_LEAD_WEBHOOK_URL isn't configured -- notification is additive,
    never a reason to fail a scheduled run."""
    try:
        notifier = HotLeadNotifier()
    except ConfigurationError as exc:
        print(f"Skipping hot-lead notifications: {exc}", file=sys.stderr)
        return 0

    count = notifier.notify_all(candidates)
    print(f"hot-lead notifier: sent {count} notification(s)", file=sys.stderr)
    return count


def main():
    parser = argparse.ArgumentParser(description="Run the Lead Engine across every configured ICP profile.")
    parser.add_argument("--limit", type=int, default=20, help="Max candidates per source per profile (default: 20)")
    parser.add_argument("--sources", help="Comma-separated source names to run (default: all enabled)")
    parser.add_argument("--write-supabase", action="store_true", help="Upsert admitted leads into Supabase")
    args = parser.parse_args()

    only = args.sources.split(",") if args.sources else None
    candidates = run_all_profiles(args.limit, args.write_supabase, only)
    admitted = sum(1 for c in candidates if c.admitted)
    print(f"scheduled run: {admitted} of {len(candidates)} admitted across all profiles", file=sys.stderr)

    notify_hot_leads(candidates)


if __name__ == "__main__":
    main()
