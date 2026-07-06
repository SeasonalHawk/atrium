"""
Supabase output writer (PRD v8 Section 9: "writing admitted leads to
Supabase"). Real HTTP calls against Supabase's PostgREST REST API. Requires
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the service role key, not the
anon key -- this runs server-side, never in a browser). Upserts on
`dedupeKey` so a re-run never creates a duplicate row (PRD v8 Section 12).

Unit-tested with mocked HTTP responses -- see
engine/tests/test_supabase_writer.py. See supabase/schema.sql for the table
definition this writes into.
"""

from typing import List

import requests

from ..core.config_loader import require_env
from ..core.models import Candidate
from ..dedup.reconciler import dedupe_key


def _candidate_to_row(candidate: Candidate) -> dict:
    return {
        "dedupeKey": dedupe_key(candidate),
        "source": candidate.source,
        "sourceDetail": candidate.source_detail,
        "company": candidate.company,
        "companyUrl": candidate.company_url,
        "contactName": candidate.contact_name,
        "contactEmail": candidate.contact_email,
        "emailStatus": candidate.email_status,
        "icpProfileId": candidate.icp_profile_id,
        "fitScore": candidate.fit_score,
        "admitted": candidate.admitted,
        "stage": "sourced" if not candidate.admitted else "researched",
    }


class SupabaseWriter:
    def __init__(self, url: str = None, service_role_key: str = None, session: requests.Session = None):
        self.url = (url or require_env("SUPABASE_URL")).rstrip("/")
        self.service_role_key = service_role_key or require_env("SUPABASE_SERVICE_ROLE_KEY")
        self.session = session or requests.Session()

    def _headers(self) -> dict:
        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        }

    def write_leads(self, candidates: List[Candidate]) -> list:
        """Upsert candidates into the `leads` table, keyed on dedupeKey.
        Only admitted candidates should normally be passed here (PRD v8:
        "only leads at or above the admission threshold are written to
        Supabase"), but this method doesn't itself filter -- the caller
        (engine/main.py) is responsible for only handing it admitted leads."""
        if not candidates:
            return []

        rows = [_candidate_to_row(c) for c in candidates]
        response = self.session.post(
            f"{self.url}/rest/v1/leads?on_conflict=dedupeKey",
            headers=self._headers(),
            json=rows,
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
