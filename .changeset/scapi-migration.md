---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Migrate `job`, `code`, `bm users`, and `bm roles` commands to support SCAPI alongside OCAPI. In auto mode (the default), the CLI prefers SCAPI when `shortCode` and `tenantId` are configured and silently falls back to OCAPI if the SCAPI scopes aren't granted. Use `--api-backend ocapi|scapi|auto` or `apiBackend` in dw.json to control explicitly. SCAPI scopes: `sfcc.jobs.rw`, `sfcc.scripts.rw`, `sfcc.users.rw`, `sfcc.roles.rw`. New `job execution delete` command (SCAPI only).
