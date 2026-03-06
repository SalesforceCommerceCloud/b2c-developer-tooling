---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Introduces stateful authentication: `auth login` (browser/implicit), `auth logout`, `auth client` (client_credentials/password), `auth client renew`, and `auth client token`. Sessions are stored as a JSON file in the CLI data directory; when a valid session exists, all OAuth commands use it automatically without requiring credentials on every invocation.

**Note:** Sessions are not shared with `sfcc-ci`. Re-authenticate with `b2c auth login` or `b2c auth client` after upgrading. Existing stateless auth (env vars, `dw.json`) is unaffected.
