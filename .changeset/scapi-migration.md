---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': minor
'@salesforce/b2c-dx-docs': minor
---

Migrate `job`, `code`, `bm users`, and `bm roles` commands to support SCAPI alongside OCAPI. In auto mode (the default), the CLI prefers SCAPI when `shortCode` and `tenantId` are configured and silently falls back to OCAPI if the SCAPI scopes aren't granted. Use `--api-backend ocapi|scapi|auto` or `apiBackend` in dw.json to control explicitly. SCAPI scopes: `sfcc.jobs(.rw)`, `sfcc.scripts(.rw)`, `sfcc.users(.rw)`, `sfcc.roles(.rw)` — read-only scopes are honored for list/get operations, falling back to read-only when the `*.rw` scope is not granted. New `job execution delete` command (SCAPI only). `code deploy` and all VS Code extension code-version actions (list/activate/delete/reload/create plus active-version discovery) also honor `apiBackend`. `bm users update --disabled` transparently falls back to OCAPI in auto mode (SCAPI Users PATCH does not support the `disabled` flag). Auto mode only selects SCAPI when authentication can request the required scopes — stateless OAuth (client-credentials, JWT bearer); stateful and implicit flows fall back to OCAPI unless `--api-backend scapi` is set explicitly.
