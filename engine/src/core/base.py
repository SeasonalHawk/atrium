"""
Base interfaces for engine stages (PRD v8 Section 9: "every engine stage
... conforms to a base interface, so adding a source ... is a new file plus
a config entry rather than a rewrite").
"""

from abc import ABC, abstractmethod
from typing import List

from .models import Candidate, VerificationResult


class SourcingProvider(ABC):
    """Finds candidate companies matching an ICP profile."""

    name: str = "unnamed-source"

    @abstractmethod
    def discover(self, icp_profile: dict, limit: int = 20) -> List[Candidate]:
        """Return up to `limit` candidates matching the given ICP profile dict
        (one entry from crew/config/icp.config.json's "profiles" array)."""
        raise NotImplementedError


class EnrichmentProvider(ABC):
    """Adds a decision-maker contact to a candidate that doesn't have one."""

    name: str = "unnamed-enrichment"

    @abstractmethod
    def enrich(self, candidate: Candidate) -> Candidate:
        """Return a new Candidate with contact_name/contact_email filled in
        where found. Never mutate the input in place."""
        raise NotImplementedError


class VerificationProvider(ABC):
    """Confirms whether an email address is deliverable."""

    name: str = "unnamed-verifier"

    @abstractmethod
    def verify(self, email: str) -> VerificationResult:
        raise NotImplementedError


class ConfigurationError(RuntimeError):
    """Raised when a provider is used without its required configuration
    (e.g. a missing API key). Never silently falls back to fabricated data --
    PRD v8's evidence-over-fabrication rule applies to the engine too."""
