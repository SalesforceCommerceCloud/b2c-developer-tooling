---
description: A question about what runs when a custom hook is called is answered with project_inspect (hooks), naming the function callers invoke and its script.
tags: [tier0, project]
max_turns: 10
env:
  EVAL_MCP_PROJECT: overlay-project
---

When an order earns loyalty points, our code goes through the app.loyalty.order hook. Which function in which file actually runs?
