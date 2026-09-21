---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Make the `b2c mrt env var` family (`list` / `set` / `push` / `delete`) backend-aware, so environment variables can be read and written over the SCAPI Storefront Environments API (OAuth, scopes `sfcc.storefront.environments` for reads and `sfcc.storefront.environments.rw` for writes) instead of the legacy MRT Cloud API (per-user API key). Select the backend with `--mrt-backend` (`auto` | `legacy` | `scapi`, also `MRT_BACKEND` / `mrtBackend` in `dw.json`): `auto` prefers SCAPI when `--short-code`/`--tenant-id` and client-credentials or JWT Bearer auth are configured — otherwise legacy — and falls back to legacy on safe pre-execution errors; `scapi` never silently falls back. Over SCAPI, `set` and `delete` apply a merge-PATCH (only the keys you pass change; `delete` sends the key with a `null` value), and `push` pins every write to the backend its initial read resolved to, so a single `push` never crosses backends. The legacy path is unchanged.

Under `--json`, `env var list` returns the serving backend's native shape (legacy `{count, variables}` vs the SCAPI environment-variables map) — the human-readable table is normalized across backends, but `--json` is not, so pin `legacy` or `scapi` when a script needs a stable shape. All four commands now emit only their result object on stdout under `--json` (progress text is suppressed); `push --json` is non-interactive and requires `--yes` when there are changes to apply.
