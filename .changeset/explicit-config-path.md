---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
---

Fixed an explicit `--config` / `SFCC_CONFIG` path (or MCP `configPath`) also pulling in instances from the global default `dw.json`; the explicit file is now used on its own, and a missing file is reported. If you relied on instances from the global file, remove the explicit path or add those instances to the explicit file.
