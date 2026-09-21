---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add a `--mrt-backend` flag (`auto` | `legacy` | `scapi`, default `auto`; also `MRT_BACKEND` env var or `mrtBackend` in `dw.json`) to `b2c mrt` commands. It lets `mrt bundle history` and `mrt bundle deploy <bundleId>` run over the SCAPI Storefront Deployments API (OAuth, scopes `sfcc.storefront.deployments[.rw]`) instead of the legacy MRT Cloud API (per-user API key). `auto` prefers SCAPI when `--short-code`/`--tenant-id` and client-credentials or JWT Bearer auth are configured, otherwise uses legacy, and falls back to legacy on safe pre-execution errors (surfacing the SCAPI error instead when no legacy credentials are configured, so the real failure isn't masked); `scapi` never silently falls back. All other MRT commands — and `mrt bundle deploy`'s local-build push path — remain on the legacy backend.

Under `--json`, these commands return the serving backend's native response verbatim (legacy `{count, next, previous, deployments}` vs SCAPI `{limit, offset, total, data}`) — the human-readable table is normalized across backends, but `--json` is not, so pin `legacy` or `scapi` when a script needs a stable shape. Legacy-only flags (`--api-key`, `--cloud-origin`, `--credentials-file`) now print a warning under `--mrt-backend scapi` (where the legacy backend that honors them never runs). `--project` also gains a `--storefront` / `-s` alias for the SCAPI storefront ID.
