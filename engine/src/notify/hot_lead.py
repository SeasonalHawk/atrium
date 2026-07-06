"""
Hot lead notification (ROADMAP.md Sprint 8: "Hot lead notification"; PRD
v8 Phase 3 Definition of Done: "you're notified of hot leads"). Sends a
Slack-compatible incoming-webhook message when an admitted candidate's
fit_score clears a configurable threshold. Requires HOT_LEAD_WEBHOOK_URL;
skips gracefully (same pattern as every other optional stage) when not
configured -- notification sits on top of a working pipeline, never a
prerequisite for it.
"""

import os

import requests

from ..core.config_loader import require_env
from ..core.models import Candidate

DEFAULT_HOT_LEAD_THRESHOLD = 90


def is_hot_lead(candidate: Candidate, threshold: int = DEFAULT_HOT_LEAD_THRESHOLD) -> bool:
    return candidate.admitted and (candidate.fit_score or 0) >= threshold


def format_message(candidate: Candidate) -> str:
    contact = candidate.contact_name or candidate.contact_email or "no contact identified yet"
    profile = candidate.icp_profile_id or "no profile"
    return f":fire: Hot lead: *{candidate.company}* scored {candidate.fit_score}/100 ({profile}) -- {contact}"


class HotLeadNotifier:
    def __init__(self, webhook_url: str = None, session: requests.Session = None, threshold: int = None):
        self.webhook_url = webhook_url or require_env("HOT_LEAD_WEBHOOK_URL")
        self.session = session or requests.Session()
        if threshold is not None:
            self.threshold = threshold
        else:
            self.threshold = int(os.environ.get("HOT_LEAD_FIT_THRESHOLD", DEFAULT_HOT_LEAD_THRESHOLD))

    def notify(self, candidate: Candidate) -> bool:
        """Send a notification if the candidate clears the threshold. Return
        whether a notification was actually sent (never fabricates a send
        for a candidate that doesn't qualify)."""
        if not is_hot_lead(candidate, self.threshold):
            return False

        response = self.session.post(self.webhook_url, json={"text": format_message(candidate)}, timeout=10)
        response.raise_for_status()
        return True

    def notify_all(self, candidates: list) -> int:
        """Notify for every qualifying candidate; return how many notifications were sent."""
        return sum(1 for c in candidates if self.notify(c))
