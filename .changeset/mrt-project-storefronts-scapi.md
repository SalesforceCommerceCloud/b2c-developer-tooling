---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`mrt project` (`list` / `create` / `get` / `update` / `delete`) is now backend-aware via `--mrt-backend`, running over the SCAPI Storefront Storefronts API (a project maps to a storefront) or the legacy MRT Cloud API; each command validates its backend-specific flags against the backend that runs.
