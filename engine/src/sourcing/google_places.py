"""
Google Places sourcing provider (PRD v8 Section 9, Data Source Catalog:
"Google Places and Maps data" -- Business discovery, rated Green/official).

Real HTTP calls against the Places API Text Search endpoint. Requires
GOOGLE_PLACES_API_KEY. Unit-tested with mocked HTTP responses --
see engine/tests/test_google_places.py.
"""

from typing import List

import requests

from ..core.base import SourcingProvider
from ..core.config_loader import require_env
from ..core.models import Candidate

TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"


class GooglePlacesSource(SourcingProvider):
    name = "google-places"

    def __init__(self, api_key: str = None, session: requests.Session = None):
        self.api_key = api_key or require_env("GOOGLE_PLACES_API_KEY")
        self.session = session or requests.Session()

    def build_query(self, icp_profile: dict) -> str:
        """Turn firmographics + triggers into a Places text query."""
        industries = icp_profile.get("firmographics", {}).get("industries", [])
        offer = icp_profile.get("offer", "")
        parts = [p for p in (offer, *industries) if p]
        return " ".join(parts) or icp_profile.get("name", "companies")

    def discover(self, icp_profile: dict, limit: int = 20) -> List[Candidate]:
        query = self.build_query(icp_profile)
        response = self.session.get(
            TEXT_SEARCH_URL,
            params={"query": query, "key": self.api_key},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        status = data.get("status")
        if status not in ("OK", "ZERO_RESULTS"):
            raise RuntimeError(f"Google Places API error: {status} - {data.get('error_message', '')}")

        candidates = []
        for result in data.get("results", [])[:limit]:
            candidates.append(
                Candidate(
                    company=result.get("name", ""),
                    source=self.name,
                    source_detail=query,
                    company_url=result.get("website"),
                    icp_profile_id=icp_profile.get("id"),
                )
            )
        return candidates
