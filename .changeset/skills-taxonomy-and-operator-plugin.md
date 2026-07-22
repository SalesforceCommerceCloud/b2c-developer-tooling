---
'@salesforce/b2c-agent-plugins': minor
---

Add a persona/category/tags taxonomy to every skill (with `alsoFor` for skills that serve more than one role) and ship a new `b2c-operator` plugin of operator/admin **runbooks** — a safe production code release & rollback procedure and a production incident-triage flow — that orchestrate the `b2c` CLI's code, logs, debugger, and analytics commands into guided, guard-railed workflows. Install `b2c-operator` alongside `b2c-cli`. Skills are now classified by persona (Developer, Operator/Admin) and tagged with cross-cutting topics (SCAPI, SLAS, Page Designer, diagnostics, headless, and more), powering an interactive catalog and a curl-able index. Also fixes six broken cross-skill links in the SCAPI skills.
