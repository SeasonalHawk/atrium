"""
Config loader (PRD v8 Section 13, Sprint 3: "Scaffold the engine, config
loader, base stage interfaces"). Reads:

- crew/config/icp.config.json  -- the ICP profiles, shared with the crew
  (single source of truth; the engine never duplicates profile data).
- engine/config/sources.yaml   -- which providers are enabled, rate limits.

Never reads API keys itself -- providers read those directly from the
environment (see .env.example) so a missing key fails loudly in the
provider that needs it, not silently here.
"""

import json
import os
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[3]
ICP_CONFIG_PATH = REPO_ROOT / "crew" / "config" / "icp.config.json"
SOURCES_CONFIG_PATH = REPO_ROOT / "engine" / "config" / "sources.yaml"
SIGNALS_CONFIG_PATH = REPO_ROOT / "engine" / "config" / "signals.yaml"


def load_icp_profiles(path: Path = ICP_CONFIG_PATH) -> list:
    """Return the list of ICP profile dicts from crew/config/icp.config.json."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["profiles"]


def get_icp_profile(profile_id: str, path: Path = ICP_CONFIG_PATH) -> dict:
    """Return one profile by id, or raise KeyError if it doesn't exist."""
    profiles = load_icp_profiles(path)
    for profile in profiles:
        if profile["id"] == profile_id:
            return profile
    raise KeyError(f"No ICP profile with id={profile_id!r}")


def load_sources_config(path: Path = SOURCES_CONFIG_PATH) -> dict:
    """Return the parsed engine/config/sources.yaml as a dict."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def is_enabled(stage: str, provider: str, config: dict = None) -> bool:
    """Check whether a given provider is enabled for a stage
    (stage is one of "sourcing", "enrichment", "verification")."""
    config = config if config is not None else load_sources_config()
    return bool(config.get(stage, {}).get(provider, {}).get("enabled", False))


def load_signals_config(path: Path = SIGNALS_CONFIG_PATH) -> dict:
    """Return the parsed engine/config/signals.yaml as a dict: per-signal-tag
    scoring weights, a max_total ceiling, and per-provider enable flags."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def require_env(var_name: str) -> str:
    """Return an environment variable's value, or raise a clear
    ConfigurationError if it's unset. Never fabricate a fallback value."""
    from .base import ConfigurationError

    value = os.environ.get(var_name)
    if not value:
        raise ConfigurationError(
            f"{var_name} is not set. Add it to .env.local (see .env.example)."
        )
    return value
