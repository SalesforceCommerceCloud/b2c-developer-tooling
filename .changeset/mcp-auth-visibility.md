---
'@salesforce/b2c-dx-mcp': minor
---

Instance tool results now include `resolution.auth`, and `config_inspect` includes `auth`, so agents can tell how WebDAV, OCAPI, and SCAPI requests authenticate and whether the user is signed in. A call that completed after a browser sign-in notes that later calls reuse the sign-in, including for other instances that use the same client.
