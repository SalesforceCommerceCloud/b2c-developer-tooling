---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Apply shared HTTP middleware to SLAS shopper token flows so custom headers such as `SFCC_EXTRA_HEADERS` reach every request. Preserve redirect and cancellation settings when adding extra request parameters, and document the token response shape.
