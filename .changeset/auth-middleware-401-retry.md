---
'@salesforce/b2c-tooling-sdk': patch
---

Add automatic 401 retry with token refresh to openapi-fetch middleware. This ensures API clients (OCAPI, SLAS, SCAPI, etc.) automatically refresh expired tokens during long-running operations.
