from unittest.mock import MagicMock

import pytest

from src.core.base import ConfigurationError
from src.core.models import Candidate
from src.notify.hot_lead import DEFAULT_HOT_LEAD_THRESHOLD, HotLeadNotifier, format_message, is_hot_lead


def make_candidate(**overrides):
    defaults = {"company": "Acme Co", "source": "serp", "admitted": True, "fit_score": 95}
    defaults.update(overrides)
    return Candidate(**defaults)


def test_requires_webhook_url(monkeypatch):
    monkeypatch.delenv("HOT_LEAD_WEBHOOK_URL", raising=False)
    with pytest.raises(ConfigurationError):
        HotLeadNotifier()


def test_is_hot_lead_true_when_admitted_and_above_threshold():
    candidate = make_candidate(admitted=True, fit_score=95)
    assert is_hot_lead(candidate) is True


def test_is_hot_lead_false_when_not_admitted():
    candidate = make_candidate(admitted=False, fit_score=95)
    assert is_hot_lead(candidate) is False


def test_is_hot_lead_false_when_below_threshold():
    candidate = make_candidate(admitted=True, fit_score=50)
    assert is_hot_lead(candidate) is False


def test_is_hot_lead_handles_missing_fit_score():
    candidate = make_candidate(admitted=True, fit_score=None)
    assert is_hot_lead(candidate) is False


def test_is_hot_lead_respects_custom_threshold():
    candidate = make_candidate(admitted=True, fit_score=70)
    assert is_hot_lead(candidate, threshold=60) is True
    assert is_hot_lead(candidate, threshold=80) is False


def test_format_message_includes_company_score_and_contact():
    candidate = make_candidate(contact_name="Jane Doe", icp_profile_id="embedded-executive")
    message = format_message(candidate)
    assert "Acme Co" in message
    assert "95" in message
    assert "Jane Doe" in message
    assert "embedded-executive" in message


def test_format_message_handles_no_contact_identified():
    candidate = make_candidate(contact_name=None, contact_email=None)
    message = format_message(candidate)
    assert "no contact identified yet" in message


def test_notify_sends_for_a_qualifying_candidate():
    session = MagicMock()
    session.post.return_value = MagicMock(raise_for_status=MagicMock())
    notifier = HotLeadNotifier(webhook_url="https://hooks.example/webhook", session=session)

    result = notifier.notify(make_candidate(admitted=True, fit_score=95))

    assert result is True
    session.post.assert_called_once()
    call_args = session.post.call_args
    assert call_args.args[0] == "https://hooks.example/webhook"
    assert "Acme Co" in call_args.kwargs["json"]["text"]


def test_notify_does_not_send_for_a_non_qualifying_candidate():
    session = MagicMock()
    notifier = HotLeadNotifier(webhook_url="https://hooks.example/webhook", session=session)

    result = notifier.notify(make_candidate(admitted=False, fit_score=95))

    assert result is False
    session.post.assert_not_called()


def test_notify_all_counts_only_qualifying_candidates():
    session = MagicMock()
    session.post.return_value = MagicMock(raise_for_status=MagicMock())
    notifier = HotLeadNotifier(webhook_url="https://hooks.example/webhook", session=session)

    candidates = [
        make_candidate(company="Hot Co", admitted=True, fit_score=95),
        make_candidate(company="Cold Co", admitted=True, fit_score=40),
        make_candidate(company="Unqualified Co", admitted=False, fit_score=99),
    ]

    count = notifier.notify_all(candidates)

    assert count == 1
    assert session.post.call_count == 1


def test_threshold_defaults_from_env(monkeypatch):
    monkeypatch.setenv("HOT_LEAD_FIT_THRESHOLD", "70")
    notifier = HotLeadNotifier(webhook_url="https://hooks.example/webhook", session=MagicMock())
    assert notifier.threshold == 70


def test_threshold_defaults_to_constant_without_env(monkeypatch):
    monkeypatch.delenv("HOT_LEAD_FIT_THRESHOLD", raising=False)
    notifier = HotLeadNotifier(webhook_url="https://hooks.example/webhook", session=MagicMock())
    assert notifier.threshold == DEFAULT_HOT_LEAD_THRESHOLD
