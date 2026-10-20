---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-dx-docs': patch
---

Removed the `mrt_bundle_push` MCP tool. Use `b2c mrt bundle deploy` or your project's push script (such as `sfnext push`) to publish Managed Runtime bundles. The `MRT` toolset now includes the MRT log tools.
