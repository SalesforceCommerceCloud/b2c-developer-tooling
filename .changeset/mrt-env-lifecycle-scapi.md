---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt env` lifecycle commands (`list` / `create` / `clone` / `get` / `update` / `delete` / `invalidate`) are now backend-aware: each command honors `--mrt-backend` and can run over the SCAPI Storefront Environments API (scopes `sfcc.storefront.environments` for reads, `sfcc.storefront.environments.rw` for writes) or the legacy MRT Cloud API, with `auto` falling back to legacy when no SCAPI connection is configured. On SCAPI an environment is addressed by `{organizationId, storefrontId, environmentId}`; `create` and `clone` require `--name` (display name) and provision asynchronously, `update` changes the display name only, and `createCacheInvalidation` is fire-and-forget (`202`, empty body). A new `mrt env set-primary` command promotes a ready (or build-failed) environment to primary; it is idempotent and SCAPI-only. `mrt env b2c` remains legacy-only and is unchanged.
