"""
First-pass fit scorer (PRD v8 Section 9: Lead.fitScore, "a first-pass fit
score from the engine"). Deliberately shallow compared to the crew's
5-agent audit -- this only decides who is worth handing to the crew at all.

Scored purely from what the sourcing/enrichment/verification stages already
found (company URL presence, a resolved contact, email deliverability),
plus whatever the signals stage detected. Signal weighting is configurable
per signal tag via engine/config/signals.yaml (Sprint 6, ROADMAP.md: "Fold
signals into scoring with configurable weights") -- callers that don't pass
a config fall back to a flat per-signal weight, preserving pre-Sprint-6
behavior for any caller that hasn't wired the config in yet.
"""

from dataclasses import replace

from ..core.models import Candidate

# Weights sum to 100 for the non-signal portion. Signal weighting is
# configurable (see signal_score below); these are only the flat-weight
# fallback used when no signals config is supplied.
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


def signal_score(signals: list, signals_config: dict = None) -> int:
    """Score a candidate's signals list. With no config, every signal tag
    is worth WEIGHT_PER_SIGNAL, capped at MAX_SIGNAL_SCORE (pre-Sprint-6
    behavior). With a signals_config (engine/config/signals.yaml's parsed
    dict), each tag is worth its configured weight (falling back to
    WEIGHT_PER_SIGNAL for an unrecognized tag), capped at the config's
    max_total."""
    if not signals_config:
        return min(len(signals) * WEIGHT_PER_SIGNAL, MAX_SIGNAL_SCORE)

    weights = signals_config.get("weights", {})
    max_total = signals_config.get("max_total", MAX_SIGNAL_SCORE)
    total = sum(weights.get(s, WEIGHT_PER_SIGNAL) for s in signals)
    return min(total, max_total)


def score(candidate: Candidate, signals_config: dict = None) -> int:
    """Return a 0-100 first-pass fit score for a candidate."""
    total = 0

    if candidate.company_url:
        total += WEIGHT_HAS_COMPANY_URL

    if candidate.contact_name or candidate.contact_email:
        total += WEIGHT_HAS_CONTACT

    total += WEIGHT_EMAIL_STATUS.get(candidate.email_status, 0)

    total += signal_score(candidate.signals, signals_config)

    return min(total, 100)


def apply(candidate: Candidate, signals_config: dict = None) -> Candidate:
    """Return a new Candidate with fit_score set. Never mutates the input."""
    return replace(candidate, fit_score=score(candidate, signals_config))
