---
'@salesforce/b2c-cli': patch
---

`b2c slas:client:get` now displays redirect URIs and callback URIs as lists (one per line) instead of the raw pipe-delimited strings returned by the SLAS API, matching the formatting used for scopes.
