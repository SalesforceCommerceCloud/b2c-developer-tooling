---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-mcp': patch
---

`parseSinceTime()` throws `InvalidTimeError`, whose message no longer names a CLI flag. The `logs_get_recent` MCP tool now says `Invalid since value`; `b2c logs get` still says `Invalid --since value`.
