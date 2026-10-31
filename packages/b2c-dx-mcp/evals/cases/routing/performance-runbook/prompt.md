---
description: A headless storefront slowdown is routed to the b2c-ops performance runbook and the metrics signals catalog, then to metrics_get, without terminal fallbacks or changes. The fixture has no client secret, so metrics calls fail at auth; only the routing is graded.
tags: [tier0, routing, metrics, runbook]
max_turns: 14
env:
  EVAL_MCP_PROJECT: sandbox-project
---

Our headless storefront got noticeably slower in production over the last couple of hours. Figure out where the time is going (APIs, hooks, caching, or something we call out to). Don't change anything.
