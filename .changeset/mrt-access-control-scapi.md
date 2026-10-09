---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt env access-control` now supports full CRUD (`list` / `create` / `get` / `delete`) and is backend-aware via `--mrt-backend` (SCAPI Storefront Environments API or legacy MRT Cloud API); `delete` prompts for confirmation (`--force` / `-f` to skip) and header values stay masked on both backends.
