---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-tooling-sdk-python': patch
---

Fix browser sign-in with the built-in client, which Account Manager stopped accepting for PKCE. Sign-in no longer falls back to the deprecated implicit flow, and MCP tools that sign in through the built-in client no longer hang.
