---
'@salesforce/b2c-dx-mcp': patch
---

- Telemetry send failures are no longer silently swallowed; they now log at debug level so deployment-monitoring drift is visible behind the `--debug` flag.
- `registerToolsets()` throws a clear error if invoked more than once for the same server instance (instead of producing a cryptic duplicate-tool error from the SDK).
