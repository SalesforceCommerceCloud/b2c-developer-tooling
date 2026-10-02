---
description: An operational ImportCatalog question that needs the job step reference (exit-status parameters, working folder, and the file-handling exception), not general knowledge.
tags: [tier0, docs, job-step, ablation]
max_turns: 10
---

Our nightly catalog import uses the standard ImportCatalog job step, reading XML files that land in `IMPEX/src/catalog/`. Two problems: on nights when no feed file arrives the job doesn't fail, and when a file is malformed the run only warns. I want both cases to fail the job so our alerting picks them up. Which step parameters should I set, and to what values? How should the folder be configured? And will a malformed file still get archived afterwards?
