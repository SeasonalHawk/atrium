"""Tests for log_run.py -- ROADMAP.md Sprint 5, campaign cost metering.
Run with: python3 -m pytest crew/scripts/test_log_run.py -v
"""

import json

from log_run import append_entry, print_summary, read_entries, summarize_by_profile


def test_append_entry_records_icp_profile(tmp_path):
    log_path = tmp_path / "cost-log.jsonl"
    entry = append_entry(log_path, "prospect", "Acme Co", 0.42, 1000, "", "embedded-executive")
    assert entry["icpProfile"] == "embedded-executive"

    entries = read_entries(log_path)
    assert len(entries) == 1
    assert entries[0]["icpProfile"] == "embedded-executive"


def test_append_entry_omits_icp_profile_when_not_given(tmp_path):
    log_path = tmp_path / "cost-log.jsonl"
    entry = append_entry(log_path, "quick", "Acme Co", None, None, "")
    assert "icpProfile" not in entry


def test_summarize_by_profile_groups_and_totals_cost():
    entries = [
        {"command": "prospect", "costUsd": 1.0, "icpProfile": "embedded-executive"},
        {"command": "prospect", "costUsd": 2.0, "icpProfile": "embedded-executive"},
        {"command": "qualify", "costUsd": 0.5, "icpProfile": "founder-advisory"},
        {"command": "quick"},  # no icpProfile, no cost
    ]
    by_profile = summarize_by_profile(entries)

    assert by_profile["embedded-executive"]["count"] == 2
    assert by_profile["embedded-executive"]["cost"] == 3.0
    assert by_profile["embedded-executive"]["costed"] == 2
    assert by_profile["founder-advisory"]["count"] == 1
    assert by_profile["founder-advisory"]["cost"] == 0.5
    assert by_profile["unassigned"]["count"] == 1
    assert by_profile["unassigned"]["costed"] == 0


def test_summarize_by_profile_returns_empty_dict_for_no_entries():
    assert summarize_by_profile([]) == {}


def test_print_summary_includes_profile_breakdown(tmp_path, capsys):
    log_path = tmp_path / "cost-log.jsonl"
    append_entry(log_path, "prospect", "Acme Co", 1.0, 1000, "", "embedded-executive")
    append_entry(log_path, "qualify", "Beta Inc", 0.5, 500, "", "founder-advisory")

    print_summary(log_path)
    out = capsys.readouterr().out

    assert "By ICP profile:" in out
    assert "embedded-executive" in out
    assert "founder-advisory" in out


def test_read_entries_handles_missing_file(tmp_path):
    assert read_entries(tmp_path / "missing.jsonl") == []


def test_read_entries_skips_malformed_lines(tmp_path):
    log_path = tmp_path / "cost-log.jsonl"
    log_path.write_text('{"command": "prospect"}\nnot json\n{"command": "quick"}\n')
    entries = read_entries(log_path)
    assert len(entries) == 2
    assert entries[0]["command"] == "prospect"
    assert entries[1]["command"] == "quick"
