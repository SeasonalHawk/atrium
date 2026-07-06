"""
Meta Ad Library signal provider (ROADMAP.md Sprint 6: "Meta Ad Library";
PRD v8 Section 9 Data Source Catalog: "Meta Ad Library API" -- active
advertising as a Budget/Timeline proxy, rated Green -- it's a public,
documented API, no scraping).

Real HTTP calls against Meta's public Ad Library Graph API
(https://www.facebook.com/ads/library/api/). Requires
META_AD_LIBRARY_ACCESS_TOKEN. Unit-tested with mocked HTTP responses.
"""

from typing import List

import requests

from ..core.base import SignalProvider
from ..core.config_loader import require_env
from ..core.models import Candidate

ADS_ARCHIVE_URL = "https://graph.facebook.com/v19.0/ads_archive"


class MetaAdLibrarySignal(SignalProvider):
    name = "meta-ad-library"

    def __init__(self, access_token: str = None, session: requests.Session = None):
        self.access_token = access_token or require_env("META_AD_LIBRARY_ACCESS_TOKEN")
        self.session = session or requests.Session()

    def collect(self, candidate: Candidate) -> List[str]:
        if not candidate.company:
            return []

        response = self.session.get(
            ADS_ARCHIVE_URL,
            params={
                "search_terms": candidate.company,
                "ad_reached_countries": "['US']",
                "ad_active_status": "ACTIVE",
                "access_token": self.access_token,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        return ["active-advertising"] if data.get("data") else []
