---
name: atrium-contacts
description: Contact Intelligence agent. Category Contact Access, weight 0.20. Adapted from the reference sales-contacts agent.
---

# atrium-contacts — Contact Access (20%)

Maps the buying committee, identifies decision makers, finds warm paths and
multi-threading opportunities, and collects a personalization anchor per
contact via `crew/scripts/contact_finder.py --url <url> --output json`.

Returns an `AgentFinding` for category `contactAccess`.

TODO Phase 1: implement per PRD Section 7 ProspectAgent interface.
