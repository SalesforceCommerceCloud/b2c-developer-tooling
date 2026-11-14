---
description: A "basket totals stopped updating" report is traced with project_inspect (hooks) to the overlay's afterPOST hook returning a value, which skips the system implementation.
tags: [tier0, project]
max_turns: 12
env:
  EVAL_MCP_PROJECT: overlay-project
---

Since we added the loyalty changes, baskets created through our headless storefront don't get their totals calculated anymore. Nothing errors. What in our code could cause that?
