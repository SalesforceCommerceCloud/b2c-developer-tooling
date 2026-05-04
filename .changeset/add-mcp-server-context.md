---
'@salesforce/b2c-dx-mcp': minor
---

Add `ServerContext` for persistent server-scoped state across MCP tool invocations. Enables stateful tools (debug sessions, log watches) while preserving per-call config reloading for existing tools.
