---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt env redirect` now supports `get` and `update` in addition to `list` / `create` / `delete` / `clone`, and every command is backend-aware: each honors `--mrt-backend` and can run over the SCAPI Storefront Environments API (scopes `sfcc.storefront.environments` for reads, `sfcc.storefront.environments.rw` for writes) or the legacy MRT Cloud API. The two backends identify a redirect differently (legacy source path vs SCAPI redirect ID), so `get` / `update` / `delete` take a neutral identifier; `update` is a partial update and `clone` rejects a same-source clone.
