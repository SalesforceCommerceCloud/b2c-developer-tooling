---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt env` lifecycle commands (`list` / `create` / `clone` / `get` / `update` / `delete` / `invalidate`), plus a new SCAPI-only `mrt env set-primary`, are now backend-aware: `--mrt-backend` runs them over the SCAPI Storefront Environments API or the legacy MRT Cloud API, with `auto` falling back to legacy when no SCAPI connection is configured.
