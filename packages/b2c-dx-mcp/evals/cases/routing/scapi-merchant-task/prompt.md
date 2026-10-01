---
description: A merchant task with no dedicated tool is routed to SCAPI code mode (skill read first) instead of the terminal, the CLI or a Business Manager walkthrough. The fixture has no client secret, so calls fail at auth; only the routing is graded.
tags: [tier0, routing, scapi, skill-gate]
max_turns: 12
env:
  EVAL_MCP_PROJECT: sandbox-project
---

Take product `eval-tee-001` offline in the `storefront-catalog-m` catalog on my B2C Commerce instance.
