---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Detect deprecated OCAPI instances and guide users to SCAPI.

When an instance has OCAPI disabled, `code`, `job`, `bm`, `sites`, and `cap` commands now fail with an actionable message — naming the exact SCAPI scope the operation needs (e.g. `sfcc.scripts` / `sfcc.scripts.rw`) — instead of an opaque "Failed to ..." error. Documentation and agent skills for `code`, `job`, and `bm` are now SCAPI-first, presenting OCAPI as the deprecated fallback.
