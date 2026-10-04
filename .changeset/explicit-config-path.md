---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
---

An explicit `--config` / `SFCC_CONFIG` path (or MCP `configPath`) is now used on its own, without the global default `dw.json`. If you relied on instances from the global file, remove the explicit path or add those instances to the explicit file.
