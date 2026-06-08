---
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-tooling-sdk': patch
---

Documentation audit and repair pass: corrected stale CLI flag and command references across the CLI reference and guides, fixed broken examples (e.g. eCDN mTLS, sandbox `--no-*` flags, WebDAV `get` arguments), aligned SDK JSDoc with current signatures, and added the missing `operations/cap` typedoc entry point so the Commerce App SDK module appears in the API reference. Filled in JSDoc for previously undocumented public exports across the SDK (auth, clients, instance, logging, ods, mrt, cap, cip, debug, scaffold, schemas, skills, etc.) so the generated API docs cover the full public surface.
