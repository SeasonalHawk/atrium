from src.core.models import Candidate
from src.scoring.decision_gate import apply, evaluate

ICP_PROFILE = {"id": "embedded-executive", "admissionThreshold": 60}


def test_holds_risky_email_regardless_of_score():
    candidate = Candidate(company="Acme", source="serp", email_status="risky", fit_score=95)
    decision = evaluate(candidate, ICP_PROFILE)
    assert decision.admitted is False
    assert "risky" in decision.reason


def test_holds_invalid_email_regardless_of_score():
    candidate = Candidate(company="Acme", source="serp", email_status="invalid", fit_score=100)
    decision = evaluate(candidate, ICP_PROFILE)
    assert decision.admitted is False
    assert "invalid" in decision.reason


def test_admits_not_found_email_if_score_clears_threshold():
    candidate = Candidate(company="Acme", source="serp", email_status="not-found", fit_score=70)
    decision = evaluate(candidate, ICP_PROFILE)
    assert decision.admitted is True


def test_holds_not_found_email_if_score_below_threshold():
    candidate = Candidate(company="Acme", source="serp", email_status="not-found", fit_score=40)
    decision = evaluate(candidate, ICP_PROFILE)
    assert decision.admitted is False
    assert "below" in decision.reason


def test_admits_valid_email_above_threshold():
    candidate = Candidate(company="Acme", source="serp", email_status="valid", fit_score=61)
    decision = evaluate(candidate, ICP_PROFILE)
    assert decision.admitted is True


def test_unscored_candidate_is_never_admitted():
    candidate = Candidate(company="Acme", source="serp", email_status="valid", fit_score=None)
    decision = evaluate(candidate, ICP_PROFILE)
    assert decision.admitted is False
    assert "not yet scored" in decision.reason


def test_uses_default_threshold_when_profile_omits_it():
    candidate = Candidate(company="Acme", source="serp", email_status="valid", fit_score=65)
    decision = evaluate(candidate, {"id": "no-threshold-profile"})
    assert decision.admitted is True


def test_apply_sets_admitted_field_without_mutating_input():
    candidate = Candidate(company="Acme", source="serp", email_status="valid", fit_score=80)
    result = apply(candidate, ICP_PROFILE)

    assert result.admitted is True
    assert candidate.admitted is False
