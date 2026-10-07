---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': patch
---

Local SCAPI contracts for MCP code mode can now be set in project configuration (dw.json `scapi-schemas` or `SFCC_SCAPI_SCHEMAS` in the project `.env`), so MCP plugin users can add beta APIs without changing the server's launch arguments. Relative paths resolve from the project directory; the `--scapi-schemas` flag still takes precedence.
