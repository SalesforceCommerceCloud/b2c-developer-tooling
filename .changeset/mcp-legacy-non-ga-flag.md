---
'@salesforce/b2c-dx-mcp': patch
---

Restore `--allow-non-ga-tools` as a deprecated no-op so existing MCP configurations continue to start after upgrading. The server logs a warning that the flag can be removed; tool availability is unchanged.
