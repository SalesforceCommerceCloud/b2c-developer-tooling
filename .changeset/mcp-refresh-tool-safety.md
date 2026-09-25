---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-tooling-sdk': patch
---

Apply updated project and instance safety policies to each MCP tool call, including cartridge deployments, without restarting the server. Concurrent calls keep separate policies while preserving global restrictions and plugin middleware.
