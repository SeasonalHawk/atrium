from src.core.models import Candidate
from src.dedup.reconciler import dedupe, dedupe_key


def test_dedupe_key_uses_domain_when_url_present():
    c = Candidate(company="Acme Corp", source="serp", company_url="https://www.acme.example/about")
    assert dedupe_key(c) == "acme.example"


def test_dedupe_key_falls_back_to_company_name():
    c = Candidate(company="  Acme   Corp  ", source="serp")
    assert dedupe_key(c) == "acme corp"


def test_dedupe_merges_duplicates_by_domain():
    a = Candidate(company="Acme", source="google-places", company_url="https://acme.example")
    b = Candidate(company="Acme Corp", source="serp", company_url="https://acme.example", contact_email="jane@acme.example")

    result = dedupe([a, b])

    assert len(result) == 1
    assert result[0].contact_email == "jane@acme.example"
    assert result[0].source == "google-places"  # first-seen source wins


def test_dedupe_preserves_distinct_companies():
    a = Candidate(company="Acme", source="serp", company_url="https://acme.example")
    b = Candidate(company="Beta", source="serp", company_url="https://beta.example")

    result = dedupe([a, b])

    assert len(result) == 2


def test_dedupe_merges_signals_without_duplicating():
    a = Candidate(company="Acme", source="serp", company_url="https://acme.example", signals=["hiring"])
    b = Candidate(company="Acme", source="google-places", company_url="https://acme.example", signals=["hiring", "funding"])

    result = dedupe([a, b])

    assert len(result) == 1
    assert sorted(result[0].signals) == ["funding", "hiring"]


def test_dedupe_keeps_higher_fit_score():
    a = Candidate(company="Acme", source="serp", company_url="https://acme.example", fit_score=40)
    b = Candidate(company="Acme", source="google-places", company_url="https://acme.example", fit_score=75)

    result = dedupe([a, b])

    assert result[0].fit_score == 75


def test_dedupe_preserves_first_seen_order():
    a = Candidate(company="Zeta", source="serp", company_url="https://zeta.example")
    b = Candidate(company="Acme", source="serp", company_url="https://acme.example")
    c = Candidate(company="Zeta", source="google-places", company_url="https://zeta.example")

    result = dedupe([a, b, c])

    assert [r.company for r in result] == ["Zeta", "Acme"]
