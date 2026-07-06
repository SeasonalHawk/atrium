"""Tests for the Atrium Engine MCP server's tool functions -- ROADMAP.md
Sprint 7. Each tool wraps an already-tested engine provider; these tests
patch the provider classes directly rather than re-testing HTTP behavior
already covered by engine/tests/. Run with:
    python3 -m pytest crew/mcp/test_atrium_engine_server.py -v
Importing atrium_engine_server puts engine/ on sys.path as a side effect
(same as the server itself does at import time), so the src.* imports
below resolve without any separate path setup.
"""

from unittest.mock import MagicMock, patch

import atrium_engine_server as server
from src.core.base import ConfigurationError
from src.core.models import Candidate, VerificationResult


def test_search_places_wraps_google_places_source():
    fake_provider = MagicMock()
    fake_provider.discover.return_value = [
        Candidate(company="Acme Co", source="google-places", company_url="https://acme.example")
    ]
    with patch.object(server, "GooglePlacesSource", return_value=fake_provider):
        result = server.search_places("AI consulting", limit=5)

    assert result == [
        {
            "company": "Acme Co",
            "source": "google-places",
            "source_detail": "",
            "company_url": "https://acme.example",
            "contact_name": None,
            "contact_email": None,
            "email_status": "not-found",
            "icp_profile_id": None,
            "signals": [],
            "fit_score": None,
            "admitted": False,
        }
    ]
    fake_provider.discover.assert_called_once()


def test_find_contact_email_wraps_contact_finder():
    fake_provider = MagicMock()
    fake_provider.enrich.return_value = Candidate(
        company="Acme Co", source="mcp", contact_name="Jane Doe", contact_email="jane@acme.example"
    )
    with patch.object(server, "ContactFinderEnrichment", return_value=fake_provider):
        result = server.find_contact_email("Acme Co", "https://acme.example")

    assert result == {"contact_name": "Jane Doe", "contact_email": "jane@acme.example"}


def test_verify_email_wraps_email_verifier():
    fake_provider = MagicMock()
    fake_provider.verify.return_value = VerificationResult(email="jane@acme.example", status="valid", reason="")
    with patch.object(server, "EmailVerifier", return_value=fake_provider):
        result = server.verify_email("jane@acme.example")

    assert result == {"email": "jane@acme.example", "status": "valid", "reason": ""}


def test_collect_signals_aggregates_across_providers():
    hiring = MagicMock()
    hiring.collect.return_value = ["active-hiring"]
    meta = MagicMock()
    meta.collect.return_value = ["active-advertising"]
    google_ads = MagicMock()
    google_ads.collect.return_value = []

    with patch.object(server, "HiringSignalsProvider", return_value=hiring), patch.object(
        server, "MetaAdLibrarySignal", return_value=meta
    ), patch.object(server, "GoogleAdsTransparencySignal", return_value=google_ads):
        result = server.collect_signals("Acme Co")

    assert result == ["active-hiring", "active-advertising"]


def test_collect_signals_skips_providers_missing_configuration():
    hiring = MagicMock()
    hiring.collect.return_value = ["active-hiring"]

    with patch.object(server, "HiringSignalsProvider", return_value=hiring), patch.object(
        server, "MetaAdLibrarySignal", side_effect=ConfigurationError("META_AD_LIBRARY_ACCESS_TOKEN not set")
    ), patch.object(server, "GoogleAdsTransparencySignal", side_effect=ConfigurationError("SERPER_API_KEY not set")):
        result = server.collect_signals("Acme Co")

    assert result == ["active-hiring"]
