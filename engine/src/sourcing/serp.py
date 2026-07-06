"""
SERP sourcing provider (PRD v8 Section 9, Data Source Catalog:
"SERP API (Serper)" -- Company discovery from web search, rated Green).

Real HTTP calls against Serper.dev's search endpoint. Requires
SERPER_API_KEY. Unit-tested with mocked HTTP responses --
see engine/tests/test_serp.py.
"""

import re
from typing import List
from urllib.parse import urlparse

import requests

from ..core.base import SourcingProvider
from ..core.config_loader import require_env
from ..core.models import Candidate

SERPER_SEARCH_URL = "https://google.serper.dev/search"


class SerpSource(SourcingProvider):
    name = "serp"

    def __init__(self, api_key: str = None, session: requests.Session = None):
        self.api_key = api_key or require_env("SERPER_API_KEY")
        self.session = session or requests.Session()

    def build_query(self, icp_profile: dict) -> str:
        """Turn triggers into a search query, e.g. "hiring Head of Engineering" seed startup."""
        triggers = icp_profile.get("triggers", [])
        trigger_terms = " OR ".join(f'"{t.replace("-", " ")}"' for t in triggers[:3])
        stage = " ".join(icp_profile.get("firmographics", {}).get("stage", []))
        return f"{trigger_terms} {stage}".strip()

    def discover(self, icp_profile: dict, limit: int = 20) -> List[Candidate]:
        query = self.build_query(icp_profile)
        response = self.session.post(
            SERPER_SEARCH_URL,
            headers={"X-API-KEY": self.api_key, "Content-Type": "application/json"},
            json={"q": query, "num": limit},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        candidates = []
        for result in data.get("organic", [])[:limit]:
            link = result.get("link", "")
            company = result.get("title", "").split("|")[0].split("-")[0].strip()
            candidates.append(
                Candidate(
                    company=company or self._domain_of(link),
                    source=self.name,
                    source_detail=query,
                    company_url=link or None,
                    icp_profile_id=icp_profile.get("id"),
                )
            )
        return candidates

    @staticmethod
    def _domain_of(url: str) -> str:
        if not url:
            return "Unknown"
        netloc = urlparse(url).netloc
        return re.sub(r"^www\.", "", netloc) or "Unknown"
