---
'b2c-vs-extension': minor
---

Add a B2C Operations (Jobs) experience to the VS Code extension:

- **Job History** — view execution history from the connected instance, including jobs that are currently running (shown live with a spinner and auto-refresh), with a table to search, filter (status, job, user, date, time presets), sort, and export runs to CSV/JSON. Each run has inline actions to open its log, view details, and re-run.
- **Job Definitions** — view the jobs (`jobs.xml`) and custom step types (`steptypes.json`) defined in your workspace cartridges, with actions to run, deploy, and open the source files.
- **Run / Re-run** — trigger a job (optionally with parameters), poll it to completion, and open its log automatically. Re-run reuses the original execution's parameters.
- **Create Job Scaffold** — generate a custom job step script, its `steptypes.json` registration, and a matching `jobs.xml` that references the registered `custom.*` step type.
- **Deploy Job Definition** — deploy a `jobs.xml` to register the job in Business Manager.

System (`sfcc-*`) jobs are distinguished from custom jobs, and actions that don't apply to them are disabled with an explanation.
