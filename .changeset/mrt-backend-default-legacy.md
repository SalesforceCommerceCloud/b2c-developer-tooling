---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-agent-plugins': patch
---

The default `--mrt-backend` is now `legacy` (the MRT Cloud API) instead of `auto`. MRT commands no longer auto-detect and prefer the SCAPI backend unless you opt in. To restore the previous behavior — prefer SCAPI when short code, tenant ID, and client-credentials/JWT Bearer auth are configured, otherwise fall back to legacy — pass `--mrt-backend auto` (or set `MRT_BACKEND=auto` / `mrtBackend` in `dw.json`). Use `--mrt-backend scapi` to require SCAPI with no fallback.
