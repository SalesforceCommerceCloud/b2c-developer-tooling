---
'@salesforce/b2c-agent-plugins': minor
---

Add a persona/category/tags taxonomy to every skill and ship a new `b2c-operator` plugin — a curated bundle of the operational skills (deploys, sandboxes, jobs, logs, debugging, edge/MRT, access administration) drawn from `b2c-cli` and `b2c` for those who run instances rather than author feature code. Install it instead of the broad plugins, not alongside, to avoid duplicating skills. Skills are now classified by persona (Developer, Operator/Admin) and tagged with cross-cutting topics (SCAPI, SLAS, Page Designer, diagnostics, headless, and more), powering an interactive catalog and curl-able index. Also fixes six broken cross-skill links in the SCAPI skills.
