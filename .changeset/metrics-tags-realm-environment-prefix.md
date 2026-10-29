---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
---

Fix Metrics API series tags: `apiFamily`, `controller`, `host`, `ocapiCategory` and `statusClass` no longer include the `<realm>_<environment>` prefix, and empty placeholder series no longer get bogus dimensions.
