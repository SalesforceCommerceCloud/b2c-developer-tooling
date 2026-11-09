---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': patch
---

SCAPI code mode no longer exports Account Manager tokens: `auth.accountManager()` is removed. Use `b2c auth token` when an external client needs an Admin token. `auth.slas()` is now available only when a SLAS client is configured.
