---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt env redirect` now supports `get` / `update` alongside `list` / `create` / `delete` / `clone` and is backend-aware via `--mrt-backend` (SCAPI Storefront Environments API or legacy MRT Cloud API); `--columns fromPath,toUrl` keep working as aliases for the renamed `source` / `destination` columns, and `--search` is honored on the legacy backend only (it warns and is dropped on SCAPI).
