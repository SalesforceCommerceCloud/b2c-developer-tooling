---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'b2c-vs-extension': minor
'@salesforce/b2c-agent-plugins': patch
---

Expose the script debugger session cookie (`dwsid`) so you can route a triggering request to the same app server holding the debug session — required to reliably hit breakpoints on multi-app-server instances.

- **SDK:** new `SdapiClient.getCookie(name)` and `DebugSessionManager.getSessionCookie()`; the cookie is also logged at info level when the session connects.
- **MCP:** `debug_start_session` and `debug_list_sessions` now return a `session_cookie` field.
- **VS Code:** a new **Copy Debugger Session ID (dwsid)** command (available while a debug session is active) copies the cookie to the clipboard.

Send your triggering request (storefront page load, SCAPI/OCAPI call) with `Cookie: dwsid=<value>`.
