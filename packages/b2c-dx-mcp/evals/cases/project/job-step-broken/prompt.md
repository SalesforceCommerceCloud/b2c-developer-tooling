---
description: A failing custom job step is traced with project_inspect (jobSteps) to a module that doesn't export the function the step calls.
tags: [tier0, project]
max_turns: 12
env:
  EVAL_MCP_PROJECT: overlay-project
---

Our loyalty cleanup job fails as soon as its step starts. What's wrong with it in our code, and how do we fix it?
