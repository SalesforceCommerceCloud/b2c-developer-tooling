---
'@salesforce/b2c-cli': patch
---

Refine b2c CLI skills (`scapi-schemas`, `scapi-custom`, `slas`, `ecdn`, `cip`, `users-roles`) to show config-first idiomatic usage. Examples now assume values like `tenantId`, `shortCode`, and `clientId` are resolved from `dw.json` / `SFCC_*` env vars, with flags shown only as overrides. This prevents coding agents from prompting users for values that are already configured.
