---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-agent-plugins': patch
---

Fixed the search-index job examples (`{"site_scope":["Site"]}`, not an object), documented system-job request bodies for CLI and MCP code mode, and stopped `--api-backend auto` from retrying SCAPI 400 (invalid request) errors over OCAPI, which hid the real error. When a fallback does happen and OCAPI also fails, both errors are reported.
