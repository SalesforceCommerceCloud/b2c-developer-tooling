---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-cli': patch
---

The SDK now ships the B2C skills that the MCP server and `b2c docs skill` serve. Apps can read them offline with `loadBundledGuidanceCatalog()` from `@salesforce/b2c-tooling-sdk/guidance`. The MCP and CLI read the same bundle, so skill URIs and content are unchanged.
