---
'@salesforce/b2c-dx-mcp': patch
---

Agents now read the SCAPI and CIP skills before calling `scapi_search`, `scapi_execute` or `cip_query`, instead of being rejected and retrying. `skillRead` is now a required argument, and the SCAPI tool descriptions are shorter, with code-mode details moved into the SCAPI skill.
