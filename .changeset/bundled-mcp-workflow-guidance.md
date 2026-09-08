---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-docs': patch
---

Add offline skills for B2C CLI, Commerce development, and Storefront Next through MCP and a standalone SDK catalog. Skills are included with every toolset; users selecting individual tools can enable them by adding `skills_read` to `--tools`.

Browse the full library through `skill://index` and read any skill or reference through the resource template, or use `skills_read` for search and selected sections. Concise MCP server, configuration, and debugger skills remain available as resources with any tool selection; omitting `skills_read` excludes only the broader collections. Skills work independently of the project directory and need no Commerce credentials.
