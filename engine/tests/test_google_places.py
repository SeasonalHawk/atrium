from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.sourcing.google_places import GooglePlacesSource

ICP_PROFILE = {
    "id": "embedded-executive",
    "name": "Embedded Executive",
    "offer": "Embedded Executive",
    "firmographics": {"industries": ["SaaS"]},
}


def make_response(json_body, status_code=200):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_body
    response.raise_for_status = MagicMock()
    return response


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)
    with pytest.raises(ConfigurationError):
        GooglePlacesSource()


def test_build_query_combines_offer_and_industries():
    source = GooglePlacesSource(api_key="fake-key")
    query = source.build_query(ICP_PROFILE)
    assert "Embedded Executive" in query
    assert "SaaS" in query


def test_discover_parses_results():
    session = MagicMock()
    session.get.return_value = make_response(
        {
            "status": "OK",
            "results": [
                {"name": "Acme Corp", "website": "https://acme.example"},
                {"name": "Beta Inc", "website": "https://beta.example"},
            ],
        }
    )
    source = GooglePlacesSource(api_key="fake-key", session=session)

    candidates = source.discover(ICP_PROFILE, limit=10)

    assert len(candidates) == 2
    assert candidates[0].company == "Acme Corp"
    assert candidates[0].company_url == "https://acme.example"
    assert candidates[0].source == "google-places"
    assert candidates[0].icp_profile_id == "embedded-executive"


def test_discover_respects_limit():
    session = MagicMock()
    session.get.return_value = make_response(
        {
            "status": "OK",
            "results": [{"name": f"Company {i}", "website": ""} for i in range(10)],
        }
    )
    source = GooglePlacesSource(api_key="fake-key", session=session)

    candidates = source.discover(ICP_PROFILE, limit=3)

    assert len(candidates) == 3


def test_discover_zero_results_returns_empty():
    session = MagicMock()
    session.get.return_value = make_response({"status": "ZERO_RESULTS", "results": []})
    source = GooglePlacesSource(api_key="fake-key", session=session)

    candidates = source.discover(ICP_PROFILE)

    assert candidates == []


def test_discover_raises_on_api_error():
    session = MagicMock()
    session.get.return_value = make_response(
        {"status": "REQUEST_DENIED", "error_message": "bad key"}
    )
    source = GooglePlacesSource(api_key="fake-key", session=session)

    with pytest.raises(RuntimeError, match="REQUEST_DENIED"):
        source.discover(ICP_PROFILE)
