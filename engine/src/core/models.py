"""
Shared data types for the Lead Engine (PRD v8 Section 9, Data Model).
Every stage passes Candidate objects; nothing here is a database row --
that mapping happens in engine/src/output/ (Sprint 4).
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Candidate:
    """A company the engine has found or been given, moving through the
    six-stage pipeline (PRD v8 Section 11): sourced -> enriched -> signaled
    -> verified -> scored -> admitted."""

    company: str
    source: str  # "list-import" | "google-places" | "serp" | "claude-web"
    source_detail: str = ""
    company_url: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    email_status: str = "not-found"  # "valid" | "risky" | "invalid" | "not-found"
    icp_profile_id: Optional[str] = None
    signals: list = field(default_factory=list)
    fit_score: Optional[float] = None
    admitted: bool = False


@dataclass
class VerificationResult:
    """Output of an email verification provider."""

    email: str
    status: str  # "valid" | "risky" | "invalid"
    reason: str = ""
