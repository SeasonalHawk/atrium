"""
Dedup / reconciler (PRD v8 Section 12): "A duplicate company is detected by
the normalized dedupe key and its signals are merged onto the existing lead
rather than creating a second record or contacting twice."
"""

import re
from dataclasses import replace
from typing import List
from urllib.parse import urlparse

from ..core.models import Candidate


def dedupe_key(candidate: Candidate) -> str:
    """A normalized key: the bare domain if a URL exists, otherwise the
    lowercased, whitespace-collapsed company name. Two candidates with the
    same key are treated as the same company."""
    if candidate.company_url:
        domain = urlparse(candidate.company_url).netloc or candidate.company_url
        domain = re.sub(r"^www\.", "", domain.lower())
        if domain:
            return domain
    return re.sub(r"\s+", " ", candidate.company.strip().lower())


def _merge(existing: Candidate, incoming: Candidate) -> Candidate:
    """Merge `incoming` onto `existing`: keep the richer contact info, the
    higher fit score, and the union of signals. Never lose data either
    candidate already had."""
    merged_signals = list(existing.signals)
    for s in incoming.signals:
        if s not in merged_signals:
            merged_signals.append(s)

    return replace(
        existing,
        company_url=existing.company_url or incoming.company_url,
        contact_name=existing.contact_name or incoming.contact_name,
        contact_email=existing.contact_email or incoming.contact_email,
        email_status=existing.email_status if existing.email_status != "not-found" else incoming.email_status,
        signals=merged_signals,
        fit_score=max(
            (existing.fit_score or 0),
            (incoming.fit_score or 0),
        ) if (existing.fit_score is not None or incoming.fit_score is not None) else None,
    )


def dedupe(candidates: List[Candidate]) -> List[Candidate]:
    """Return a new list with duplicate companies merged. Order of first
    appearance is preserved."""
    seen = {}
    order = []
    for candidate in candidates:
        key = dedupe_key(candidate)
        if key in seen:
            seen[key] = _merge(seen[key], candidate)
        else:
            seen[key] = candidate
            order.append(key)
    return [seen[key] for key in order]
