---
description: Live, read-only. A latency comparison on a real instance with Metrics API access. Grades whether the agent reads the metrics correctly (comparison window, volume, sparse series, tags), not the numbers themselves.
tags: [tier2, live, metrics, runbook]
max_turns: 20
env:
  EVAL_MCP_LIVE: '1'
---

Has our production storefront's API latency changed in the last hour compared with the same hour yesterday? If something stands out, tell me which part is responsible. Don't change anything.
