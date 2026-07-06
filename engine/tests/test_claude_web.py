import json
from unittest.mock import MagicMock, patch

from src.sourcing.claude_web import ClaudeWebSource

ICP_PROFILE = {
    "id": "founder-advisory",
    "name": "Founder Advisory",
    "offer": "Founder Advisory",
    "buyerTitles": ["Founder", "CEO"],
    "triggers": ["recent-founding", "first-engineering-hire"],
}


def test_build_prompt_includes_profile_fields():
    source = ClaudeWebSource()
    prompt = source.build_prompt(ICP_PROFILE, limit=5)
    assert "Founder Advisory" in prompt
    assert "Founder" in prompt and "CEO" in prompt
    assert "recent-founding" in prompt
    assert "JSON array" in prompt


@patch("src.sourcing.claude_web.subprocess.run")
def test_discover_parses_claude_cli_json_wrapper(mock_run):
    inner_reply = json.dumps([{"company": "Acme Corp", "companyUrl": "https://acme.example"}])
    mock_run.return_value = MagicMock(stdout=json.dumps({"result": inner_reply}), returncode=0)

    source = ClaudeWebSource()
    candidates = source.discover(ICP_PROFILE, limit=5)

    assert len(candidates) == 1
    assert candidates[0].company == "Acme Corp"
    assert candidates[0].source == "claude-web"
    assert candidates[0].icp_profile_id == "founder-advisory"
    mock_run.assert_called_once()
    called_args = mock_run.call_args[0][0]
    assert called_args[0] == "claude"
    assert "-p" in called_args


@patch("src.sourcing.claude_web.subprocess.run")
def test_discover_parses_bare_json_array(mock_run):
    mock_run.return_value = MagicMock(
        stdout=json.dumps([{"company": "Beta Inc", "companyUrl": "https://beta.example"}]),
        returncode=0,
    )

    source = ClaudeWebSource()
    candidates = source.discover(ICP_PROFILE, limit=5)

    assert len(candidates) == 1
    assert candidates[0].company == "Beta Inc"


@patch("src.sourcing.claude_web.subprocess.run")
def test_discover_respects_limit(mock_run):
    companies = [{"company": f"Company {i}", "companyUrl": ""} for i in range(10)]
    mock_run.return_value = MagicMock(stdout=json.dumps(companies), returncode=0)

    source = ClaudeWebSource()
    candidates = source.discover(ICP_PROFILE, limit=3)

    assert len(candidates) == 3
