---
'@salesforce/b2c-tooling-sdk': patch
---

Fix two `b2c mrt` backend-selection issues. `SFCC_MRT_BACKEND` is now honored by `mrt` commands (previously only the unprefixed `MRT_BACKEND` was read, unlike the other `SFCC_`-prefixed MRT env vars). And `--mrt-backend legacy` no longer emits a spurious SCAPI `[StatefulAuth]` warning — the SCAPI backend is no longer probed when it cannot be used.
