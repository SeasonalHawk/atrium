from src.core.models import Candidate
from src.scoring.scorer import apply, score


def test_score_no_signals_at_all():
    candidate = Candidate(company="Acme", source="serp", email_status="not-found")
    assert score(candidate) == 10  # not-found email status only


def test_score_full_marks():
    candidate = Candidate(
        company="Acme",
        source="serp",
        company_url="https://acme.example",
        contact_name="Jane Doe",
        email_status="valid",
        signals=["a", "b", "c"],
    )
    # 20 (url) + 30 (contact) + 30 (valid email) + 20 (signals capped) = 100
    assert score(candidate) == 100


def test_score_invalid_email_contributes_zero():
    candidate = Candidate(
        company="Acme",
        source="serp",
        company_url="https://acme.example",
        contact_email="bad@acme.example",
        email_status="invalid",
    )
    # 20 (url) + 30 (contact) + 0 (invalid) = 50
    assert score(candidate) == 50


def test_score_signals_capped_at_max():
    candidate = Candidate(company="Acme", source="serp", signals=["a", "b", "c", "d", "e"])
    # 10 (not-found default) + min(5*10, 20) = 10 + 20 = 30
    assert score(candidate) == 30


def test_apply_sets_fit_score_without_mutating_input():
    candidate = Candidate(company="Acme", source="serp", email_status="valid")
    result = apply(candidate)

    assert result.fit_score == score(candidate)
    assert candidate.fit_score is None
