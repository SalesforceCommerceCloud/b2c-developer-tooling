---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added `b2c bm users` command topic for managing instance-level Business Manager users via the OCAPI Data API: `list`, `get`, `search`, `whoami`, `update`, and `delete`. Also added `b2c bm users access-keys` (`get`, `create`, `set`, `delete`) for provisioning and rotating WebDAV/OCAPI/SCAPI access keys for externally-managed (AM/SSO) users. The SDK now exposes a matching `@salesforce/b2c-tooling-sdk/operations/bm-users` module.
