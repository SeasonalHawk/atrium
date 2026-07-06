"""
Admission gate (PRD v8 Section 9 / Section 12): only leads at or above the
admission threshold are written to Supabase, each with source provenance.
A risky or invalid email is held out of the pipeline with the reason
recorded, so an undeliverable address never reaches a send. A missing email
(email_status "not-found") is admitted anyway if the fit score clears the
bar, so the crew can attempt its own discovery rather than a real prospect
being silently discarded.
"""

from dataclasses import dataclass, replace

from ..core.models import Candidate

HELD_EMAIL_STATUSES = ("risky", "invalid")
DEFAULT_ADMISSION_THRESHOLD = 60


@dataclass
class AdmissionDecision:
    admitted: bool
    reason: str


def evaluate(candidate: Candidate, icp_profile: dict) -> AdmissionDecision:
    """Decide whether a scored candidate should be admitted."""
    if candidate.email_status in HELD_EMAIL_STATUSES:
        return AdmissionDecision(
            admitted=False,
            reason=f"email status is {candidate.email_status!r} -- held out of the pipeline",
        )

    if candidate.fit_score is None:
        return AdmissionDecision(admitted=False, reason="not yet scored")

    threshold = icp_profile.get("admissionThreshold", DEFAULT_ADMISSION_THRESHOLD)
    if candidate.fit_score < threshold:
        return AdmissionDecision(
            admitted=False,
            reason=f"fit_score {candidate.fit_score} is below the admission threshold {threshold}",
        )

    return AdmissionDecision(
        admitted=True,
        reason=f"fit_score {candidate.fit_score} cleared the admission threshold {threshold}",
    )


def apply(candidate: Candidate, icp_profile: dict) -> Candidate:
    """Return a new Candidate with .admitted set per evaluate()'s decision."""
    decision = evaluate(candidate, icp_profile)
    return replace(candidate, admitted=decision.admitted)
