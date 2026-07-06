"""
Google Ads Transparency signal provider (ROADMAP.md Sprint 6: "Google Ads
Transparency"; PRD v8 Section 9 Data Source Catalog: active Google
advertising as a Budget/Timeline proxy). The Ads Transparency Center has no
stable public API (PRD v8's own rule: real integrations only, never an
undocumented scrape) -- so, like sourcing/serp.py, this queries Serper.dev
for indexed Ads Transparency Center pages mentioning the company. Requires
SERPER_API_KEY. Unit-tested with mocked HTTP responses.
"""

from typing import List

import requests

from ..core.base import SignalProvider
from ..core.config_loader import require_env
from ..core.models import Candidate

SERPER_SEARCH_URL = "https://google.serper.dev/search"


class GoogleAdsTransparencySignal(SignalProvider):
    name = "google-ads-transparency"

    def __init__(self, api_key: str = None, session: requests.Session = None):
        self.api_key = api_key or require_env("SERPER_API_KEY")
        self.session = session or requests.Session()

    def build_query(self, candidate: Candidate) -> str:
        return f'site:adstransparency.google.com "{candidate.company}"'

    def collect(self, candidate: Candidate) -> List[str]:
        if not candidate.company:
            return []

        query = self.build_query(candidate)
        response = self.session.post(
            SERPER_SEARCH_URL,
            headers={"X-API-KEY": self.api_key, "Content-Type": "application/json"},
            json={"q": query, "num": 10},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        return ["google-ads-active"] if data.get("organic") else []
