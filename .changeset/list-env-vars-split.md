---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Fix comma-separated values in `SFCC_OAUTH_SCOPES`, `SFCC_AUTH_METHODS`, and `SFCC_IMPORT_SET_EXCLUDE`. Previously, multiple scopes made SCAPI-backed MRT commands report missing SCAPI auth, and multiple auth methods failed every OAuth command.
