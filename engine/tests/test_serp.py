from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.sourcing.serp import SerpSource

ICP_PROFILE = {
    "id": "embedded-executive",
    "name": "Embedded Executive",
    "triggers": ["recent-funding", "open-leadership-role"],
    "firmographics": {"stage": ["seed", "series-a"]},
}


def make_response(json_body):
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = json_body
    return response


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("SERPER_API_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        SerpSource()


def test_build_query_uses_triggers_and_stage():
    source = SerpSource(api_key="fake-key")
    query = source.build_query(ICP_PROFILE)
    assert "recent funding" in query
    assert "seed" in query and "series-a" in query


def test_discover_parses_organic_results():
    session = MagicMock()
    session.post.return_value = make_response(
        {
            "organic": [
                {"title": "Acme Corp | Home", "link": "https://acme.example"},
                {"title": "Beta Inc - About", "link": "https://beta.example"},
            ]
        }
    )
    source = SerpSource(api_key="fake-key", session=session)

    candidates = source.discover(ICP_PROFILE, limit=10)

    assert len(candidates) == 2
    assert candidates[0].company == "Acme Corp"
    assert candidates[0].company_url == "https://acme.example"
    assert candidates[0].source == "serp"


def test_discover_falls_back_to_domain_when_title_empty():
    session = MagicMock()
    session.post.return_value = make_response(
        {"organic": [{"title": "", "link": "https://www.example-co.com/page"}]}
    )
    source = SerpSource(api_key="fake-key", session=session)

    candidates = source.discover(ICP_PROFILE)

    assert candidates[0].company == "example-co.com"


def test_domain_of_strips_www():
    assert SerpSource._domain_of("https://www.foo.com/bar") == "foo.com"
    assert SerpSource._domain_of("") == "Unknown"
