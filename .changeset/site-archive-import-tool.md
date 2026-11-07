---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

Import site archive XML without a terminal or local archive folder. The new MCP tool `site_archive_import` (and SDK `importSiteArchiveFiles()`) validates files given as text against the bundled schemas, uploads nothing if one fails, then zips them and runs the site import job. Use it for data SCAPI cannot write yet, such as promotion discount rules; the SCAPI skill now explains how to create a promotion end to end.
