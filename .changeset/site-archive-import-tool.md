---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

New MCP tool `site_archive_import` imports site archive XML without a terminal: it validates the files first and imports nothing if one is invalid. Use it for data the Commerce API can't write yet, such as promotion discount rules; the SCAPI skill now walks through creating a promotion end to end.
