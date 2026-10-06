---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt project` (`list` / `create` / `get` / `update` / `delete`) is now backend-aware: each command honors `--mrt-backend` and can run over the SCAPI Storefront Storefronts API (scopes `sfcc.storefront.storefronts` for reads, `sfcc.storefront.storefronts.rw` for writes) or the legacy MRT Cloud API. A project maps to a SCAPI storefront — the storefront ID is the project slug and the organization is fixed by `--tenant-id`. Backend-specific flags are validated against the backend that runs: legacy `create` needs `--organization`, SCAPI `create` needs at least one `--site` (`--type` defaults to `storefront_next`); SCAPI `update` cannot rename a storefront and its `--site` fully replaces the assigned-sites set. SCAPI `create`/`delete` return `202` and provision asynchronously. `mrt project member` and `mrt project notification` remain legacy-only and reject `--mrt-backend scapi`.
