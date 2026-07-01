---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Stop MCP debug tools from routinely suggesting the session cookie (`dwsid`). The cookie is only needed in the rare multi-app-server production instance group case where a breakpoint is never hit — it is now surfaced as a troubleshooting hint on breakpoint timeout instead of in the `debug_start_session`/`debug_list_sessions` descriptions. Also clarifies that the debugger needs standard Basic auth (account password or a `WebDAV File Access and UX Studio` access key) with no separate Business Manager enablement step.
