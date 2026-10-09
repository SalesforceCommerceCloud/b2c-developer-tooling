---
description: An eCDN bot-traffic review is routed to the b2c-ops edge traffic runbook and SCAPI code mode (skill read first), without terminal fallbacks or rule changes. The fixture has no client secret, so calls fail at auth; only the routing is graded.
tags: [tier0, routing, scapi, runbook]
max_turns: 14
env:
  EVAL_MCP_PROJECT: sandbox-project
---

Check the eCDN traffic on my production storefront for bot activity over the last week. Tell me which sources matter and whether our rules cover them. Don't change anything.
