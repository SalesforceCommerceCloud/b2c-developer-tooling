---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-agent-plugins': patch
---

Pin the `b2c-dx-mcp` Claude Code plugin to the exact published MCP server version instead of `@latest`, and version its marketplace entry. `npx` reuses a cached package for a floating tag, so users could keep running a stale server (e.g. missing the latest docs tools) after an upgrade — an exact version forces a fetch, and versioning the marketplace entry makes clients re-pull the new pin. The pin and marketplace version track the MCP release automatically.
