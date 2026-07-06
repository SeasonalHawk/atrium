from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.core.models import Candidate
from src.enrichment.contact_finder import ContactFinderEnrichment, _domain_from_url


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("HUNTER_API_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        ContactFinderEnrichment()


def test_domain_from_url_strips_scheme_and_www():
    assert _domain_from_url("https://www.acme.example/about") == "acme.example"
    assert _domain_from_url("http://acme.example") == "acme.example"


def test_enrich_skips_when_already_has_email():
    candidate = Candidate(company="Acme", source="serp", contact_email="existing@acme.example")
    enricher = ContactFinderEnrichment(api_key="fake-key", session=MagicMock())

    result = enricher.enrich(candidate)

    assert result.contact_email == "existing@acme.example"


def test_enrich_skips_when_no_company_url():
    candidate = Candidate(company="Acme", source="serp", company_url=None)
    enricher = ContactFinderEnrichment(api_key="fake-key", session=MagicMock())

    result = enricher.enrich(candidate)

    assert result.contact_email is None


def test_enrich_picks_most_senior_contact():
    session = MagicMock()
    session.get.return_value = make_response(
        {
            "data": {
                "emails": [
                    {"value": "jr@acme.example", "first_name": "Junior", "last_name": "Person", "seniority": "junior"},
                    {"value": "exec@acme.example", "first_name": "Exec", "last_name": "Person", "seniority": "executive"},
                ]
            }
        }
    )
    candidate = Candidate(company="Acme", source="serp", company_url="https://acme.example")
    enricher = ContactFinderEnrichment(api_key="fake-key", session=session)

    result = enricher.enrich(candidate)

    assert result.contact_email == "exec@acme.example"
    assert result.contact_name == "Exec Person"
    # original candidate is untouched
    assert candidate.contact_email is None


def test_enrich_no_emails_found_returns_unchanged():
    session = MagicMock()
    session.get.return_value = make_response({"data": {"emails": []}})
    candidate = Candidate(company="Acme", source="serp", company_url="https://acme.example")
    enricher = ContactFinderEnrichment(api_key="fake-key", session=session)

    result = enricher.enrich(candidate)

    assert result.contact_email is None
