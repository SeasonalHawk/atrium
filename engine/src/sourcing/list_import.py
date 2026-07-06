"""
List-import sourcing provider (PRD v8 Section 9). Reads the target JSON
files crew/scripts/import_list.py already wrote into crew/workspace/targets/
and turns them into Candidates. Manual, operator-provided leads are not
matched against an ICP profile the way discovered leads are -- the operator
already chose them.
"""

import json
from pathlib import Path
from typing import List

from ..core.base import SourcingProvider
from ..core.models import Candidate

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_TARGETS_DIR = REPO_ROOT / "crew" / "workspace" / "targets"


class ListImportSource(SourcingProvider):
    name = "list-import"

    def __init__(self, targets_dir: Path = None):
        self.targets_dir = Path(targets_dir) if targets_dir else DEFAULT_TARGETS_DIR

    def discover(self, icp_profile: dict, limit: int = 20) -> List[Candidate]:
        if not self.targets_dir.exists():
            return []

        candidates = []
        for path in sorted(self.targets_dir.glob("*.json"))[:limit]:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            candidates.append(
                Candidate(
                    company=data.get("company", ""),
                    source="list-import",
                    source_detail=data.get("sourceDetail", ""),
                    company_url=data.get("companyUrl"),
                    contact_name=data.get("contactName"),
                    contact_email=data.get("contactEmail"),
                    icp_profile_id=icp_profile.get("id") if icp_profile else None,
                )
            )
        return candidates
