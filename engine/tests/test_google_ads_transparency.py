from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.core.models import Candidate
from src.signals.google_ads_transparency import GoogleAdsTransparencySignal


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("SERPER_API_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        GoogleAdsTransparencySignal()


def test_build_query_scopes_to_ads_transparency_center():
    provider = GoogleAdsTransparencySignal(api_key="fake-key")
    candidate = Candidate(company="Acme Corp", source="serp")
    query = provider.build_query(candidate)
    assert "site:adstransparency.google.com" in query
    assert "Acme Corp" in query


def test_collect_detects_indexed_transparency_page():
    session = MagicMock()
    session.post.return_value = make_response(
        {"organic": [{"link": "https://adstransparency.google.com/advertiser/AR123"}]}
    )
    provider = GoogleAdsTransparencySignal(api_key="fake-key", session=session)
    candidate = Candidate(company="Acme Corp", source="serp")

    assert provider.collect(candidate) == ["google-ads-active"]


def test_collect_returns_empty_when_no_results():
    session = MagicMock()
    session.post.return_value = make_response({"organic": []})
    provider = GoogleAdsTransparencySignal(api_key="fake-key", session=session)
    candidate = Candidate(company="Acme Corp", source="serp")

    assert provider.collect(candidate) == []


def test_collect_returns_empty_without_a_company_name():
    provider = GoogleAdsTransparencySignal(api_key="fake-key", session=MagicMock())
    candidate = Candidate(company="", source="serp")

    assert provider.collect(candidate) == []
