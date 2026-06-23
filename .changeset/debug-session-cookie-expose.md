---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Expose the script debugger session cookie (`dwsid`). The SDK now provides `SdapiClient.getCookie(name)` and `DebugSessionManager.getSessionCookie()`, and the `debug_start_session` and `debug_list_sessions` MCP tools now return a `session_cookie` field. Send a triggering request (storefront page load, SCAPI/OCAPI call) with this cookie so it lands on the same app server holding the debug session — required to reliably hit breakpoints on multi-app-server instances.
