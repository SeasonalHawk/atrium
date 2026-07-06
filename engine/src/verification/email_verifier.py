"""
Email verification provider (PRD v8 Section 9, Data Source Catalog:
"Email verification API" -- Confirm deliverability before the pipeline,
rated Green). PRD v8 Goal 2: keep the outbound bounce rate under 2% by
verifying every email before it enters the pipeline.

Real HTTP calls against ZeroBounce's validate API. Requires
ZEROBOUNCE_API_KEY. Unit-tested with mocked HTTP responses --
see engine/tests/test_email_verifier.py.
"""

import requests

from ..core.base import VerificationProvider
from ..core.config_loader import require_env
from ..core.models import VerificationResult

VALIDATE_URL = "https://api.zerobounce.net/v2/validate"

# ZeroBounce's own status vocabulary, collapsed to Atrium's three-way
# valid/risky/invalid classification (PRD v8 Section 9's Lead.emailStatus).
STATUS_MAP = {
    "valid": "valid",
    "catch-all": "risky",
    "unknown": "risky",
    "spamtrap": "invalid",
    "abuse": "invalid",
    "do_not_mail": "invalid",
    "invalid": "invalid",
}


class EmailVerifier(VerificationProvider):
    name = "email-verifier"

    def __init__(self, api_key: str = None, session: requests.Session = None):
        self.api_key = api_key or require_env("ZEROBOUNCE_API_KEY")
        self.session = session or requests.Session()

    def verify(self, email: str) -> VerificationResult:
        response = self.session.get(
            VALIDATE_URL,
            params={"api_key": self.api_key, "email": email},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        raw_status = data.get("status", "unknown")
        status = STATUS_MAP.get(raw_status, "risky")
        return VerificationResult(
            email=email,
            status=status,
            reason=data.get("sub_status", "") or raw_status,
        )
