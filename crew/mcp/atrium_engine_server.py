#!/usr/bin/env python3
"""
Atrium Engine MCP server (ROADMAP.md Sprint 7: "Custom MCP servers:
places, email finder, verifier, signals"; PRD v8 Section 9's MCP
automation layer). Exposes the Lead Engine's already-tested providers as
MCP tools so a Claude Code agent can call them directly instead of
shelling out to engine/main.py for a single lookup.

Every tool wraps a real provider (engine/src/sourcing/google_places.py,
enrichment/contact_finder.py, verification/email_verifier.py, signals/*);
none fabricates a result. A missing API key surfaces the provider's own
ConfigurationError message as the tool's error (evidence over
fabrication, PRD v8 Section 12) -- except collect_signals, which skips a
provider with a missing key the same way engine/main.py's signals stage
does, since the caller asked for "whatever signals are collectible," not
one specific provider.

Run: python3 crew/mcp/atrium_engine_server.py
"""

import sys
from dataclasses import asdict
from pathlib import Path

ENGINE_ROOT = Path(__file__).resolve().parents[2] / "engine"
sys.path.insert(0, str(ENGINE_ROOT))

from mcp.server.fastmcp import FastMCP  # noqa: E402

from src.core.base import ConfigurationError  # noqa: E402
from src.core.models import Candidate  # noqa: E402
from src.enrichment.contact_finder import ContactFinderEnrichment  # noqa: E402
from src.signals.google_ads_transparency import GoogleAdsTransparencySignal  # noqa: E402
from src.signals.hiring_signals import HiringSignalsProvider  # noqa: E402
from src.signals.meta_ad_library import MetaAdLibrarySignal  # noqa: E402
from src.sourcing.google_places import GooglePlacesSource  # noqa: E402
from src.verification.email_verifier import EmailVerifier  # noqa: E402

mcp = FastMCP("atrium-engine")


def search_places(query: str, limit: int = 10) -> list:
    """Find companies matching a Google Places text search query.
    Requires GOOGLE_PLACES_API_KEY."""
    provider = GooglePlacesSource()
    profile = {"offer": query, "firmographics": {}, "name": query}
    candidates = provider.discover(profile, limit=limit)
    return [asdict(c) for c in candidates]


def find_contact_email(company: str, company_url: str) -> dict:
    """Find a decision-maker contact name/email for a company's domain.
    Requires HUNTER_API_KEY."""
    provider = ContactFinderEnrichment()
    candidate = Candidate(company=company, source="mcp", company_url=company_url)
    result = provider.enrich(candidate)
    return {"contact_name": result.contact_name, "contact_email": result.contact_email}


def verify_email(email: str) -> dict:
    """Verify whether an email address is deliverable (valid/risky/invalid).
    Requires ZEROBOUNCE_API_KEY."""
    provider = EmailVerifier()
    return asdict(provider.verify(email))


def collect_signals(company: str) -> list:
    """Collect buying-intent signals for a company: active hiring, Meta Ad
    Library ads, and Google Ads Transparency activity. Silently skips any
    provider whose API key isn't configured, returning whatever signals
    the configured providers found."""
    candidate = Candidate(company=company, source="mcp")
    signals = []
    # Referenced by name (not a module-level tuple of classes) so tests can
    # patch each provider independently with unittest.mock.patch.object.
    for provider_cls in (HiringSignalsProvider, MetaAdLibrarySignal, GoogleAdsTransparencySignal):
        try:
            provider = provider_cls()
            signals.extend(provider.collect(candidate))
        except ConfigurationError:
            continue
    return signals


mcp.tool()(search_places)
mcp.tool()(find_contact_email)
mcp.tool()(verify_email)
mcp.tool()(collect_signals)


if __name__ == "__main__":
    mcp.run()
