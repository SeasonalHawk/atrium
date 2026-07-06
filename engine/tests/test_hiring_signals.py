from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.core.models import Candidate
from src.signals.hiring_signals import HiringSignalsProvider


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("SERPER_API_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        HiringSignalsProvider()


def test_build_query_uses_company_name():
    provider = HiringSignalsProvider(api_key="fake-key")
    candidate = Candidate(company="Acme Corp", source="serp")
    assert "Acme Corp" in provider.build_query(candidate)


def test_collect_detects_job_posting_result():
    session = MagicMock()
    session.post.return_value = make_response(
        {"organic": [{"link": "https://www.linkedin.com/jobs/view/1234"}]}
    )
    provider = HiringSignalsProvider(api_key="fake-key", session=session)
    candidate = Candidate(company="Acme Corp", source="serp")

    assert provider.collect(candidate) == ["active-hiring"]


def test_collect_returns_empty_when_no_job_markers():
    session = MagicMock()
    session.post.return_value = make_response(
        {"organic": [{"link": "https://acme.example/about"}]}
    )
    provider = HiringSignalsProvider(api_key="fake-key", session=session)
    candidate = Candidate(company="Acme Corp", source="serp")

    assert provider.collect(candidate) == []


def test_collect_returns_empty_without_a_company_name():
    provider = HiringSignalsProvider(api_key="fake-key", session=MagicMock())
    candidate = Candidate(company="", source="serp")

    assert provider.collect(candidate) == []
