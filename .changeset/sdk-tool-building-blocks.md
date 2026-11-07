---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': patch
---

Added SDK building blocks for apps that build their own B2C tools: buffered log watches you poll (`watchLogs`, `watchMrtLogs`), `waitForHalt()` and breakpoint tracking on `DebugSessionManager`, `resolveScapiDocuments()` for live tenant contracts with a bundled fallback, and `summarizeSeriesData()` for metrics. The MCP log watch, debugger, SCAPI search and metrics tools now use them. Debugger waits now report when the script debugger is disabled instead of timing out, instance log polls return as soon as an error arrives, and re-arming a breakpoint on the same line replaces it instead of adding a duplicate.
