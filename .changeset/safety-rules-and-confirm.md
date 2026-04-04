---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-docs': patch
---

Added per-instance safety configuration with rule-based actions (allow/block/confirm) and interactive confirmation mode. Safety can now be configured in `dw.json` with granular rules for HTTP paths, job IDs, and CLI commands.
