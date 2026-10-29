---
description: An external-service failure is routed to the b2c-ops integration runbook and the metrics signals catalog, then to metrics_get, without terminal fallbacks or changes. The fixture has no client secret, so metrics calls fail at auth; only the routing is graded.
tags: [tier0, routing, metrics, runbook]
max_turns: 14
env:
  EVAL_MCP_PROJECT: sandbox-project
---

Since this morning our storefront's calls to an external tax provider seem to be timing out or failing on production. Check whether it's them or us and when it started. Don't change anything.
