"""
Claude web-search sourcing provider (PRD v8 Section 9, Data Source Catalog:
"Claude web search and research" -- Discovery and first-pass research,
rated Green).

Design note (Sprint 3): this is the one source with no third-party HTTP
API -- it works by invoking the Claude Code CLI in headless/print mode
(`claude -p "<prompt>" --output-format json`) so a scheduled, unattended run
(Phase 3's GitHub Actions cron) can still use Claude's own web search and
research quality without a human in a chat session. Disabled by default in
engine/config/sources.yaml until Phase 3 wires the scheduled runner --
tracked as a real, callable interface now so Sprint 6+ isn't starting from
nothing, with the subprocess call itself mocked in tests
(engine/tests/test_claude_web.py) since it would otherwise spend real
Claude Code usage on every test run.
"""

import json
import subprocess
from typing import List

from ..core.base import SourcingProvider
from ..core.models import Candidate


class ClaudeWebSource(SourcingProvider):
    name = "claude-web"

    def __init__(self, claude_binary: str = "claude"):
        self.claude_binary = claude_binary

    def build_prompt(self, icp_profile: dict, limit: int) -> str:
        triggers = ", ".join(icp_profile.get("triggers", []))
        buyer_titles = ", ".join(icp_profile.get("buyerTitles", []))
        return (
            f"Find up to {limit} real companies matching this ICP profile: "
            f"{icp_profile.get('name', '')} ({icp_profile.get('offer', '')}). "
            f"Buyer titles: {buyer_titles}. Signals to look for: {triggers}. "
            'Return ONLY a JSON array of objects: '
            '{"company": str, "companyUrl": str}. No prose, no markdown fences.'
        )

    def discover(self, icp_profile: dict, limit: int = 20) -> List[Candidate]:
        prompt = self.build_prompt(icp_profile, limit)
        result = subprocess.run(
            [self.claude_binary, "-p", prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=120,
            check=True,
        )
        payload = json.loads(result.stdout)
        # Claude Code's --output-format json wraps the model's text reply;
        # the reply itself is expected to be the JSON array requested above.
        reply_text = payload["result"] if isinstance(payload, dict) and "result" in payload else result.stdout
        companies = json.loads(reply_text)

        candidates = []
        for item in companies[:limit]:
            candidates.append(
                Candidate(
                    company=item.get("company", ""),
                    source=self.name,
                    source_detail=icp_profile.get("name", ""),
                    company_url=item.get("companyUrl"),
                    icp_profile_id=icp_profile.get("id"),
                )
            )
        return candidates
