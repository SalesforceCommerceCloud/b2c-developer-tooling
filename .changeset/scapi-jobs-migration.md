---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add SCAPI Jobs API support with automatic backend selection. Job commands (`job run`, `job search`, `job wait`, `job log`) now use SCAPI when `shortCode` and `tenantId` are configured, falling back to OCAPI if SCAPI scopes are unavailable. Use `--api-backend ocapi|scapi|auto` or `apiBackend` in dw.json to control explicitly. New `job execution delete` command (SCAPI only) deletes job execution records.
