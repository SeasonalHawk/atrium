import json
import textwrap

import pytest

from src.core.base import ConfigurationError
from src.core.config_loader import (
    get_icp_profile,
    is_enabled,
    load_icp_profiles,
    load_signals_config,
    load_sources_config,
    require_env,
)


@pytest.fixture
def icp_config_path(tmp_path):
    path = tmp_path / "icp.config.json"
    path.write_text(
        json.dumps(
            {
                "profiles": [
                    {"id": "profile-a", "name": "Profile A"},
                    {"id": "profile-b", "name": "Profile B"},
                ]
            }
        )
    )
    return path


@pytest.fixture
def sources_config_path(tmp_path):
    path = tmp_path / "sources.yaml"
    path.write_text(
        textwrap.dedent(
            """
            sourcing:
              google-places:
                enabled: true
              serp:
                enabled: false
            """
        )
    )
    return path


def test_load_icp_profiles(icp_config_path):
    profiles = load_icp_profiles(icp_config_path)
    assert len(profiles) == 2
    assert profiles[0]["id"] == "profile-a"


def test_get_icp_profile_found(icp_config_path):
    profile = get_icp_profile("profile-b", icp_config_path)
    assert profile["name"] == "Profile B"


def test_get_icp_profile_not_found(icp_config_path):
    with pytest.raises(KeyError):
        get_icp_profile("nonexistent", icp_config_path)


def test_load_sources_config(sources_config_path):
    config = load_sources_config(sources_config_path)
    assert config["sourcing"]["google-places"]["enabled"] is True


def test_is_enabled_true(sources_config_path):
    config = load_sources_config(sources_config_path)
    assert is_enabled("sourcing", "google-places", config) is True


def test_is_enabled_false(sources_config_path):
    config = load_sources_config(sources_config_path)
    assert is_enabled("sourcing", "serp", config) is False


def test_is_enabled_missing_provider(sources_config_path):
    config = load_sources_config(sources_config_path)
    assert is_enabled("sourcing", "claude-web", config) is False


def test_require_env_present(monkeypatch):
    monkeypatch.setenv("SOME_TEST_VAR", "value123")
    assert require_env("SOME_TEST_VAR") == "value123"


def test_require_env_missing_raises(monkeypatch):
    monkeypatch.delenv("SOME_MISSING_VAR", raising=False)
    with pytest.raises(ConfigurationError):
        require_env("SOME_MISSING_VAR")


@pytest.fixture
def signals_config_path(tmp_path):
    path = tmp_path / "signals.yaml"
    path.write_text(
        textwrap.dedent(
            """
            weights:
              active-hiring: 10
              active-advertising: 8
            max_total: 20

            providers:
              hiring:
                enabled: true
              meta-ad-library:
                enabled: false
            """
        )
    )
    return path


def test_load_signals_config(signals_config_path):
    config = load_signals_config(signals_config_path)
    assert config["weights"]["active-hiring"] == 10
    assert config["max_total"] == 20


def test_load_signals_config_providers_use_is_enabled(signals_config_path):
    config = load_signals_config(signals_config_path)
    assert is_enabled("providers", "hiring", config) is True
    assert is_enabled("providers", "meta-ad-library", config) is False
