---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt env access-control` now supports full CRUD (`list` / `create` / `get` / `delete`) and is backend-aware: each command honors `--mrt-backend` and can run over the SCAPI Storefront Environments API (scopes `sfcc.storefront.environments` for reads, `sfcc.storefront.environments.rw` for writes) or the legacy MRT Cloud API. Header values stay masked on both backends.
