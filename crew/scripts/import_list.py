#!/usr/bin/env python3
"""
List Importer — Atrium addition (no reference equivalent).
Imports a CSV of warm or conference leads into crew/workspace/targets/ as
one JSON target file per row, ready for /atrium prospect or /atrium qualify
to pick up. This is the "operator imports a list" half of Phase 1's local
MVP crew (PRD v8 Section 13, Phase 1 task "Simple CSV import of a warm or
conference list").

Expected CSV columns (header row required):
    company        (required) company name
    url            (optional) company website
    contact_name   (optional)
    contact_email  (optional)

Usage:
    python3 import_list.py <input.csv> [--source-detail "AI Summit 2026"]
    python3 import_list.py --help
"""

import argparse
import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_COLUMNS = {"company"}
KNOWN_COLUMNS = {"company", "url", "contact_name", "contact_email"}


def slugify(text):
    """Turn a company name into a filesystem-safe slug."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")
    return slug or "unnamed"


def load_rows(csv_path):
    """Read and validate the CSV, returning a list of row dicts."""
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError("CSV file has no header row")
        header = {h.strip().lower() for h in reader.fieldnames}
        missing = REQUIRED_COLUMNS - header
        if missing:
            raise ValueError(f"CSV is missing required column(s): {', '.join(sorted(missing))}")
        rows = []
        for i, raw_row in enumerate(reader, start=2):  # header is line 1
            row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items() if k}
            if not row.get("company"):
                print(f"Warning: skipping line {i}, empty company name", file=sys.stderr)
                continue
            rows.append(row)
        return rows


def row_to_target(row, source_detail):
    """Convert a validated CSV row into an Atrium target record."""
    now = datetime.now(timezone.utc).isoformat()
    target = {
        "id": slugify(row["company"]),
        "createdAt": now,
        "source": "list-import",
        "sourceDetail": source_detail,
        "company": row["company"],
        "stage": "sourced",
    }
    if row.get("url"):
        target["companyUrl"] = row["url"]
    if row.get("contact_name"):
        target["contactName"] = row["contact_name"]
    if row.get("contact_email"):
        target["contactEmail"] = row["contact_email"]
    return target


def import_list(csv_path, output_dir, source_detail):
    rows = load_rows(csv_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    written = []
    skipped_existing = []
    for row in rows:
        target = row_to_target(row, source_detail)
        out_path = output_dir / f"{target['id']}.json"
        if out_path.exists():
            skipped_existing.append(target["id"])
            continue
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(target, f, indent=2, ensure_ascii=False)
        written.append(target["id"])

    return written, skipped_existing


def main():
    parser = argparse.ArgumentParser(
        description="Import a CSV of warm or conference leads as Atrium targets.",
        epilog="Example: python3 import_list.py leads.csv --source-detail \"AI Summit 2026\"",
    )
    parser.add_argument("csv_file", help="Path to the input CSV file")
    parser.add_argument(
        "--source-detail",
        default="",
        help="Free-text provenance, e.g. a conference name (stored on every imported target)",
    )
    parser.add_argument(
        "--output-dir",
        default="crew/workspace/targets",
        help="Directory to write target JSON files into (default: crew/workspace/targets)",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv_file)
    if not csv_path.exists():
        print(f"Error: file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    try:
        written, skipped = import_list(csv_path, Path(args.output_dir), args.source_detail)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Imported {len(written)} target(s) into {args.output_dir}/")
    for target_id in written:
        print(f"  + {target_id}.json")
    if skipped:
        print(f"Skipped {len(skipped)} already-imported target(s) (file exists):")
        for target_id in skipped:
            print(f"  = {target_id}.json")


if __name__ == "__main__":
    main()
