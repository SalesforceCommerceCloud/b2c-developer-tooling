---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'b2c-vs-extension': minor
---

When no `cartridges` value is configured, `b2c project`, `b2c security`, the MCP `project_inspect` and `security_scan` tools, and the VS Code Cartridges view now order cartridges by a site's cartridge path from a `sites/<site-id>/site.xml` in the project (the latest migration or import set by timestamp prefix), so overlays compose the way the site runs them. Set `siteId` to choose the site.
