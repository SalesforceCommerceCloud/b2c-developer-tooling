---
'@salesforce/b2c-tooling-sdk': patch
---

WebDAV uploads, downloads, listings and directory creation now retry once when the sandbox drops the connection, instead of failing with "socket hang up".
