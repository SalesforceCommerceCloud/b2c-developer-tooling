---
description: Live, read-only. An outbound-services review on a real instance with Metrics API access. Grades host identification from tags, volume-paired latency and exception reads, and stated limits.
tags: [tier2, live, metrics, runbook]
max_turns: 20
env:
  EVAL_MCP_LIVE: '1'
---

Which external services does our production storefront call, and are any of them slow or throwing errors over the last hour? Don't change anything.
