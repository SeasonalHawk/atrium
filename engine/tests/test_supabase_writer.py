from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.core.models import Candidate
from src.output.supabase_writer import SupabaseWriter, _candidate_to_row


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_url(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "fake-key")
    with pytest.raises(ConfigurationError):
        SupabaseWriter()


def test_requires_service_role_key(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        SupabaseWriter()


def test_candidate_to_row_maps_fields():
    candidate = Candidate(
        company="Acme",
        source="serp",
        company_url="https://acme.example",
        contact_email="jane@acme.example",
        email_status="valid",
        icp_profile_id="embedded-executive",
        fit_score=75,
        admitted=True,
    )
    row = _candidate_to_row(candidate)

    assert row["company"] == "Acme"
    assert row["dedupeKey"] == "acme.example"
    assert row["emailStatus"] == "valid"
    assert row["admitted"] is True
    assert row["stage"] == "researched"


def test_candidate_to_row_stage_is_sourced_when_not_admitted():
    candidate = Candidate(company="Acme", source="serp", admitted=False)
    row = _candidate_to_row(candidate)
    assert row["stage"] == "sourced"


def test_write_leads_empty_list_short_circuits():
    session = MagicMock()
    writer = SupabaseWriter(url="https://x.supabase.co", service_role_key="fake-key", session=session)

    result = writer.write_leads([])

    assert result == []
    session.post.assert_not_called()


def test_write_leads_posts_to_correct_endpoint_with_upsert_headers():
    session = MagicMock()
    session.post.return_value = make_response([{"id": "abc-123", "company": "Acme"}])
    writer = SupabaseWriter(url="https://x.supabase.co/", service_role_key="fake-key", session=session)

    candidate = Candidate(company="Acme", source="serp", company_url="https://acme.example")
    result = writer.write_leads([candidate])

    assert result == [{"id": "abc-123", "company": "Acme"}]
    call = session.post.call_args
    assert call.args[0] == "https://x.supabase.co/rest/v1/leads?on_conflict=dedupeKey"
    assert call.kwargs["headers"]["apikey"] == "fake-key"
    assert "merge-duplicates" in call.kwargs["headers"]["Prefer"]
    assert call.kwargs["json"][0]["company"] == "Acme"
