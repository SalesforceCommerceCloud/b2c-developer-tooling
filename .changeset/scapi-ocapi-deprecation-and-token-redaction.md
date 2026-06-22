---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Detect deprecated OCAPI instances and stop leaking access tokens in error messages.

When an instance has OCAPI disabled, commands now fail with an actionable message directing you to configure SCAPI access, instead of an opaque "Failed to ..." error. Bearer tokens that B2C Commerce embeds in some authentication faults are now redacted from user-facing error messages (they were previously printed in full). Documentation and agent skills for `code`, `job`, and `bm` are now SCAPI-first, presenting OCAPI as the deprecated fallback.
