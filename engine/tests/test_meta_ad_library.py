from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.core.models import Candidate
from src.signals.meta_ad_library import MetaAdLibrarySignal


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_access_token(monkeypatch):
    monkeypatch.delenv("META_AD_LIBRARY_ACCESS_TOKEN", raising=False)
    with pytest.raises(ConfigurationError):
        MetaAdLibrarySignal()


def test_collect_detects_active_ads():
    session = MagicMock()
    session.get.return_value = make_response({"data": [{"id": "123"}]})
    provider = MetaAdLibrarySignal(access_token="fake-token", session=session)
    candidate = Candidate(company="Acme Corp", source="serp")

    assert provider.collect(candidate) == ["active-advertising"]


def test_collect_returns_empty_when_no_ads():
    session = MagicMock()
    session.get.return_value = make_response({"data": []})
    provider = MetaAdLibrarySignal(access_token="fake-token", session=session)
    candidate = Candidate(company="Acme Corp", source="serp")

    assert provider.collect(candidate) == []


def test_collect_returns_empty_without_a_company_name():
    provider = MetaAdLibrarySignal(access_token="fake-token", session=MagicMock())
    candidate = Candidate(company="", source="serp")

    assert provider.collect(candidate) == []
