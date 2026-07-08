---
'@salesforce/b2c-agent-plugins': patch
---

Pin the `b2c-dx-mcp` Claude Code plugin to the exact published MCP server version instead of `@latest`. `npx` reuses a cached package for a floating tag, so users could keep running a stale server after an upgrade — pinning forces a fetch of the matching version. The pin is kept in sync automatically on each release.
