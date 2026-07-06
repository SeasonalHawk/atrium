"""
First-pass fit scorer (PRD v8 Section 9: Lead.fitScore, "a first-pass fit
score from the engine"). Deliberately shallow compared to the crew's
5-agent audit -- this only decides who is worth handing to the crew at all.

Scored purely from what the sourcing/enrichment/verification stages already
found (company URL presence, a resolved contact, email deliverability).
Ad/hiring signal weighting is Sprint 6's job (ROADMAP.md: "Fold signals into
scoring with configurable weights") -- until then `candidate.signals` is
typically empty and contributes little, by design, not by omission.
"""

from dataclasses import replace

from ..core.models import Candidate

# Weights sum to 100. Kept as module constants (not yet a config file) since
# Sprint 6 is where per-profile signal weighting actually lands -- see
# engine/config/sources.yaml's docstring-equivalent note in README.md.
WEIGHT_HAS_COMPANY_URL = 20
WEIGHT_HAS_CONTACT = 30
WEIGHT_EMAIL_STATUS = {
    "valid": 30,
    "not-found": 10,
    "risky": 5,
    "invalid": 0,
}
WEIGHT_PER_SIGNAL = 10
MAX_SIGNAL_SCORE = 20


def score(candidate: Candidate) -> int:
    """Return a 0-100 first-pass fit score for a candidate."""
    total = 0

    if candidate.company_url:
        total += WEIGHT_HAS_COMPANY_URL

    if candidate.contact_name or candidate.contact_email:
        total += WEIGHT_HAS_CONTACT

    total += WEIGHT_EMAIL_STATUS.get(candidate.email_status, 0)

    total += min(len(candidate.signals) * WEIGHT_PER_SIGNAL, MAX_SIGNAL_SCORE)

    return min(total, 100)


def apply(candidate: Candidate) -> Candidate:
    """Return a new Candidate with fit_score set. Never mutates the input."""
    return replace(candidate, fit_score=score(candidate))
