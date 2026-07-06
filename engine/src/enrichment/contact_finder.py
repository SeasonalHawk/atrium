"""
Contact-finding enrichment provider (PRD v8 Section 9, Data Source Catalog:
"Hunter or Apollo API" -- Decision maker and business email finding,
rated Green).

Real HTTP calls against Hunter.io's Domain Search API. Requires
HUNTER_API_KEY. Unit-tested with mocked HTTP responses --
see engine/tests/test_contact_finder.py.
"""

from dataclasses import replace

import requests

from ..core.base import EnrichmentProvider
from ..core.config_loader import require_env
from ..core.models import Candidate

DOMAIN_SEARCH_URL = "https://api.hunter.io/v2/domain-search"

# Seniority levels Hunter reports, ranked so we pick the most senior contact
# available rather than the first one returned.
SENIORITY_RANK = {"executive": 0, "senior": 1, "manager": 2, "junior": 3, "": 4}


def _domain_from_url(url: str) -> str:
    domain = url.split("://", 1)[-1].split("/", 1)[0]
    return domain[4:] if domain.startswith("www.") else domain


class ContactFinderEnrichment(EnrichmentProvider):
    name = "contact-finder"

    def __init__(self, api_key: str = None, session: requests.Session = None):
        self.api_key = api_key or require_env("HUNTER_API_KEY")
        self.session = session or requests.Session()

    def enrich(self, candidate: Candidate) -> Candidate:
        if candidate.contact_email or not candidate.company_url:
            return candidate

        domain = _domain_from_url(candidate.company_url)
        response = self.session.get(
            DOMAIN_SEARCH_URL,
            params={"domain": domain, "api_key": self.api_key, "limit": 10},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        emails = data.get("data", {}).get("emails", [])
        if not emails:
            return candidate

        best = min(emails, key=lambda e: SENIORITY_RANK.get(e.get("seniority") or "", 4))
        name_parts = [best.get("first_name"), best.get("last_name")]
        contact_name = " ".join(p for p in name_parts if p) or None

        return replace(
            candidate,
            contact_name=contact_name,
            contact_email=best.get("value"),
        )
