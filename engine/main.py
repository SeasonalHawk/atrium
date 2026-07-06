#!/usr/bin/env python3
"""
Lead Engine — Atrium addition (adapted concept from 28AXE/lead-engine,
PRD v8 Section 9). Seven-stage pipeline: sourcing -> enrichment -> signals
-> verification -> dedup -> scoring/admission -> output. Signals (Meta Ad
Library, Google Ads Transparency, hiring) landed in Sprint 6; every stage
runs, only --write-supabase actually persists (opt-in, since most
development still runs without a live Supabase project).

Usage:
    python3 engine/main.py --profile embedded-executive --limit 10
    python3 engine/main.py --profile embedded-executive --sources list-import
    python3 engine/main.py --profile embedded-executive --sources list-import --write-supabase
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.core.base import ConfigurationError
from src.core.config_loader import get_icp_profile, is_enabled, load_signals_config, load_sources_config
from src.dedup.reconciler import dedupe
from src.enrichment.contact_finder import ContactFinderEnrichment
from src.output.supabase_writer import SupabaseWriter
from src.scoring import decision_gate, scorer
from src.signals.google_ads_transparency import GoogleAdsTransparencySignal
from src.signals.hiring_signals import HiringSignalsProvider
from src.signals.meta_ad_library import MetaAdLibrarySignal
from src.sourcing.google_places import GooglePlacesSource
from src.sourcing.list_import import ListImportSource
from src.sourcing.serp import SerpSource
from src.verification.email_verifier import EmailVerifier

SOURCING_PROVIDERS = {
    "google-places": GooglePlacesSource,
    "serp": SerpSource,
    "list-import": ListImportSource,
}

SIGNAL_PROVIDERS = {
    "hiring": HiringSignalsProvider,
    "meta-ad-library": MetaAdLibrarySignal,
    "google-ads-transparency": GoogleAdsTransparencySignal,
}


def build_sourcing_providers(config: dict, only: list = None):
    providers = []
    for source_name, provider_cls in SOURCING_PROVIDERS.items():
        if only and source_name not in only:
            continue
        if not is_enabled("sourcing", source_name, config):
            continue
        try:
            providers.append(provider_cls())
        except ConfigurationError as exc:
            print(f"Skipping {source_name}: {exc}", file=sys.stderr)
    return providers


def run(profile_id: str, limit: int, only_sources: list = None):
    profile = get_icp_profile(profile_id)
    config = load_sources_config()

    # Stage 1: sourcing
    candidates = []
    for provider in build_sourcing_providers(config, only_sources):
        try:
            found = provider.discover(profile, limit=limit)
            print(f"{provider.name}: found {len(found)} candidate(s)", file=sys.stderr)
            candidates.extend(found)
        except Exception as exc:
            print(f"{provider.name}: sourcing failed - {exc}", file=sys.stderr)

    # Stage 2: enrichment
    if is_enabled("enrichment", "contact-finder", config):
        try:
            enricher = ContactFinderEnrichment()
            candidates = [enricher.enrich(c) for c in candidates]
        except ConfigurationError as exc:
            print(f"Skipping contact-finder enrichment: {exc}", file=sys.stderr)

    # Stage 3: signals (Sprint 6 — Meta Ad Library, Google Ads Transparency, hiring)
    signals_config = load_signals_config()
    for signal_name, provider_cls in SIGNAL_PROVIDERS.items():
        if not is_enabled("providers", signal_name, signals_config):
            continue
        try:
            provider = provider_cls()
            for c in candidates:
                c.signals.extend(provider.collect(c))
        except ConfigurationError as exc:
            print(f"Skipping {signal_name} signal: {exc}", file=sys.stderr)

    # Stage 4: verification
    if is_enabled("verification", "email-verifier", config):
        try:
            verifier = EmailVerifier()
            for c in candidates:
                if c.contact_email:
                    result = verifier.verify(c.contact_email)
                    c.email_status = result.status
        except ConfigurationError as exc:
            print(f"Skipping email verification: {exc}", file=sys.stderr)

    # Stage 5: dedup
    before = len(candidates)
    candidates = dedupe(candidates)
    if before != len(candidates):
        print(f"dedup: merged {before} candidate(s) into {len(candidates)}", file=sys.stderr)

    # Stage 6: scoring + admission gate
    candidates = [scorer.apply(c, signals_config) for c in candidates]
    candidates = [decision_gate.apply(c, profile) for c in candidates]
    admitted_count = sum(1 for c in candidates if c.admitted)
    print(f"admission gate: {admitted_count} of {len(candidates)} admitted", file=sys.stderr)

    return candidates


def write_output(candidates, write_supabase: bool):
    if not write_supabase:
        return
    admitted = [c for c in candidates if c.admitted]
    try:
        writer = SupabaseWriter()
        result = writer.write_leads(admitted)
        print(f"Supabase: wrote {len(result)} admitted lead(s)", file=sys.stderr)
    except ConfigurationError as exc:
        print(f"Skipping Supabase write: {exc}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Lead Engine — sourcing through admission gate (Sprint 4 scope).")
    parser.add_argument("--profile", required=True, help="ICP profile id from crew/config/icp.config.json")
    parser.add_argument("--limit", type=int, default=20, help="Max candidates per source (default: 20)")
    parser.add_argument("--sources", help="Comma-separated source names to run (default: all enabled)")
    parser.add_argument("--write-supabase", action="store_true", help="Upsert admitted leads into Supabase (requires SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)")
    args = parser.parse_args()

    only = args.sources.split(",") if args.sources else None
    candidates = run(args.profile, args.limit, only)
    write_output(candidates, args.write_supabase)

    print(json.dumps([c.__dict__ for c in candidates], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
