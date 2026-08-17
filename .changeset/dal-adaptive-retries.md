---
'@salesforce/mrt-utilities': patch
---

Harden the data store's DynamoDB client against throttling: it now uses adaptive retries, a bounded number of attempts, and per-attempt connection/request timeouts so a slow or throttled call can no longer consume the whole request budget. Throttling failures are now distinguishable in error logs.
