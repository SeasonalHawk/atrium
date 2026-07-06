from unittest.mock import MagicMock, patch

import scheduled_run
from src.core.base import ConfigurationError
from src.core.models import Candidate


def make_candidate(**overrides):
    defaults = {"company": "Acme Co", "source": "serp", "admitted": True, "fit_score": 50}
    defaults.update(overrides)
    return Candidate(**defaults)


def test_run_all_profiles_runs_once_per_profile_and_combines_results():
    profiles = [{"id": "profile-a"}, {"id": "profile-b"}]
    candidates_by_profile = {
        "profile-a": [make_candidate(company="A Co")],
        "profile-b": [make_candidate(company="B Co")],
    }

    with patch.object(scheduled_run, "load_icp_profiles", return_value=profiles), patch.object(
        scheduled_run, "run", side_effect=lambda profile_id, limit, only: candidates_by_profile[profile_id]
    ), patch.object(scheduled_run, "write_output") as write_output_mock:
        result = scheduled_run.run_all_profiles(limit=10, write_supabase=True)

    assert [c.company for c in result] == ["A Co", "B Co"]
    assert write_output_mock.call_count == 2
    write_output_mock.assert_any_call(candidates_by_profile["profile-a"], True)
    write_output_mock.assert_any_call(candidates_by_profile["profile-b"], True)


def test_run_all_profiles_passes_limit_and_sources_through():
    with patch.object(scheduled_run, "load_icp_profiles", return_value=[{"id": "profile-a"}]), patch.object(
        scheduled_run, "run", return_value=[]
    ) as run_mock, patch.object(scheduled_run, "write_output"):
        scheduled_run.run_all_profiles(limit=5, write_supabase=False, only_sources=["list-import"])

    run_mock.assert_called_once_with("profile-a", 5, ["list-import"])


def test_notify_hot_leads_sends_and_returns_count():
    fake_notifier = MagicMock()
    fake_notifier.notify_all.return_value = 2
    with patch.object(scheduled_run, "HotLeadNotifier", return_value=fake_notifier):
        count = scheduled_run.notify_hot_leads([make_candidate()])

    assert count == 2
    fake_notifier.notify_all.assert_called_once()


def test_notify_hot_leads_skips_gracefully_without_webhook_configured():
    with patch.object(scheduled_run, "HotLeadNotifier", side_effect=ConfigurationError("HOT_LEAD_WEBHOOK_URL not set")):
        count = scheduled_run.notify_hot_leads([make_candidate()])

    assert count == 0
