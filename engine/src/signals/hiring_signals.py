"""
Hiring-signal provider (ROADMAP.md Sprint 6: "hiring signals"; PRD v8
Section 9 Data Source Catalog names hiring velocity as a Timeline/Budget
proxy). Reuses the same Serper.dev search endpoint as sourcing/serp.py --
a web search for active job postings, not a dedicated jobs API. Requires
SERPER_API_KEY. Unit-tested with mocked HTTP responses.
"""

from typing import List

import requests

from ..core.base import SignalProvider
from ..core.config_loader import require_env
from ..core.models import Candidate

SERPER_SEARCH_URL = "https://google.serper.dev/search"

# Domains/keywords that indicate an organic result is an active job posting
# rather than an unrelated mention of the company.
JOB_POSTING_MARKERS = ("linkedin.com/jobs", "indeed.com", "greenhouse.io", "lever.co", "careers")


class HiringSignalsProvider(SignalProvider):
    name = "hiring"

    def __init__(self, api_key: str = None, session: requests.Session = None):
        self.api_key = api_key or require_env("SERPER_API_KEY")
        self.session = session or requests.Session()

    def build_query(self, candidate: Candidate) -> str:
        return f'"{candidate.company}" hiring careers jobs'

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

        for result in data.get("organic", []):
            link = result.get("link", "").lower()
            if any(marker in link for marker in JOB_POSTING_MARKERS):
                return ["active-hiring"]
        return []
