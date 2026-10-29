---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-agent-plugins': patch
---

`webdav_get_to_file` now streams downloads of any size instead of stopping at 64 MiB, and `webdav_get` reads up to 32,000 bytes per call (was 8,000).
