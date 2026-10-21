---
'@salesforce/b2c-tooling-sdk': patch
---

`b2c logs list`, `logs get`, and `logs tail` now fail with a clear error when WebDAV refuses access to the Logs directory, instead of reporting "no logs" and exiting successfully. The error names the refused user or API client and how to fix it (a WebDAV access key, or WebDAV Client Permissions for `/logs`).
