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


def test_score_uses_configured_signal_weights_when_given():
    signals_config = {"weights": {"active-hiring": 10, "active-advertising": 8}, "max_total": 20}
    candidate = Candidate(company="Acme", source="serp", signals=["active-hiring", "active-advertising"])
    # 10 (not-found default) + min(10+8, 20) = 10 + 18 = 28
    assert score(candidate, signals_config) == 28


def test_score_caps_configured_signal_weights_at_max_total():
    signals_config = {"weights": {"active-hiring": 10, "active-advertising": 8}, "max_total": 12}
    candidate = Candidate(company="Acme", source="serp", signals=["active-hiring", "active-advertising"])
    # 10 (not-found default) + min(10+8, 12) = 10 + 12 = 22
    assert score(candidate, signals_config) == 22


def test_score_falls_back_to_flat_weight_for_unrecognized_signal_tag():
    signals_config = {"weights": {"active-hiring": 10}, "max_total": 20}
    candidate = Candidate(company="Acme", source="serp", signals=["some-unknown-tag"])
    # 10 (not-found default) + min(10 flat-weight fallback, 20) = 10 + 10 = 20
    assert score(candidate, signals_config) == 20


def test_apply_passes_signals_config_through():
    signals_config = {"weights": {"active-hiring": 10}, "max_total": 20}
    candidate = Candidate(company="Acme", source="serp", signals=["active-hiring"])
    result = apply(candidate, signals_config)
    assert result.fit_score == score(candidate, signals_config)
