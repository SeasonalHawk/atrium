#!/usr/bin/env python3
"""
Run Cost Logger — Atrium addition (no reference equivalent).
Per-lead and per-audit cost instrumentation (PRD v8 Section 13, Phase 1:
"Instrument per-lead and per-audit cost logging"). Appends one JSON line
per crew run to crew/workspace/cost-log.jsonl so Phase 2's economics model
(PRD v8 Section 15) gets measured data instead of another assumption.

Usage:
    python3 log_run.py --command prospect --target "Resend" --cost-usd 0.45
    python3 log_run.py --command qualify --target "Resend" --tokens 8200
    python3 log_run.py --summary
    python3 log_run.py --help
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_LOG_PATH = Path("crew/workspace/cost-log.jsonl")


def append_entry(log_path, command, target, cost_usd, tokens, note, icp_profile=None):
    log_path.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "command": command,
        "target": target,
    }
    if cost_usd is not None:
        entry["costUsd"] = cost_usd
    if tokens is not None:
        entry["tokens"] = tokens
    if note:
        entry["note"] = note
    if icp_profile:
        entry["icpProfile"] = icp_profile
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def read_entries(log_path):
    if not log_path.exists():
        return []
    entries = []
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def print_summary(log_path):
    entries = read_entries(log_path)
    if not entries:
        print("No runs logged yet.")
        return

    by_command = {}
    total_cost = 0.0
    costed_runs = 0
    for e in entries:
        cmd = e.get("command", "unknown")
        by_command.setdefault(cmd, {"count": 0, "cost": 0.0, "costed": 0})
        by_command[cmd]["count"] += 1
        if "costUsd" in e:
            by_command[cmd]["cost"] += e["costUsd"]
            by_command[cmd]["costed"] += 1
            total_cost += e["costUsd"]
            costed_runs += 1

    print(f"Total runs logged: {len(entries)}")
    print(f"Runs with a recorded cost: {costed_runs}")
    print(f"Total recorded cost: ${total_cost:.4f}")
    if costed_runs:
        print(f"Average cost per costed run: ${total_cost / costed_runs:.4f}")
    print()
    print("By command:")
    for cmd, stats in sorted(by_command.items()):
        avg = f"${stats['cost'] / stats['costed']:.4f}" if stats["costed"] else "n/a"
        print(f"  {cmd:12s} runs={stats['count']:<4d} costed={stats['costed']:<4d} avg_cost={avg}")

    by_profile = summarize_by_profile(entries)
    if by_profile:
        print()
        print("By ICP profile:")
        for profile, stats in sorted(by_profile.items()):
            avg = f"${stats['cost'] / stats['costed']:.4f}" if stats["costed"] else "n/a"
            print(f"  {profile:24s} runs={stats['count']:<4d} costed={stats['costed']:<4d} avg_cost={avg}")


def summarize_by_profile(entries):
    """Group logged runs by icpProfile -- ROADMAP.md Sprint 5, 'Campaign cost
    metering, cost per campaign per profile'. Entries without an icpProfile
    (e.g. runs logged before Sprint 5, or manual/no-profile runs) are grouped
    under 'unassigned' rather than dropped, so totals still reconcile with
    the command-level summary above."""
    by_profile = {}
    for e in entries:
        profile = e.get("icpProfile", "unassigned")
        by_profile.setdefault(profile, {"count": 0, "cost": 0.0, "costed": 0})
        by_profile[profile]["count"] += 1
        if "costUsd" in e:
            by_profile[profile]["cost"] += e["costUsd"]
            by_profile[profile]["costed"] += 1
    return by_profile


def main():
    parser = argparse.ArgumentParser(
        description="Log a crew run's cost/token usage, or print a summary.",
        epilog='Example: python3 log_run.py --command prospect --target "Resend" --cost-usd 0.45',
    )
    parser.add_argument("--command", help="Atrium command that ran, e.g. prospect, qualify, quick")
    parser.add_argument("--target", help="Company or lead the run targeted")
    parser.add_argument("--cost-usd", type=float, default=None, help="Estimated or measured cost in USD")
    parser.add_argument("--tokens", type=int, default=None, help="Token count, if known")
    parser.add_argument("--note", default="", help="Free-text note")
    parser.add_argument("--icp-profile", default=None, help="ICP profile id this run targeted, e.g. embedded-executive")
    parser.add_argument("--log-path", default=str(DEFAULT_LOG_PATH), help=f"Log file path (default: {DEFAULT_LOG_PATH})")
    parser.add_argument("--summary", action="store_true", help="Print aggregate stats instead of logging a run")
    args = parser.parse_args()

    log_path = Path(args.log_path)

    if args.summary:
        print_summary(log_path)
        return

    if not args.command or not args.target:
        print("Error: --command and --target are required unless --summary is given.", file=sys.stderr)
        sys.exit(1)

    entry = append_entry(log_path, args.command, args.target, args.cost_usd, args.tokens, args.note, args.icp_profile)
    print(f"Logged: {json.dumps(entry, ensure_ascii=False)}")


if __name__ == "__main__":
    main()
