---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Preserve published Salesforce Help child-topic links in generated Markdown and expose their exact documentation IDs through `relatedEntries` metadata so CLI and MCP readers can discover the full article content without surfacing future-profiled content.
