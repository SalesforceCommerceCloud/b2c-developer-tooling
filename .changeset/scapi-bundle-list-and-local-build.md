---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Extend the SCAPI MRT backend to `mrt bundle list` and the local-build push path of `mrt bundle deploy`. Both commands now honor `--mrt-backend` (`auto` | `legacy` | `scapi`): `list` fetches bundles from the SCAPI Storefront Deployments API, and `deploy` (without a bundle ID) uploads the local build — and optionally deploys it — over SCAPI. `auto` prefers SCAPI when short code, tenant ID, and client-credentials or JWT Bearer auth are configured, and falls back to legacy on safe pre-execution errors; `scapi` never silently falls back. `--json` output stays backend-native. The SDK adds `listMrtBundles`, `uploadBundleScapi`, and `pushMrtBundle` operations.
