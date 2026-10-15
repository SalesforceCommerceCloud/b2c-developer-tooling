---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add static outbound IP support to Managed Runtime (legacy backend only): `--[no-]static-ips-default` on `mrt project create/update`, `--[no-]static-ips` on `mrt env create/update`, and opt-in `static-ips-default` / `static-ips` columns for `mrt project list` / `mrt env list` (via `--columns`; not shown by default). Static IP values are not printed by `get`/`create`/`update`; `--json` returns `static_ips_default`, `ssr_static_ips` and `ssr_static_outbound_ips`. Omitting a flag sends nothing. Passing a static IP flag with `--mrt-backend scapi` is an error, and with `auto` it warns and is ignored when SCAPI serves the run. The SDK `createProject`/`updateProject`/`createProjectWithBackend`/`updateProjectWithBackend` accept `staticIpsDefault` and `createEnv`/`updateEnv`/`createEnvironmentWithBackend`/`updateEnvironmentWithBackend` accept `ssrStaticIps`.
