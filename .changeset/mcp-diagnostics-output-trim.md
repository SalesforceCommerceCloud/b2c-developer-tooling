---
'@salesforce/b2c-dx-mcp': patch
---

Smaller diagnostics output: `logs_get_recent` drops the duplicate `raw` field and truncates long messages (`maxMessageLength`, default 2000), and `debug_capture_at_breakpoint` omits global variables unless requested via `scopes`
