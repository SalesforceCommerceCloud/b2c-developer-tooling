---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

`scapi_search` can now search your instance's live SCAPI schemas with `schemas: "live"`, including your custom attributes, custom APIs, and APIs newer than the bundled reference. `scapi_execute` can then call what it found on the same instance. Offline search is still the default.
